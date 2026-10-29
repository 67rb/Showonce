# Questions on each practice step

Every selected step has an **Ask about this step** box. Learners can also open a box from an overview step or revisit a step after finishing the practice.

Type a question, then choose **Ask AI · uses allowance**. Opening the box, typing, reading saved answers and refreshing history do not call the model. Sending a question uses the existing shared $5 AI allowance. The provider key stays in the Worker; the browser sends only the selected step ID, question and authenticated practice access.

The server supplies the actual lesson, selected step, nearby instructions and up to four previous answers from the same step. Answers distinguish lesson instructions, general explanations and insufficient context. Lesson quotations must match supplied text. This text-only feature does not inspect camera frames or uploaded photos, and cannot pass a checkpoint or advance progress. Use the separate photo check for visible-work feedback.

Questions and answers are saved privately with their practice. Signed-in users retain the existing account-based access; browser-only sessions retain capability-based access. **Delete question and answer** removes the stored text and answer, retaining a minimal request digest to prevent replaying a deleted request as a new charge. Processing questions cannot be deleted until they finish or expire. There is a 50-question total limit per practice, including deleted and failed requests, and one answer may process at a time.

If a connection drops, **Retry same question** reuses the original request key and text. **Refresh saved answers** reads the saved result without generation. **Stop waiting** cancels the browser wait; an already-sent provider request may still finish and use allowance. **Start a new question** explicitly starts a separate request. Failed or expired requests are never regenerated automatically.

## Verification

Automated tests use a mocked provider and do not spend real API allowance. They cover context, source-quote validation, self-review steps, access isolation, safe text rendering, duplicate/concurrent requests, lost responses, stale step replies, deletion, budget exhaustion and additive migration preservation.

For an authorized end-to-end check: open a practice, ask what one instruction means, confirm the answer belongs to that step, leave and return to see it saved, then delete it. An actual answer requires an available server-side model key and allowance. This manual check spends allowance; it is not performed automatically during builds or preview QA.
