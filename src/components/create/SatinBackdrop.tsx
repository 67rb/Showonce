/** A quiet background keeps form labels readable and typing responsive. */
export function SatinBackdrop() {
  return <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{background:"radial-gradient(ellipse at 100% 0%, #70401b 0%, transparent 65%), linear-gradient(160deg, #21170f, #16161a)"}} />;
}
