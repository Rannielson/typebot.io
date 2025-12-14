import { IntegrationBlockType } from "@typebot.io/blocks-integrations/constants";
import type { HinovaBlock } from "@typebot.io/blocks-integrations/hinova/schema";
import { HinovaAction } from "@typebot.io/blocks-integrations/hinova/constants";
import type { SessionState } from "@typebot.io/chat-session/schemas";
import { decrypt } from "@typebot.io/credentials/decrypt";
import { getCredentials } from "@typebot.io/credentials/getCredentials";
import { hinovaCredentialsSchema } from "@typebot.io/credentials/schemas";
import type { LogInSession } from "@typebot.io/logs/schemas";
import type { SessionStore } from "@typebot.io/runtime-session-store";
import type { ExecuteIntegrationResponse } from "../../../types";
import { consultaVeiculo } from "./consultaVeiculo";
import { buscaBoleto } from "./buscaBoleto";
import { buscaAssociado } from "./buscaAssociado";

export const executeHinovaBlock = async (
  block: HinovaBlock,
  { sessionStore, state }: { sessionStore: SessionStore; state: SessionState },
): Promise<ExecuteIntegrationResponse> => {
  if (!block.options) return { outgoingEdgeId: block.outgoingEdgeId };
  const action = block.options.action;
  if (!action) return { outgoingEdgeId: block.outgoingEdgeId };

  // Validar credenciais
  if (!block.options.credentialsId) {
    return {
      outgoingEdgeId: block.outgoingEdgeId,
      logs: [
        {
          status: "error",
          description: "Missing credentialsId",
        },
      ],
    };
  }

  // Obter credenciais
  const credentials = await getCredentials(
    block.options.credentialsId,
    state.workspaceId,
  );
  if (!credentials) {
    return {
      outgoingEdgeId: block.outgoingEdgeId,
      logs: [
        {
          status: "error",
          description: "Credentials not found",
        },
      ],
    };
  }

  // Descriptografar token
  const decryptedData = await decrypt(credentials.data, credentials.iv);
  const hinovaData = hinovaCredentialsSchema.shape.data.parse(decryptedData);
  const token = hinovaData.token;

  switch (action) {
    case HinovaAction.CONSULTA_VEICULO:
      return consultaVeiculo(block.options, {
        blockId: block.id,
        state,
        sessionStore,
        token,
        outgoingEdgeId: block.outgoingEdgeId,
      });
    case HinovaAction.BUSCA_BOLETO:
      return buscaBoleto(block.options, {
        blockId: block.id,
        state,
        sessionStore,
        token,
        outgoingEdgeId: block.outgoingEdgeId,
      });
    case HinovaAction.BUSCA_ASSOCIADO:
      return buscaAssociado(block.options, {
        blockId: block.id,
        state,
        sessionStore,
        token,
        outgoingEdgeId: block.outgoingEdgeId,
      });
  }
};
