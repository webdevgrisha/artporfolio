import type { RequestHandler } from "express";

import type { SubscribeBody } from "#modules/newsletter/schema";
import { addSubscriber } from "#modules/newsletter/service";

export const createSubscriber: RequestHandler<object, undefined, SubscribeBody> = async (
  request,
  response,
) => {
  await addSubscriber(request.body);
  response.status(204).end();
};
