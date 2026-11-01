/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
// 5.9 — /professional/create/processing silently re-rendered the create form as
// a fake status. Saving a brief reports its real status inline on the create
// screen, so this route redirects to it and is removed from every route list.
import { redirect } from "next/navigation";

export default function Page() {
  redirect("/professional/create");
}
