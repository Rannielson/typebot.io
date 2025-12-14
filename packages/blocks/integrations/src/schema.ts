import { z } from "@typebot.io/zod";
import { atomosChatBlockSchemas } from "./atomosChat/schema";
import { chatwootBlockSchema } from "./chatwoot/schema";
import { googleAnalyticsBlockSchema } from "./googleAnalytics/schema";
import { googleSheetsBlockSchemas } from "./googleSheets/schema";
import { hinovaBlockSchemas } from "./hinova/schema";
import { httpBlockSchemas } from "./httpRequest/schema";
import { makeComBlockSchemas } from "./makeCom/schema";
import { openAIBlockSchema } from "./openai/schema";
import { pabblyConnectBlockSchemas } from "./pabblyConnect/schema";
import { pixelBlockSchema } from "./pixel/schema";
import { sendEmailBlockSchema } from "./sendEmail/schema";
import { zapierBlockSchemas } from "./zapier/schema";

const integrationBlockSchemas = [
  chatwootBlockSchema,
  googleAnalyticsBlockSchema,
  openAIBlockSchema,
  sendEmailBlockSchema,
  pixelBlockSchema,
] as const;

export const integrationBlockV5Schema = z.discriminatedUnion("type", [
  ...integrationBlockSchemas,
  googleSheetsBlockSchemas.v5,
  makeComBlockSchemas.v5,
  pabblyConnectBlockSchemas.v5,
  httpBlockSchemas.v5,
  zapierBlockSchemas.v5,
  atomosChatBlockSchemas.v5,
  hinovaBlockSchemas.v5,
]);
export type IntegrationBlockV5 = z.infer<typeof integrationBlockV5Schema>;

export const integrationBlockV6Schema = z.discriminatedUnion("type", [
  ...integrationBlockSchemas,
  googleSheetsBlockSchemas.v6,
  makeComBlockSchemas.v6,
  pabblyConnectBlockSchemas.v6,
  httpBlockSchemas.v6,
  zapierBlockSchemas.v6,
  atomosChatBlockSchemas.v6,
  hinovaBlockSchemas.v6,
]);
export type IntegrationBlockV6 = z.infer<typeof integrationBlockV6Schema>;

export type IntegrationBlock = IntegrationBlockV5 | IntegrationBlockV6;
