import type { BuscaAssociadoOptions } from "@typebot.io/blocks-integrations/hinova/schema";
import type { SessionState } from "@typebot.io/chat-session/schemas";
import { parseUnknownError } from "@typebot.io/lib/parseUnknownError";
import { byId } from "@typebot.io/lib/utils";
import type { LogInSession } from "@typebot.io/logs/schemas";
import type { SessionStore } from "@typebot.io/runtime-session-store";
import { deepParseVariables } from "@typebot.io/variables/deepParseVariables";
import { parseVariables } from "@typebot.io/variables/parseVariables";
import type { VariableWithValue } from "@typebot.io/variables/schemas";
import ky, { HTTPError } from "ky";
import type { ExecuteIntegrationResponse } from "../../../types";
import { updateVariablesInSession } from "../../../updateVariablesInSession";

type VeiculoAssociado = {
  codigo_veiculo: string;
  placa: string;
  descricao_modelo: string;
  situacao: string;
};

type AssociadoResponse = {
  veiculos: VeiculoAssociado[];
};

export const buscaAssociado = async (
  options: BuscaAssociadoOptions,
  {
    blockId,
    state,
    sessionStore,
    token,
    outgoingEdgeId,
  }: {
    blockId: string;
    outgoingEdgeId?: string;
    state: SessionState;
    sessionStore: SessionStore;
    token: string;
  },
): Promise<ExecuteIntegrationResponse> => {
  const logs: LogInSession[] = [];
  const { variables } = state.typebotsQueue[0].typebot;

  const parsedOptions = deepParseVariables(options, {
    variables,
    removeEmptyStrings: true,
    sessionStore,
  });

  if (!parsedOptions.cpf) {
    return {
      outgoingEdgeId,
      logs: [
        {
          status: "error",
          description: "CPF não informado",
        },
      ],
    };
  }

  const cpf = parseVariables(parsedOptions.cpf, {
    variables,
    sessionStore,
  });

  if (!cpf) {
    return {
      outgoingEdgeId,
      logs: [
        {
          status: "error",
          description: "CPF inválido",
        },
      ],
    };
  }

  // Remover formatação do CPF (pontos, traços, espaços)
  const cpfLimpo = cpf.replace(/[.\-\s]/g, "");

  const url = `https://api.hinova.com.br/api/sga/v2/associado/buscar/${cpfLimpo}`;

  try {
    const response = await ky.get(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const rawResponse = await response.text();
    const associado = JSON.parse(rawResponse) as AssociadoResponse;

    if (!associado.veiculos || associado.veiculos.length === 0) {
      logs.push({
        status: "info",
        description: "Nenhum veículo encontrado para o associado",
      });

      return {
        outgoingEdgeId,
        logs,
      };
    }

    logs.push({
      status: "success",
      description: `${associado.veiculos.length} veículo(s) encontrado(s)`,
    });

    // Preparar dados dos veículos para salvar
    // Se há apenas uma variável configurada, salvar como JSON string
    // Caso contrário, salvar cada veículo em variáveis separadas
    if (options.veiculosVariableId) {
      const existingVariable = variables.find(
        byId(options.veiculosVariableId),
      );
      if (existingVariable) {
        // Salvar como array JSON
        const veiculosData = associado.veiculos.map((veiculo) => ({
          codigo_veiculo: veiculo.codigo_veiculo,
          placa: veiculo.placa,
          descricao_modelo: veiculo.descricao_modelo,
          situacao: veiculo.situacao,
        }));

        const newVariables: VariableWithValue[] = [
          {
            ...existingVariable,
            value: JSON.stringify(veiculosData),
          },
        ];

        const { updatedState, newSetVariableHistory } = updateVariablesInSession(
          {
            state,
            newVariables,
            currentBlockId: blockId,
          },
        );

        return {
          outgoingEdgeId,
          newSessionState: updatedState,
          newSetVariableHistory,
          logs,
        };
      }
    }

    return {
      outgoingEdgeId,
      logs,
    };
  } catch (error) {
    if (error instanceof HTTPError) {
      logs.push(
        await parseUnknownError({
          err: error,
          context: "Ao buscar associado",
        }),
      );
      return {
        outgoingEdgeId,
        logs,
      };
    }
    logs.push(
      await parseUnknownError({
        err: error,
        context: "Ao buscar associado",
      }),
    );
    return {
      outgoingEdgeId,
      logs,
    };
  }
};
