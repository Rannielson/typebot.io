import type { ConsultaVeiculoOptions } from "@typebot.io/blocks-integrations/hinova/schema";
import type { SessionState } from "@typebot.io/chat-session/schemas";
import { parseUnknownError } from "@typebot.io/lib/parseUnknownError";
import { byId, isDefined } from "@typebot.io/lib/utils";
import type { LogInSession } from "@typebot.io/logs/schemas";
import type { SessionStore } from "@typebot.io/runtime-session-store";
import { deepParseVariables } from "@typebot.io/variables/deepParseVariables";
import { parseVariables } from "@typebot.io/variables/parseVariables";
import type { VariableWithValue } from "@typebot.io/variables/schemas";
import ky, { HTTPError } from "ky";
import type { ExecuteIntegrationResponse } from "../../../types";
import { updateVariablesInSession } from "../../../updateVariablesInSession";

type VeiculoResponse = {
  codigo_veiculo: string;
  codigo_fipe: string;
  descricao_situacao: string;
  placa: string;
};

/**
 * Converte uma placa do formato antigo para o padrão Mercosul
 * Exemplo: ABC1234 -> ABC1C34
 */
const converterPlacaMercosul = (placa: string): string => {
  const placaLimpa = placa.toUpperCase().replace(/\s/g, "");
  const alfabeto = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let numerosEncontrados = 0;
  const caracteres = placaLimpa.split("");

  for (let i = 0; i < caracteres.length; i++) {
    if (!isNaN(Number(caracteres[i]))) {
      numerosEncontrados++;
      if (numerosEncontrados === 2) {
        const numero = parseInt(caracteres[i]);
        caracteres[i] = alfabeto[numero];
        break;
      }
    }
  }

  return caracteres.join("").toUpperCase();
};

export const consultaVeiculo = async (
  options: ConsultaVeiculoOptions,
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

  if (!parsedOptions.placa) {
    return {
      outgoingEdgeId,
      logs: [
        {
          status: "error",
          description: "Placa não informada",
        },
      ],
    };
  }

  const placa = parseVariables(parsedOptions.placa, {
    variables,
    sessionStore,
  });

  if (!placa) {
    return {
      outgoingEdgeId,
      logs: [
        {
          status: "error",
          description: "Placa inválida",
        },
      ],
    };
  }

  const url = `https://api.hinova.com.br/api/sga/v2/veiculo/buscar/${placa}`;

  try {
    // Primeira tentativa com a placa original
    let response = await ky.get(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    let rawResponse = await response.text();
    let veiculos = JSON.parse(rawResponse) as VeiculoResponse[];

    // Se não retornou resultado, tenta com placa convertida para Mercosul
    if (!veiculos || veiculos.length === 0) {
      const placaMercosul = converterPlacaMercosul(placa);
      logs.push({
        status: "info",
        description: `Placa original não encontrada, tentando com padrão Mercosul: ${placaMercosul}`,
      });

      const urlMercosul = `https://api.hinova.com.br/api/sga/v2/veiculo/buscar/${placaMercosul}`;
      response = await ky.get(urlMercosul, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      rawResponse = await response.text();
      veiculos = JSON.parse(rawResponse) as VeiculoResponse[];
    }

    // Se ainda não retornou, retorna "sem registro"
    if (!veiculos || veiculos.length === 0) {
      logs.push({
        status: "info",
        description: "Nenhum veículo encontrado",
      });

      const newVariables: VariableWithValue[] = [];

      // Salvar "sem registro" nas variáveis se configuradas
      if (options.codigoVeiculoVariableId) {
        const existingVariable = variables.find(
          byId(options.codigoVeiculoVariableId),
        );
        if (existingVariable) {
          newVariables.push({
            ...existingVariable,
            value: "sem registro",
          });
        }
      }

      if (options.codigoFipeVariableId) {
        const existingVariable = variables.find(
          byId(options.codigoFipeVariableId),
        );
        if (existingVariable) {
          newVariables.push({
            ...existingVariable,
            value: "sem registro",
          });
        }
      }

      if (options.descricaoSituacaoVariableId) {
        const existingVariable = variables.find(
          byId(options.descricaoSituacaoVariableId),
        );
        if (existingVariable) {
          newVariables.push({
            ...existingVariable,
            value: "sem registro",
          });
        }
      }

      if (newVariables.length > 0) {
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

      return {
        outgoingEdgeId,
        logs,
      };
    }

    // Pegar o primeiro veículo retornado
    const veiculo = veiculos[0];

    logs.push({
      status: "success",
      description: `Veículo encontrado: ${veiculo.placa}`,
    });

    const newVariables: VariableWithValue[] = [];

    // Salvar codigo_veiculo
    if (options.codigoVeiculoVariableId) {
      const existingVariable = variables.find(
        byId(options.codigoVeiculoVariableId),
      );
      if (existingVariable) {
        newVariables.push({
          ...existingVariable,
          value: veiculo.codigo_veiculo || "",
        });
      }
    }

    // Salvar codigo_fipe
    if (options.codigoFipeVariableId) {
      const existingVariable = variables.find(
        byId(options.codigoFipeVariableId),
      );
      if (existingVariable) {
        newVariables.push({
          ...existingVariable,
          value: veiculo.codigo_fipe || "",
        });
      }
    }

    // Salvar descricao_situacao
    if (options.descricaoSituacaoVariableId) {
      const existingVariable = variables.find(
        byId(options.descricaoSituacaoVariableId),
      );
      if (existingVariable) {
        newVariables.push({
          ...existingVariable,
          value: veiculo.descricao_situacao || "",
        });
      }
    }

    if (newVariables.length > 0) {
      const { updatedState, newSetVariableHistory } = updateVariablesInSession({
        state,
        newVariables,
        currentBlockId: blockId,
      });

      return {
        outgoingEdgeId,
        newSessionState: updatedState,
        newSetVariableHistory,
        logs,
      };
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
          context: "Ao consultar veículo",
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
        context: "Ao consultar veículo",
      }),
    );
    return {
      outgoingEdgeId,
      logs,
    };
  }
};
