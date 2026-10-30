/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import s from "@/lib/strings";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Button } from "@/components/Button";

export function EndSessionButton() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)} className="w-full">
        {s.endSession}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={s.endSessionTitle}
        body={s.endSessionBody}
        cancelLabel={s.cancel}
        confirmLabel={s.endSessionConfirm}
        onConfirm={() => {
          setOpen(false);
          router.push("/lesson/sample/complete");
        }}
      />
    </>
  );
}