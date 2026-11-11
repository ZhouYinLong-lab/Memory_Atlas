# Contribute a Memory with an Agent

> Copy/paste prompt: Update a Memory in this Memory Atlas repository. Follow `CONTRIBUTING_AGENT.md` and `docs/memory-content-policy.md`; confirm an existing place from my images and context, require my ordered authors and occurrence date, generate only grounded missing text and alt text, convert images to WebP, validate, test, and prepare a pull request. Stop and ask if the place, authors, or date cannot be confirmed.

Memory Atlas accepts reviewed memories as pull requests. This is the primary contribution path: give your coding agent this repository URL, the memory details, and the instruction **“follow `CONTRIBUTING_AGENT.md` and prepare a pull request.”**

Copy this prompt to your Agent and attach the images:

> Update a Memory in this Memory Atlas repository. First inspect the supplied images, EXIF, user context, and `src/data/places.json` to confirm an existing place. If the place is uncertain, stop and ask me. Require the ordered author list and an occurrence time (use reliable EXIF when available). If I did not provide a title or body, write grounded text from the images and context without inventing facts. Generate specific alt text, convert the images with the repository WebP command, update the static JSON, validate, test, and prepare a pull request.

If you cannot use an agent or submit a PR, use the fallback [Memory Submission Issue Form](https://github.com/ZhouYinLong-lab/Memory_Atlas/issues/new?template=memory-submission.yml).

## Information to give the agent

- Place name and either an existing `placeId`, a Memory Atlas map link, or coordinates.
- Image files. The Agent will convert them to repository-ready WebP files.
- Optional memory title and full text. If omitted, the Agent generates grounded copy from the images and supplied context.
- When the memory occurred. An exact date is best; an honest approximate date is acceptable when clearly stated.
- The author or authors in the exact order they should appear. Authors have no roles or priority; missing authors must be requested.
- The license you are granting for this contribution.
- Confirmation that the contribution does not expose private addresses, precise locations of vulnerable people, or personal information without consent.

## Agent workflow

1. Inspect the submitted images, EXIF, user context, and `src/data/places.json`. Continue only after confirming an existing `placeId`. If uncertain, stop and ask the user; never guess, attach to the nearest place, or create a new Place.
2. Confirm the ordered author list. If it is missing, stop and ask the user. Add each new contributor once to `src/data/authors.json`:

   ```json
   {
     "id": "stable-lowercase-id",
     "displayName": "Public display name",
     "profileUrl": "https://example.com/optional-profile",
     "avatarUrl": "/media/authors/optional-avatar.webp"
   }
   ```

3. Determine `occurredAt` from reliable EXIF or user input. If neither is available, stop and ask. If title or description is missing, generate concise text based only on visible image content and supplied context. Always generate specific alt text.
4. Prepare submitted images:

   ```bash
   npm run prepare:memory-media -- <place-id> <memory-id> <image-path> [image-path...]
   ```

   The command writes ordered `01.webp`, `02.webp`, … files under `public/media/<place-id>/memories/<memory-id>/`, auto-rotates, limits the longest edge to 2048px, strips metadata, and uses WebP quality 82. Copy the printed `/media/...` paths into the Memory in the same order.
5. Append the memory to `src/data/memories.json`:

   ```json
   {
     "id": "place-short-title-yyyymmdd",
     "placeId": "existing-place-id",
     "title": "Memory title",
     "description": "Memory text",
     "occurredAt": "2026-11-06T14:30:00+08:00",
     "createdAt": "2026-11-06T15:00:00+08:00",
     "authors": ["first-author", "second-author"],
     "media": [
       {
         "type": "image",
         "src": "/media/existing-place-id/memories/memory-id/01.webp",
         "alt": "A concrete description of what is visible"
       }
     ],
     "license": "CC BY-NC-ND 4.0",
     "sourceIssue": "https://github.com/ZhouYinLong-lab/Memory_Atlas/issues/123"
   }
   ```

   To generate a checked JSON object instead of assembling it manually, run:

   ```bash
   npm run draft:memory -- --place <place-id> --id <memory-id> --authors <id,id> --occurred-at <ISO> --title "<title>" --description "<text>" --media </media/file.webp> --alt "<alt text>"
   ```

   This command prints a draft to standard output. It deliberately does not edit `memories.json` or publish anything. Review the output before appending it.

6. Run `npm run assets:derive`, `npm run validate:memories`, and `npm run build`.
7. Run `npm run test:e2e` when the local environment supports Playwright.
8. Open a PR titled `memory: <title> at <place>`. In the description, list the ordered authors, place evidence, privacy review, media license, affected `placeId`, and validation results.

Use [`docs/memory-content-policy.md`](./docs/memory-content-policy.md) for date precision, generated-copy, consent, privacy, and publication rules.

## Review and publication

A maintainer verifies location fit, consent, privacy, credits, license, media paths, and alt text. Only files merged into `master` are public. Issue text, attached Issue files, draft branches, and unmerged PRs are never read by the site. The existing GitHub Pages workflow validates, builds, and publishes the static site after the merge or push.

