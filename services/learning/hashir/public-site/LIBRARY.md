# Practice library and lesson entry

The home screen retains separate server sessions for different skills and repeat
attempts. Cards show a cached progress snapshot; opening a card retrieves the
server's current progress and lesson before showing the checkpoint. Completed
records remain available. Filters change the view without deleting records.

`web/practice-library.js` owns the versioned `showonce-library-v1` browser envelope.
Only session access, lesson ID, display metadata, counts and timestamps are copied.
Tutorial text, lesson bodies and images are excluded. Tokens are sent only in the
existing authenticated API header, never rendered in cards or put in URLs.

The earlier `showonce-practice-v2` snapshot is imported without deleting it.
Device-only work is not promoted to verified server progress. Invalid entries and
unknown envelopes are preserved; they cannot silently erase otherwise valid
access. Writes re-read storage and merge other tab updates. A quota failure keeps
new access in memory with a visible warning that persists when returning home.
The helper and app are bundled into the same served script so a cached older HTML
page cannot load the new app without its library dependency.

This is browser-held capability access, not an account or cross-device library.
Clearing browser data loses access. No token export, public session listing,
background synchronization, or automatic record deletion is added.

Lesson entry offers three separate drafts: Tutorial link (AI), Paste instructions
(AI), and My numbered steps (free self-review). Only the selected draft is sent.
Examples have local search and a native skill filter; changing modes or filters
never calls the provider. Supported link hosts and source/safety limits are
unchanged. Free numbered steps preserve supplied instructions and do not claim an
AI assessment.

Validation:

    node --test scripts/library-test.mjs scripts/workspace-test.mjs

The library tests cover migration, compact storage, corruption, quota, concurrent
tabs, token conflicts and repeated practices. Workspace tests cover real API
resume wiring, source payload isolation, search/filter behavior and warnings.
