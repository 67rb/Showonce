import { MinimalChrome } from "@/components/MinimalChrome";

export default function MinimalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="relative flex min-h-dvh flex-col font-body-ui bg-site-page">
      <div aria-hidden className="minimal-top-glow absolute inset-x-0 top-0 h-40" />
      <MinimalChrome />
      <main id="main-content" tabIndex={-1} className="relative z-10 flex-1">{children}</main>
    </div>
  );
}