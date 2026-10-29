type Props = {
  tone: "saved" | "error";
  children: string;
};

export function Banner({ tone, children }: Props) {
  const styles =
    tone === "saved"
      ? "border-accent/40 bg-accent/10 text-accent"
      : "border-wrong/40 bg-wrong/10 text-wrong";
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-md border px-4 py-3 text-small font-medium ${styles}`}
    >
      {children}
    </div>
  );
}