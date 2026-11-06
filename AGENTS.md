# Memory Atlas agent instructions

For any memory contribution, read and follow [`CONTRIBUTING_AGENT.md`](./CONTRIBUTING_AGENT.md) before editing data or media.

Core constraints:

- Treat `src/data/places.json` as existing legacy content; do not migrate or delete it for a memory submission.
- Publish a submission only by committing it to `src/data/memories.json` and placing its media under `public/media/`.
- Add or reuse contributors in `src/data/authors.json`; use `owner`, `coauthor`, or `photographer` roles.
- Run `npm run validate:memories`, `npm run build`, and the relevant Playwright tests before opening a PR.
- Do not add a database, authentication, or a dependency on `server/`.

