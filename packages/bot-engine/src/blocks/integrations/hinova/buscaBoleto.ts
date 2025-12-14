import type { BuscaBoletoOptions } from "@typebot.io/blocks-integrations/hinova/schema";
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

type BoletoResponse = {
  situacao_boleto: string;
  data_vencimento: string;
  pix?: {
    copia_cola?: string;
  };
  link_boleto?: string;
  linha_digitavel: string;
  nosso_numero: number | string;
  valor_boleto: string;
};

type BoletoResponseArray = BoletoResponse[];

/**
 * Formata uma data no formato DD/MM/YYYY
 */
const formatarData = (data: Date): string => {
  const dia = String(data.getDate()).padStart(2, "0");
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const ano = data.getFullYear();
  return `${dia}/${mes}/${ano}`;
};

export const buscaBoleto = async (
  options: BuscaBoletoOptions,
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

  if (!parsedOptions.codigoVeiculo) {
    return {
      outgoingEdgeId,
      logs: [
        {
          status: "error",
          description: "Código do veículo não informado",
        },
      ],
    };
  }

  const codigoVeiculo = parseVariables(parsedOptions.codigoVeiculo, {
    variables,
    sessionStore,
  });

  if (!codigoVeiculo) {
    return {
      outgoingEdgeId,
      logs: [
        {
          status: "error",
          description: "Código do veículo inválido",
        },
      ],
    };
  }

  // Calcular datas
  const diasAntes = options.diasAntes ?? 0;
  const diasDepois = options.diasDepois ?? 15;

  const hoje = new Date();
  const dataInicial = new Date(hoje);
  dataInicial.setDate(hoje.getDate() - diasAntes);

  const dataFinal = new Date(hoje);
  dataFinal.setDate(hoje.getDate() + diasDepois);

  const dataVencimentoOriginalInicial = formatarData(dataInicial);
  const dataVencimentoOriginalFinal = formatarData(dataFinal);

  const url = "https://api.hinova.com.br/api/sga/v2/listar/boleto-associado-veiculo";

  const body = {
    codigo_veiculo: codigoVeiculo,
    data_vencimento_original_inicial: dataVencimentoOriginalInicial,
    data_vencimento_original_final: dataVencimentoOriginalFinal,
  };

  try {
    const response = await ky.post(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      json: body,
    });

    const rawResponse = await response.text();
    const boletos = JSON.parse(rawResponse) as BoletoResponseArray;

    // Verificar se retornou boletos
    if (!boletos || !Array.isArray(boletos) || boletos.length === 0) {
      logs.push({
        status: "info",
        description: "Nenhum boleto encontrado no período especificado",
      });
      return {
        outgoingEdgeId,
        logs,
      };
    }

    // Pegar o primeiro boleto (ou você pode iterar sobre todos se necessário)
    const boleto = boletos[0];

    // Log detalhado para debug
    logs.push({
      status: "success",
      description: `${boletos.length} boleto(s) encontrado(s). Processando o primeiro: ${boleto.nosso_numero}`,
    });

    // Log dos dados do boleto para debug
    logs.push({
      status: "info",
      description: `Boleto dados: situacao=${boleto.situacao_boleto}, vencimento=${boleto.data_vencimento}, link=${boleto.link_boleto || "não informado"}, pix=${boleto.pix?.copia_cola ? "presente" : "não presente"}`,
    });

    const newVariables: VariableWithValue[] = [];

    // Salvar situacao_boleto
    if (options.situacaoBoletoVariableId) {
      const existingVariable = variables.find(
        byId(options.situacaoBoletoVariableId),
      );
      if (existingVariable) {
        newVariables.push({
          ...existingVariable,
          value: boleto.situacao_boleto || "",
        });
      }
    }

    // Salvar data_vencimento
    if (options.dataVencimentoVariableId) {
      const existingVariable = variables.find(
        byId(options.dataVencimentoVariableId),
      );
      if (existingVariable) {
        newVariables.push({
          ...existingVariable,
          value: boleto.data_vencimento || "",
        });
      }
    }

    // Salvar pix.copia_cola
    if (options.pixCopiaColaVariableId) {
      const existingVariable = variables.find(
        byId(options.pixCopiaColaVariableId),
      );
      if (existingVariable) {
        newVariables.push({
          ...existingVariable,
          value: boleto.pix?.copia_cola || "",
        });
      }
    }

    // Salvar link_boleto
    if (options.linkBoletoVariableId) {
      const existingVariable = variables.find(
        byId(options.linkBoletoVariableId),
      );
      if (existingVariable) {
        newVariables.push({
          ...existingVariable,
          value: boleto.link_boleto || "",
        });
      }
    }

    // Salvar linha_digitavel
    if (options.linhaDigitavelVariableId) {
      const existingVariable = variables.find(
        byId(options.linhaDigitavelVariableId),
      );
      if (existingVariable) {
        newVariables.push({
          ...existingVariable,
          value: boleto.linha_digitavel || "",
        });
      }
    }

    // Salvar nosso_numero
    if (options.nossoNumeroVariableId) {
      const existingVariable = variables.find(
        byId(options.nossoNumeroVariableId),
      );
      if (existingVariable) {
        newVariables.push({
          ...existingVariable,
          value: String(boleto.nosso_numero || ""),
        });
      }
    }

    // Salvar valor_boleto
    if (options.valorBoletoVariableId) {
      const existingVariable = variables.find(
        byId(options.valorBoletoVariableId),
      );
      if (existingVariable) {
        newVariables.push({
          ...existingVariable,
          value: boleto.valor_boleto || "",
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
          context: "Ao buscar boleto",
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
        context: "Ao buscar boleto",
      }),
    );
    return {
      outgoingEdgeId,
      logs,
    };
  }
};
