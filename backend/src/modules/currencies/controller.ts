import type { RequestHandler } from "express";

import type { CurrencyRates } from "#modules/currencies/schema";
import { getCurrencyRates, replaceCurrencyRates } from "#modules/currencies/service";
import { ifMatchHeader } from "#shared/middleware/preconditions";

export const readRates: RequestHandler<object, CurrencyRates> = async (_request, response) => {
  const { data, etag } = await getCurrencyRates();

  response.status(200).set("ETag", etag).json(data);
};

export const replaceRates: RequestHandler<object, CurrencyRates, CurrencyRates> = async (
  request,
  response,
) => {
  const { data, etag } = await replaceCurrencyRates(request.body, ifMatchHeader(request));

  response.status(200).set("ETag", etag).json(data);
};
