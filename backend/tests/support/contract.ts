import { readFileSync } from "node:fs";

import { Ajv2020, type ValidateFunction } from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import type { RequestHandler } from "express";
import { parse } from "yaml";

type Method = "delete" | "get" | "patch" | "post" | "put";

interface Reference {
  $ref: string;
}

interface ResponseObject {
  content?: Record<string, { schema: object }>;
  description: string;
}

/** The parts of the OpenAPI document that the contract check reads. */
interface OpenApiDocument {
  components: { responses: Record<string, ResponseObject> };
  paths: Record<
    string,
    Partial<Record<Method, { responses: Record<string, ResponseObject | Reference> }>>
  >;
}

interface Operation {
  method: Method;
  path: string;
  responses: Record<string, ResponseObject | Reference>;
}

// The committed document: tests/openapi.test.ts keeps it equal to the generated one.
const document = parse(
  readFileSync(new URL("../../openapi/openapi.yaml", import.meta.url), "utf8"),
) as OpenApiDocument;
const ajv = new Ajv2020({ allErrors: true, strict: false });
const validators = new Map<string, ValidateFunction>();

addFormats.default(ajv);

/**
 * Responses that break the OpenAPI document, collected by checkContract. tests/support/setup.ts
 * fails the test that caused any of them.
 */
export const contractViolations: string[] = [];

function templatePattern(path: string): RegExp {
  return new RegExp(`^${path.replaceAll(/\{[^}]+\}/g, "[^/]+")}$`);
}

/** A literal path wins over a template, as in Express: /order is not the photo "order". */
function findOperation(method: string, path: string): Operation | undefined {
  const key = method.toLowerCase() as Method;
  const template =
    document.paths[path]?.[key] !== undefined
      ? path
      : Object.keys(document.paths).find((candidate) => templatePattern(candidate).test(path));
  const responses = template === undefined ? undefined : document.paths[template]?.[key]?.responses;

  return template === undefined || !responses
    ? undefined
    : { method: key, path: template, responses };
}

function resolveResponse(response: ResponseObject | Reference): ResponseObject {
  if (!("$ref" in response)) {
    return response;
  }

  const resolved =
    document.components.responses[response.$ref.replace("#/components/responses/", "")];

  if (!resolved) {
    throw new Error(`Unknown response ${response.$ref}`);
  }

  return resolved;
}

/**
 * Any operation may answer these, as the document description says: a request from an origin
 * outside the CORS allowlist gets 403, and an unexpected error 500.
 */
const anyOperationStatuses = new Set([403, 500]);

const problemResponse: ResponseObject = {
  description: "Problem Details",
  content: {
    "application/problem+json": { schema: { $ref: "#/components/schemas/ProblemDetails" } },
  },
};

function validatorFor(key: string, schema: object) {
  let validate = validators.get(key);

  if (!validate) {
    // The schemas refer to #/components, so the components sit at the root of each one.
    validate = ajv.compile({ components: document.components, ...schema });
    validators.set(key, validate);
  }

  return validate;
}

interface SentResponse {
  body: unknown;
  contentType: string | undefined;
  hasBody: boolean;
  status: number;
}

function findViolation(operation: Operation, sent: SentResponse): string | undefined {
  const documented = operation.responses[String(sent.status)];
  const response =
    documented === undefined
      ? anyOperationStatuses.has(sent.status)
        ? problemResponse
        : undefined
      : resolveResponse(documented);

  if (!response) {
    return "the status is not documented";
  }

  if (!response.content) {
    return sent.hasBody ? "a body was sent where none is documented" : undefined;
  }

  const mediaType = sent.contentType?.split(";")[0]?.trim() ?? "";
  const schema = response.content[mediaType]?.schema;

  if (!schema) {
    return `the Content-Type "${mediaType}" is not documented`;
  }

  const validate = validatorFor(
    `${operation.method} ${operation.path} ${String(sent.status)} ${mediaType}`,
    schema,
  );

  return validate(sent.body) ? undefined : ajv.errorsText(validate.errors);
}

/** Checks every response to a documented operation against the OpenAPI document. */
export const checkContract: RequestHandler = (request, response, next) => {
  const { method, path } = request;
  const operation = findOperation(method, path);

  if (!operation) {
    next();
    return;
  }

  const sendJson = response.json.bind(response);
  const sent: Omit<SentResponse, "contentType" | "status"> = { body: undefined, hasBody: false };

  response.json = (body: unknown) => {
    sent.body = body;
    sent.hasBody = true;
    return sendJson(body);
  };

  response.on("finish", () => {
    const violation = findViolation(operation, {
      ...sent,
      contentType: response.get("Content-Type"),
      status: response.statusCode,
    });

    if (violation) {
      contractViolations.push(`${method} ${path} → ${String(response.statusCode)}: ${violation}`);
    }
  });

  next();
};
