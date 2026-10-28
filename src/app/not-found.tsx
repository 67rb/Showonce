import s from "@/lib/strings";

import { Wordmark } from "@/components/Wordmark";
import { Button } from "@/components/Button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center font-body-ui">
      <Wordmark />
      <h1 className="max-w-[430px] font-display-ui text-3xl font-extrabold leading-[1.05] text-site-ink">
        {s.notFoundHeading}
      </h1>
      <p className="max-w-[430px] text-body text-site-muted">{s.notFoundBody}</p>
      <Button href="/" variant="primary">
        {s.backHome}
      </Button>
    </main>
  );
}