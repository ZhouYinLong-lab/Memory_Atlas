# Memory Atlas MVP Implementation Plan

## Goal

Evolve Dog-Map into the static GitHub Pages–hosted Memory Atlas MVP without replacing the existing map architecture or migrating existing place content.

## Decisions

- Keep `Place` and all existing `places.json` content intact.
- Add `Author` and `Memory` as separate static JSON-backed models.
- Publish only reviewed entries committed to `src/data/memories.json` and media committed under `public/media`.
- Make an Agent-authored pull request the primary contribution workflow. Keep a GitHub Issue Form as a browser-friendly fallback.
- Do not deploy or depend on the optional `server/` Hono API.
- Preserve the current visual language and map interactions.

## Work plan

- [x] Clone and inspect repository baseline.
- [x] Install dependencies and record baseline build/e2e results.
- [x] Add Author/Memory types and static data files.
- [x] Add strict memory validation to the build.
- [x] Add shared-memory rendering and author/time filters to place details.
- [x] Add Agent-first contribution entry point and contributor documentation.
- [x] Add fallback GitHub Issue Form.
- [x] Update branding, package metadata, README, and Pages-facing metadata.
- [x] Add/adjust tests for existing behavior and Memory Atlas features.
- [x] Run full validation, build, and e2e suite.

## Verification log

- Repository cloned from `https://github.com/ZhouYinLong-lab/Dog-Map` on 2026-11-06.
- Baseline: `npm install` succeeded; `npm run build` succeeded; `npm run test:e2e` finished with 43 passed and 1 intentionally skipped mobile API duplicate.
- Final: `npm run build` succeeded after validating 19 places, 3 memories, 4 authors, and 362 media derivatives.
- Final: `npm run test:e2e` finished with 49 passed and 1 intentionally skipped mobile API duplicate, including Jinji Lake author attribution.
- Visual check completed for desktop and mobile Shared Memories layouts. A mobile fixed-button overlap found during testing was corrected and regression-tested.
- GitHub Pages is enabled for `ZhouYinLong-lab/Memory_Atlas`; the production deployment and live media-path check succeeded.
- `npm audit --omit=dev` reports two moderate Hono advisories (the server is not deployed) and one critical MapLibre advisory whose automatic fix requires a major-version upgrade; schedule that upgrade with map regression testing.

## Scope boundaries

- No database, authentication, independent backend deployment, or automated approval bot.
- No deletion or migration of legacy place content.
- No automatic publication of unreviewed Issues or PR descriptions.
