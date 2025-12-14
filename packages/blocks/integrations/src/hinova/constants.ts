import type { HinovaBlock } from "./schema";

export enum HinovaAction {
  CONSULTA_VEICULO = "Consulta Veículo",
  BUSCA_BOLETO = "Busca Boleto",
  BUSCA_ASSOCIADO = "Busca Associado",
}

export const defaultHinovaOptions = {
  action: HinovaAction.CONSULTA_VEICULO,
} as const satisfies HinovaBlock["options"];
