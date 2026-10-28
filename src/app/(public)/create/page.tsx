import s from "@/lib/strings";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { Banner } from "@/components/Banner";
import { Reveal, RevealGroup, SerifAccent } from "@/components/Reveal";

type CreateState = "default" | "invalid" | "failed" | "not-configured";

export default async function CreatePage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const { state } = await searchParams;
  const mode = (state as CreateState) || "default";

  const error =
    mode === "invalid"
      ? s.importErrorInvalid
      : mode === "failed"
        ? s.importErrorFailed
        : mode === "not-configured"
          ? s.importErrorNotConfigured
          : null;

  return (
    <div className="relative isolate">
      <div className="relative mx-auto w-full max-w-[430px] px-4 py-10">
      <RevealGroup>
        <Reveal>
          <h1 className="font-display-ui text-[2.25rem] font-extrabold leading-tight text-site-ink">
            <SerifAccent text={s.createHeading} />
          </h1>
        </Reveal>
      </RevealGroup>

      {error ? (
        <div className="mt-5">
          <Banner tone="error">{error}</Banner>
        </div>
      ) : null}

      <div className="site-card mt-6 p-6">
        <Input
          label={s.importFieldLabel}
          placeholder={s.importLinkPlaceholder}
          name="link"
        />
        <div className="mt-6">
          <p className="font-body-ui text-small text-site-muted">{s.uploadPrompt}</p>
          <div className="mt-3">
            <Button variant="secondary" className="w-full">
              {s.uploadButton}
            </Button>
          </div>
        </div>
      </div>

      <p className="font-body-ui mt-4 text-small text-site-muted">{s.createScopeNote}</p>

      <div className="mt-6">
        <Button href="/create/processing" size="large" className="w-full">
          {s.createGetSteps}
        </Button>
      </div>
      </div>
    </div>
  );
}