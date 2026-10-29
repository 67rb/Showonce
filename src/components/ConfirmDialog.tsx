"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/Button";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  body: string;
  cancelLabel: string;
  confirmLabel: string;
  onConfirm: () => void;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  body,
  cancelLabel,
  confirmLabel,
  onConfirm,
}: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/70" />
        <Dialog.Content
          className="panel fixed left-1/2 top-1/2 z-50 w-[calc(100%-3rem)] max-w-[430px] -translate-x-1/2 -translate-y-1/2 p-5"
          aria-describedby={undefined}
        >
          <Dialog.Title className="text-h2 font-semibold text-ink">
            {title}
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-body text-muted">
            {body}
          </Dialog.Description>
          <div className="mt-5 flex justify-end gap-2">
            <Dialog.Close asChild>
              <Button variant="ghost">{cancelLabel}</Button>
            </Dialog.Close>
            <Button variant="destructive" onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}