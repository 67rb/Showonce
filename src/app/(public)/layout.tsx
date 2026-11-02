/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
import { PublicShell } from "@/components/PublicShell";

export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // Landing (/) keeps the fixed/overlay pill with pt-24 clearance on main;
    // interior routes render the docked InteriorHeader in flow with standard
    // shell spacing. See PublicShell.
    <PublicShell>{children}</PublicShell>
  );
}