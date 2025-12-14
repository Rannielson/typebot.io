import { HinovaAction } from "@typebot.io/blocks-integrations/hinova/constants";
import type { HinovaBlock } from "@typebot.io/blocks-integrations/hinova/schema";
import { Field } from "@typebot.io/ui/components/Field";
import { Input } from "@typebot.io/ui/components/Input";
import { useOpenControls } from "@typebot.io/ui/hooks/useOpenControls";
import { BasicSelect } from "@/components/inputs/BasicSelect";
import { DebouncedTextInputWithVariablesButton } from "@/components/inputs/DebouncedTextInput";
import { VariablesCombobox } from "@/components/inputs/VariablesCombobox";
import { CredentialsDropdown } from "@/features/credentials/components/CredentialsDropdown";
import { useWorkspace } from "@/features/workspace/WorkspaceProvider";
import { HinovaCredentialsDialog } from "./HinovaCredentialsDialog";

type Props = {
  block: HinovaBlock;
  onOptionsChange: (options: HinovaBlock["options"]) => void;
};

export const HinovaSettings = ({
  block: { options },
  onOptionsChange,
}: Props) => {
  const { workspace } = useWorkspace();
  const { isOpen, onOpen, onClose } = useOpenControls();

  const handleCredentialsIdChange = (credentialsId: string | undefined) =>
    onOptionsChange({
      ...options,
      credentialsId,
    });

  const handleActionChange = (action: HinovaAction | undefined) =>
    onOptionsChange({
      credentialsId: options?.credentialsId,
      action,
    });

  return (
    <div className="flex flex-col gap-4">
      {workspace && (
        <>
          <CredentialsDropdown
            type="hinova"
            scope={{ type: "workspace", workspaceId: workspace.id }}
            currentCredentialsId={options?.credentialsId}
            onCredentialsSelect={handleCredentialsIdChange}
            onCreateNewClick={onOpen}
            credentialsName="Hinova account"
          />
          <HinovaCredentialsDialog
            isOpen={isOpen}
            onClose={onClose}
            onNewCredentials={handleCredentialsIdChange}
          />
        </>
      )}
      {options?.credentialsId && (
        <BasicSelect
          value={options?.action}
          onChange={handleActionChange}
          items={Object.values(HinovaAction)}
          placeholder="Select an action"
        />
      )}
      {options?.action && (
        <ActionOptions
          options={options}
          onOptionsChange={onOptionsChange}
        />
      )}
    </div>
  );
};

