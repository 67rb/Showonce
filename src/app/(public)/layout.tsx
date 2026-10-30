/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";

export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // `dark` activates the installed Resizable Navbar's dark: variants (the
    // site is dark-only). The bar is fixed/overlay, so main clears it with
    // pt-24 on non-landing pages; the landing hero compensates on its own.
    <div className="dark flex min-h-dvh flex-col">
      <PublicNavbar />
      <main id="main-content" tabIndex={-1} className="flex-1 pt-24">{children}</main>
      <PublicFooter />
    </div>
  );
}