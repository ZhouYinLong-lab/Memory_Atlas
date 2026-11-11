import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const publicRoot = resolve(root, 'public')
const places = readJson('src/data/places.json')
const authors = readJson('src/data/authors.json')
const memories = readJson('src/data/memories.json')
const args = parseArgs(process.argv.slice(2))

const placeId = required('place')
const id = required('id')
const title = required('title')
const description = required('description')
const occurredAt = required('occurred-at')
const createdAt = args.get('created-at')?.[0] ?? new Date().toISOString()
const license = args.get('license')?.[0] ?? 'CC BY-NC-ND 4.0'
const authorIds = required('authors').split(',').map((value) => value.trim()).filter(Boolean)
const mediaPaths = args.get('media') ?? []
const altTexts = args.get('alt') ?? []

if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) fail('Memory id must be a stable lowercase slug.')
if (!places.some((place) => place.id === placeId)) fail(`Unknown place id: ${placeId}`)
if (memories.some((memory) => memory.id === id)) fail(`Memory id already exists: ${id}`)
if (authorIds.length === 0) fail('At least one author id is required.')
if (new Set(authorIds).size !== authorIds.length) fail('Author ids must not repeat.')
for (const authorId of authorIds) {
  if (!authors.some((author) => author.id === authorId)) fail(`Unknown author id: ${authorId}`)
}
if (!validOccurredAt(occurredAt)) fail('occurred-at must be YYYY-MM-DD or an ISO date-time with a timezone.')
if (!validDateTime(createdAt)) fail('created-at must be an ISO date-time with a timezone.')
if (mediaPaths.length === 0) fail('Provide at least one --media path.')
if (mediaPaths.length !== altTexts.length) fail('Provide one non-empty --alt value for every --media path, in the same order.')

const media = mediaPaths.map((src, index) => {
  const alt = altTexts[index]?.trim()
  if (!alt) fail(`Alt text ${index + 1} is empty.`)
  if (!src.startsWith('/media/')) fail(`Media path must start with /media/: ${src}`)
  const decoded = decodeURIComponent(new URL(src, 'https://memory-atlas.invalid').pathname.slice(1))
  const filePath = resolve(publicRoot, decoded)
  if (!filePath.startsWith(`${publicRoot}${sep}`) || !existsSync(filePath)) fail(`Media file does not exist: public/${decoded}`)
  return { type: 'image', src, alt }
})

const draft = {
  id,
  placeId,
  title,
  description,
  occurredAt,
  createdAt,
  authors: authorIds,
  media,
  license,
  ...(args.get('source')?.[0] ? { sourceIssue: args.get('source')[0] } : {}),
}

process.stdout.write(`${JSON.stringify(draft, null, 2)}\n`)

function parseArgs(values) {
  const result = new Map()
  for (let index = 0; index < values.length; index += 1) {
    const key = values[index]
    if (!key?.startsWith('--')) fail(usage())
    const value = values[index + 1]
    if (!value || value.startsWith('--')) fail(`Missing value for ${key}.\n${usage()}`)
    const normalizedKey = key.slice(2)
    result.set(normalizedKey, [...(result.get(normalizedKey) ?? []), value])
    index += 1
  }
  return result
}

function required(key) {
  const value = args.get(key)?.[0]?.trim()
  if (!value) fail(`Missing --${key}.\n${usage()}`)
  return value
}

function readJson(relativePath) {
  return JSON.parse(readFileSync(resolve(root, relativePath), 'utf8'))
}

function validOccurredAt(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) || validDateTime(value)
}

function validDateTime(value) {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
    && Number.isFinite(Date.parse(value))
}

function usage() {
  return 'Usage: npm run draft:memory -- --place <place-id> --id <memory-id> --authors <id,id> --occurred-at <ISO> --title <title> --description <text> --media </media/file.webp> --alt <text> [--media ... --alt ...] [--created-at <ISO>] [--license <license>] [--source <url>]'
}

function fail(message) {
  process.stderr.write(`${message}\n`)
  process.exit(1)
}
