/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
import type { Metadata } from "next";
import { ProfessionalBackground } from "@/components/professional/ProfessionalBackground";
import { CreateFlow } from "@/components/professional/CreateFlow";
import s from "@/lib/strings";

export const metadata: Metadata = {
  title: `SHOW ONCE · Professional`,
  description: s.proCreateScopeNote,
};

export default function Page() {
  return (
    <ProfessionalBackground>
      <CreateFlow screen="create" />
    </ProfessionalBackground>
  );
}