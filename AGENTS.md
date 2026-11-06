# Memory Atlas agent instructions

For any memory contribution, read and follow [`CONTRIBUTING_AGENT.md`](./CONTRIBUTING_AGENT.md) before editing data or media.

Core constraints:

- Treat `src/data/places.json` as existing legacy content; do not migrate or delete it for a memory submission.
- Publish a submission only by committing it to `src/data/memories.json` and placing its media under `public/media/`.
- Add or reuse contributors in `src/data/authors.json`; store their IDs in display order in the Memory `authors` array. Authors have no roles or priority.
- Confirm an existing `placeId` from user context, image evidence, or EXIF before editing. If the place is uncertain, stop and ask the user; do not guess or create a Place.
- Require the user to identify the author or authors. If title or description is omitted, generate grounded copy from the supplied images and context without inventing people, events, or dates.
- Convert submitted images with `npm run prepare:memory-media -- <place-id> <memory-id> <image-path> [...]`, then run `npm run assets:derive`.
- Run `npm run validate:memories`, `npm run build`, and the relevant Playwright tests before opening a PR.
- Do not add a database, authentication, or a dependency on `server/`.

