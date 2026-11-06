# Contribute a Memory with an Agent

Memory Atlas accepts reviewed memories as pull requests. This is the primary contribution path: give your coding agent this repository URL, the memory details, and the instruction **“follow `CONTRIBUTING_AGENT.md` and prepare a pull request.”**

If you cannot use an agent or submit a PR, use the fallback [Memory Submission Issue Form](https://github.com/ZhouYinLong-lab/Memory_Atlas/issues/new?template=memory-submission.yml).

## Information to give the agent

- Place name and either an existing `placeId`, a Memory Atlas map link, or coordinates.
- Memory title and full text.
- When the memory occurred. An exact date is best; an honest approximate date is acceptable when clearly stated.
- Primary author, coauthors, and photographer credits.
- Image or video files, plus meaningful alt text for each item.
- The license you are granting for this contribution.
- Confirmation that the contribution does not expose private addresses, precise locations of vulnerable people, or personal information without consent.

## Agent workflow

1. Inspect `src/data/places.json`. Attach the memory to an existing place whenever possible. Do not rewrite existing Place content.
2. Add each new contributor once to `src/data/authors.json`:

   ```json
   {
     "id": "stable-lowercase-id",
     "displayName": "Public display name",
     "profileUrl": "https://example.com/optional-profile",
     "avatarUrl": "/media/authors/optional-avatar.webp"
   }
   ```

3. Copy approved media into `public/media/<place-id>/memories/<memory-id>/`. Prefer web-friendly WebP images and keep filenames stable.
4. Append the memory to `src/data/memories.json`:

   ```json
   {
     "id": "place-short-title-yyyymmdd",
     "placeId": "existing-place-id",
     "title": "Memory title",
     "description": "Memory text",
     "occurredAt": "2026-11-06T14:30:00+08:00",
     "createdAt": "2026-11-06T15:00:00+08:00",
     "authors": [
       { "authorId": "primary-author", "role": "owner" },
       { "authorId": "another-author", "role": "coauthor" },
       { "authorId": "photographer", "role": "photographer" }
     ],
     "media": [
       {
         "type": "image",
         "src": "/media/existing-place-id/memories/memory-id/photo.webp",
         "alt": "A concrete description of what is visible"
       }
     ],
     "license": "CC BY-NC-ND 4.0",
     "sourceIssue": "https://github.com/ZhouYinLong-lab/Memory_Atlas/issues/123"
   }
   ```

5. Run `npm run validate:memories`. If image derivatives are required, run `npm run assets:derive`, then run `npm run build`.
6. Run `npm run test:e2e` when the local environment supports Playwright.
7. Open a PR titled `memory: <title> at <place>`. In the description, list the author permissions, privacy review, media license, affected `placeId`, and validation results.

## Review and publication

A maintainer verifies location fit, consent, privacy, credits, license, media paths, and alt text. Only files merged into `master` are public. Issue text, attached Issue files, draft branches, and unmerged PRs are never read by the site. The existing GitHub Pages workflow validates, builds, and publishes the static site after the merge or push.

