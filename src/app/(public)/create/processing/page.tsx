/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
// 5.9 — /create/processing silently re-rendered the normal import page, a dead
// room. The import flow now handles processing inline on /create (status line
// in the create form), so this route redirects to it and is removed from every
// route list.
import { redirect } from "next/navigation";

export default function Page() {
  redirect("/create");
}
