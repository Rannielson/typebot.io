import { useMutation } from "@tanstack/react-query";
import type { CreatableCredentials } from "@typebot.io/credentials/schemas";
import { Button } from "@typebot.io/ui/components/Button";
import { Dialog } from "@typebot.io/ui/components/Dialog";
import { Field } from "@typebot.io/ui/components/Field";
import { Input } from "@typebot.io/ui/components/Input";
import type React from "react";
import { useState } from "react";
import { useWorkspace } from "@/features/workspace/WorkspaceProvider";
import { queryClient, trpc } from "@/lib/queryClient";
import { toast } from "@/lib/toast";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onNewCredentials: (id: string) => void;
};

export const HinovaCredentialsDialog = ({
  isOpen,
  onClose,
  onNewCredentials,
}: Props) => {
  return (
    <Dialog.Root isOpen={isOpen} onClose={onClose}>
      <HinovaCredentialsDialogBody
        onNewCredentials={(id) => {
          onNewCredentials(id);
          onClose();
        }}
      />
    </Dialog.Root>
  );
};

export const HinovaCredentialsDialogBody = ({
  onNewCredentials,
}: {
  onNewCredentials: (id: string) => void;
}) => {
  const { workspace } = useWorkspace();
  const [token, setToken] = useState("");
  const [name, setName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const { mutate } = useMutation(
    trpc.credentials.createCredentials.mutationOptions({
      onMutate: () => setIsCreating(true),
      onSettled: () => setIsCreating(false),
      onError: (err) => {
        toast({
          description: err.message,
        });
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: trpc.credentials.listCredentials.queryKey(),
        });
        onNewCredentials(data.credentialsId);
        setToken("");
        setName("");
      },
    }),
  );

  const createHinovaCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace) return;
    mutate({
      scope: "workspace",
      workspaceId: workspace.id,
      credentials: {
        type: "hinova",
        name,
        data: {
          token,
        },
      } as CreatableCredentials,
    });
  };

  return (
    <>
      <Dialog.Title>Add Hinova account</Dialog.Title>
      <Dialog.CloseButton />
      <Dialog.Popup render={<form onSubmit={createHinovaCredentials} />}>
        <Field.Root>
          <Field.Label>Name</Field.Label>
          <Input onValueChange={setName} placeholder="My Hinova account" />
        </Field.Root>
        <Field.Root>
          <Field.Label>Bearer Token</Field.Label>
          <Input
            type="password"
            onValueChange={setToken}
            placeholder="Enter your Bearer token"
          />
          <Field.Description>
            Enter your Hinova Bearer token. This will be encrypted and stored
            securely.
          </Field.Description>
        </Field.Root>

        <Dialog.Footer>
          <Button
            type="submit"
            disabled={token === "" || name === "" || isCreating}
          >
            Create
          </Button>
        </Dialog.Footer>
      </Dialog.Popup>
    </>
  );
};
