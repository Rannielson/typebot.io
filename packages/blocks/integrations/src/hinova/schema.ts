import { blockBaseSchema } from "@typebot.io/blocks-base/schemas";
import { z } from "@typebot.io/zod";
import { IntegrationBlockType } from "../constants";
import { HinovaAction } from "./constants";

const hinovaOptionsBaseSchema = z.object({
  credentialsId: z.string().optional(),
});

const initialHinovaOptionsSchema = hinovaOptionsBaseSchema.merge(
  z.object({
    action: z.undefined(),
  }),
);

const consultaVeiculoOptionsSchema = hinovaOptionsBaseSchema.merge(
  z.object({
    action: z.enum([HinovaAction.CONSULTA_VEICULO]),
    placa: z.string().optional(),
    codigoVeiculoVariableId: z.string().optional(),
    codigoFipeVariableId: z.string().optional(),
    descricaoSituacaoVariableId: z.string().optional(),
  }),
);

const buscaBoletoOptionsSchema = hinovaOptionsBaseSchema.merge(
  z.object({
    action: z.enum([HinovaAction.BUSCA_BOLETO]),
    codigoVeiculo: z.string().optional(),
    diasAntes: z.number().optional(),
    diasDepois: z.number().optional(),
    situacaoBoletoVariableId: z.string().optional(),
    dataVencimentoVariableId: z.string().optional(),
    pixCopiaColaVariableId: z.string().optional(),
    linkBoletoVariableId: z.string().optional(),
    linhaDigitavelVariableId: z.string().optional(),
    nossoNumeroVariableId: z.string().optional(),
    valorBoletoVariableId: z.string().optional(),
  }),
);

const buscaAssociadoOptionsSchema = hinovaOptionsBaseSchema.merge(
  z.object({
    action: z.enum([HinovaAction.BUSCA_ASSOCIADO]),
    cpf: z.string().optional(),
    veiculosVariableId: z.string().optional(),
  }),
);

export const hinovaOptionsSchemas = {
  v5: z.discriminatedUnion("action", [
    consultaVeiculoOptionsSchema,
    buscaBoletoOptionsSchema,
    buscaAssociadoOptionsSchema,
    initialHinovaOptionsSchema,
  ]),
  v6: z.discriminatedUnion("action", [
    consultaVeiculoOptionsSchema,
    buscaBoletoOptionsSchema,
    buscaAssociadoOptionsSchema,
    initialHinovaOptionsSchema,
  ]),
};

export const hinovaBlockV5Schema = blockBaseSchema.merge(
  z.object({
    type: z.enum([IntegrationBlockType.HINOVA]),
    options: hinovaOptionsSchemas.v5.optional(),
  }),
);

export const hinovaBlockSchemas = {
  v5: hinovaBlockV5Schema,
  v6: hinovaBlockV5Schema
    .merge(
      z.object({
        options: hinovaOptionsSchemas.v6.optional(),
      }),
    )
    .openapi({
      title: "Hinova",
      ref: "hinovaBlock",
    }),
};

export const hinovaBlockSchema = z.union([
  hinovaBlockSchemas.v5,
  hinovaBlockSchemas.v6,
]);

export type HinovaBlock = z.infer<typeof hinovaBlockSchema>;
export type HinovaBlockV5 = z.infer<typeof hinovaBlockSchemas.v5>;
export type HinovaBlockV6 = z.infer<typeof hinovaBlockSchemas.v6>;
export type HinovaOptionsBase = z.infer<typeof hinovaOptionsBaseSchema>;
export type ConsultaVeiculoOptions = z.infer<typeof consultaVeiculoOptionsSchema>;
export type BuscaBoletoOptions = z.infer<typeof buscaBoletoOptionsSchema>;
export type BuscaAssociadoOptions = z.infer<typeof buscaAssociadoOptionsSchema>;
