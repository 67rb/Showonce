import s from "@/lib/strings";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";

type Props = {
  startHref: string;
  startLabel: string;
  inputId?: string;
};

/** The paste-link + start + upload panel. Designed states only. */
export function ImportPanel({ startHref, startLabel, inputId }: Props) {
  return (
    <div className="site-card w-full p-6">
      <Input
        label={s.importFieldLabel}
        placeholder={s.importLinkPlaceholder}
        id={inputId}
        name="link"
      />
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button href={startHref} className="flex-1">
          {startLabel}
        </Button>
        <Button variant="secondary" className="flex-1">
          {s.importUpload}
        </Button>
      </div>
    </div>
  );
}