const ActionOptions = ({
  options,
  onOptionsChange,
}: {
  options: HinovaBlock["options"];
  onOptionsChange: (options: HinovaBlock["options"]) => void;
}) => {
  if (!options?.action) return null;

  switch (options.action) {
    case HinovaAction.CONSULTA_VEICULO:
      return (
        <>
          <Field.Root>
            <Field.Label>Placa</Field.Label>
            <DebouncedTextInputWithVariablesButton
              placeholder="e.g. ABC1234 ou {{placa}}"
              defaultValue={options.placa}
              onValueChange={(placa) =>
                onOptionsChange({
                  ...options,
                  placa,
                })
              }
            />
          </Field.Root>
          <Field.Root>
            <Field.Label>Salvar código do veículo em</Field.Label>
            <VariablesCombobox
              onSelectVariable={(variable) =>
                onOptionsChange({
                  ...options,
                  codigoVeiculoVariableId: variable?.id,
                })
              }
              initialVariableId={options.codigoVeiculoVariableId}
            />
          </Field.Root>
          <Field.Root>
            <Field.Label>Salvar código FIPE em</Field.Label>
            <VariablesCombobox
              onSelectVariable={(variable) =>
                onOptionsChange({
                  ...options,
                  codigoFipeVariableId: variable?.id,
                })
              }
              initialVariableId={options.codigoFipeVariableId}
            />
          </Field.Root>
          <Field.Root>
            <Field.Label>Salvar descrição da situação em</Field.Label>
            <VariablesCombobox
              onSelectVariable={(variable) =>
                onOptionsChange({
                  ...options,
                  descricaoSituacaoVariableId: variable?.id,
                })
              }
              initialVariableId={options.descricaoSituacaoVariableId}
            />
          </Field.Root>
        </>
      );

    case HinovaAction.BUSCA_BOLETO:
      return (
        <>
          <Field.Root>
            <Field.Label>Código do Veículo</Field.Label>
            <DebouncedTextInputWithVariablesButton
              placeholder="e.g. {{codigo_veiculo}}"
              defaultValue={options.codigoVeiculo}
              onValueChange={(codigoVeiculo) =>
                onOptionsChange({
                  ...options,
                  codigoVeiculo,
                })
              }
            />
          </Field.Root>
          <Field.Root>
            <Field.Label>Dias antes (padrão: 0)</Field.Label>
            <Input
              type="number"
              defaultValue={options.diasAntes?.toString() ?? "0"}
              onValueChange={(value) =>
                onOptionsChange({
                  ...options,
                  diasAntes: value ? parseInt(value, 10) : 0,
                })
              }
              placeholder="0"
            />
          </Field.Root>
          <Field.Root>
            <Field.Label>Dias depois (padrão: 15)</Field.Label>
            <Input
              type="number"
              defaultValue={options.diasDepois?.toString() ?? "15"}
              onValueChange={(value) =>
                onOptionsChange({
                  ...options,
                  diasDepois: value ? parseInt(value, 10) : 15,
                })
              }
              placeholder="15"
            />
          </Field.Root>
          <Field.Root>
            <Field.Label>Salvar situação do boleto em</Field.Label>
            <VariablesCombobox
              onSelectVariable={(variable) =>
                onOptionsChange({
                  ...options,
                  situacaoBoletoVariableId: variable?.id,
                })
              }
              initialVariableId={options.situacaoBoletoVariableId}
            />
          </Field.Root>
          <Field.Root>
            <Field.Label>Salvar data de vencimento em</Field.Label>
            <VariablesCombobox
              onSelectVariable={(variable) =>
                onOptionsChange({
                  ...options,
                  dataVencimentoVariableId: variable?.id,
                })
              }
              initialVariableId={options.dataVencimentoVariableId}
            />
          </Field.Root>
          <Field.Root>
            <Field.Label>Salvar PIX (copia e cola) em</Field.Label>
            <VariablesCombobox
              onSelectVariable={(variable) =>
                onOptionsChange({
                  ...options,
                  pixCopiaColaVariableId: variable?.id,
                })
              }
              initialVariableId={options.pixCopiaColaVariableId}
            />
          </Field.Root>
          <Field.Root>
            <Field.Label>Salvar link do boleto em</Field.Label>
            <VariablesCombobox
              onSelectVariable={(variable) =>
                onOptionsChange({
                  ...options,
                  linkBoletoVariableId: variable?.id,
                })
              }
              initialVariableId={options.linkBoletoVariableId}
            />
          </Field.Root>
          <Field.Root>
            <Field.Label>Salvar linha digitável em</Field.Label>
            <VariablesCombobox
              onSelectVariable={(variable) =>
                onOptionsChange({
                  ...options,
                  linhaDigitavelVariableId: variable?.id,
                })
              }
              initialVariableId={options.linhaDigitavelVariableId}
            />
          </Field.Root>
          <Field.Root>
            <Field.Label>Salvar nosso número em</Field.Label>
            <VariablesCombobox
              onSelectVariable={(variable) =>
                onOptionsChange({
                  ...options,
                  nossoNumeroVariableId: variable?.id,
                })
              }
              initialVariableId={options.nossoNumeroVariableId}
            />
          </Field.Root>
          <Field.Root>
            <Field.Label>Salvar valor do boleto em</Field.Label>
            <VariablesCombobox
              onSelectVariable={(variable) =>
                onOptionsChange({
                  ...options,
                  valorBoletoVariableId: variable?.id,
                })
              }
              initialVariableId={options.valorBoletoVariableId}
            />
          </Field.Root>
        </>
      );

    case HinovaAction.BUSCA_ASSOCIADO:
      return (
        <>
          <Field.Root>
            <Field.Label>CPF</Field.Label>
            <DebouncedTextInputWithVariablesButton
              placeholder="e.g. 12345678900 ou {{cpf}}"
              defaultValue={options.cpf}
              onValueChange={(cpf) =>
                onOptionsChange({
                  ...options,
                  cpf,
                })
              }
            />
          </Field.Root>
          <Field.Root>
            <Field.Label>Salvar veículos em</Field.Label>
            <VariablesCombobox
              onSelectVariable={(variable) =>
                onOptionsChange({
                  ...options,
                  veiculosVariableId: variable?.id,
                })
              }
              initialVariableId={options.veiculosVariableId}
            />
            <Field.Description>
              Os veículos serão salvos como JSON array com: codigo_veiculo,
              placa, descricao_modelo, situacao
            </Field.Description>
          </Field.Root>
        </>
      );

    default:
      return null;
  }
};
