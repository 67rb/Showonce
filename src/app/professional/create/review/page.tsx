/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
// 5.9 — the review route renders the real saved-request status from the studio
// loader (no simulated processing or review result). With no saved requests it
// shows the studio's empty state with a CTA back to New training brief.
import { CreateFlow } from "@/components/professional/CreateFlow";

export default function Page() {
  return <CreateFlow screen="review" />;
}
