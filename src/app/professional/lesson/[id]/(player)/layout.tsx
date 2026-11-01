/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
import {MinimalChrome} from "@/components/MinimalChrome";


// Professional player chrome — mirrors the Hobby `(minimal)/layout.tsx` with the
// shared, route-aware MinimalChrome. Only the play/camera/live/complete routes
// live behind this group; the lesson overview uses the professional navbar
// layout.
export default function ProfessionalPlayerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="relative flex min-h-dvh flex-col font-body-ui bg-white">
      <MinimalChrome/>
      <div className="relative z-10 flex-1">
        {children}
      </div>
    </div>
  );
}