import { PublicNavbar } from "@/components/PublicNavbar";

// Professional segment chrome. Mirrors the public `(public)/layout.tsx`: the
// shared, face-aware PublicNavbar overlays every /professional page (the bar is
// fixed, so main clears it with pt-24; the landing hero compensates on its own
// with -mt-24). No footer is mounted here — the Professional landing owns its
// own footer, and the create-flow screens are light tool screens.
export default function ProfessionalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="dark flex min-h-dvh flex-col">
      <PublicNavbar />
      <main id="main-content" tabIndex={-1} className="flex-1 pt-24">
        {children}
      </main>
    </div>
  );
}