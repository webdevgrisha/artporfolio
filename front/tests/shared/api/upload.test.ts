import { HttpResponse, http as mswHttp } from "msw/http";
import { beforeEach, describe, expect, it } from "vitest";

import { HttpError } from "@/shared/api/httpError";
import { getUploadErrorMessage, UploadError, uploadImage } from "@/shared/api/upload";

import { csrfHandler, problem } from "../../support/handlers";
import { imageFile } from "../../support/images";
import { server } from "../../support/server";

beforeEach(() => {
  server.use(csrfHandler);
});

describe("uploadImage", () => {
  it("sends the file alone and returns the id of the upload", async () => {
    const fields: string[] = [];
    server.use(
      mswHttp.post("/api/uploads", async ({ request }) => {
        (await request.formData()).forEach((_value, name) => {
          fields.push(name);
        });
        return HttpResponse.json({ upload: { id: "upload-1" } }, { status: 201 });
      }),
    );

    await expect(uploadImage(imageFile())).resolves.toBe("upload-1");
    expect(fields).toEqual(["file"]);
  });

  it("rejects with the name of the file that was not uploaded", async () => {
    server.use(mswHttp.post("/api/uploads", () => problem(413)));

    const error = await uploadImage(imageFile("etude.png")).catch(
      (rejection: unknown) => rejection,
    );

    expect(error).toBeInstanceOf(UploadError);
    expect(error).toMatchObject({ cause: new HttpError(413), fileName: "etude.png" });
  });
});

describe("getUploadErrorMessage", () => {
  it("names the file", () => {
    expect(getUploadErrorMessage(new UploadError("etude.png", new HttpError(400)))).toBe(
      "Сервер не принял фото «etude.png». Попробуйте другой файл",
    );
  });
});
