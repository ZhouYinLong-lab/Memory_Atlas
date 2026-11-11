# Memory content and review policy

This policy applies to every new entry in `src/data/memories.json`. It supplements `CONTRIBUTING_AGENT.md`; it does not authorize automatic publication.

## Location

- A Memory must reference an existing `placeId` from `src/data/places.json`.
- Confirm the place from user context, visible image evidence, reliable EXIF, or a supplied Memory Atlas link.
- If evidence can fit more than one place, stop and ask. Do not choose the nearest marker and do not create a Place during a Memory submission.

## Date and time

- `occurredAt` accepts an exact calendar day (`YYYY-MM-DD`) or an ISO date-time with an explicit timezone.
- Prefer reliable EXIF, then an explicit contributor statement. When the exact clock time is unknown, store the honest calendar day instead of inventing `00:00`.
- A vague month, year, or completely unknown date is not enough for publication in V1. Ask the contributor for the narrowest honest calendar day before continuing; never manufacture a date from the upload or review date.
- `createdAt` records when the reviewed JSON entry was prepared and must be an ISO date-time with a timezone.

## Authors and text

- Authors are an equal, ordered list. The array order is display order only.
- Require the contributor to identify every public display name. Do not default to an existing author.
- A title or description may be generated only from observable image content and supplied context. Do not infer names, relationships, private activities, emotions, or events.
- Every media item needs specific alt text describing what is visibly useful for understanding it.

## License, consent, and privacy

- Record a non-empty license for every Memory. A contributor must own the work or have permission to publish it under that license.
- Confirm consent before publishing identifiable people, private conversations, private interiors, or personal documents.
- Remove precise private-home locations, access credentials, contact details, vehicle plates when sensitive, and locations of vulnerable people.
- The media preparation command strips embedded metadata. Review visible content separately because metadata removal does not remove private information shown in an image.

## Publication gate

- Run media preparation, derivative generation, Memory validation, the production build, and relevant Playwright tests.
- A maintainer reviews location evidence, ordered credits, consent, privacy, license, generated text, alt text, and the final diff.
- Only a reviewed commit merged or pushed to `master` is public. Issue uploads, local drafts, unmerged branches, and PR descriptions are not read by the website.
