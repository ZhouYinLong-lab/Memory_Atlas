import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const publicRoot = resolve(root, 'public')
const places = readJson('src/data/places.json')
const authors = readJson('src/data/authors.json')
const memories = readJson('src/data/memories.json')
const errors = []
const placeIds = new Set(places.map((place) => place.id))
const authorIds = new Set()
const memoryIds = new Set()

for (const [index, author] of authors.entries()) {
  const label = author?.id || `authors[${index}]`
  if (!nonEmptyString(author?.id)) errors.push(`${label}: author id is required`)
  if (authorIds.has(author?.id)) errors.push(`${label}: duplicate author id`)
  authorIds.add(author?.id)
  if (!nonEmptyString(author?.displayName)) errors.push(`${label}: displayName is required`)
}

for (const [index, memory] of memories.entries()) {
  const label = memory?.id || `memories[${index}]`

  if (!nonEmptyString(memory?.id)) errors.push(`${label}: memory id is required`)
  if (memoryIds.has(memory?.id)) errors.push(`${label}: duplicate memory id`)
  memoryIds.add(memory?.id)

  if (!placeIds.has(memory?.placeId)) errors.push(`${label}: placeId "${memory?.placeId ?? ''}" does not exist`)
  if (!nonEmptyString(memory?.title)) errors.push(`${label}: title is required`)
  if (!nonEmptyString(memory?.description)) errors.push(`${label}: description is required`)
  if (!validDate(memory?.occurredAt)) errors.push(`${label}: occurredAt must be a valid ISO-style date or date-time`)
  if (!validDate(memory?.createdAt)) errors.push(`${label}: createdAt must be a valid ISO-style date or date-time`)
  if (!nonEmptyString(memory?.license)) errors.push(`${label}: license is required`)

  if (!Array.isArray(memory?.authors) || memory.authors.length === 0) {
    errors.push(`${label}: authors must contain at least one contributor`)
  } else {
    const seenMemoryAuthors = new Set()
    for (const [authorIndex, authorId] of memory.authors.entries()) {
      const authorLabel = `${label}.authors[${authorIndex}]`
      if (!nonEmptyString(authorId)) errors.push(`${authorLabel}: author id is required`)
      if (!authorIds.has(authorId)) errors.push(`${authorLabel}: author id "${authorId ?? ''}" does not exist`)
      if (seenMemoryAuthors.has(authorId)) errors.push(`${authorLabel}: duplicate author id "${authorId}"`)
      seenMemoryAuthors.add(authorId)
    }
  }

  if (!Array.isArray(memory?.media)) {
    errors.push(`${label}: media must be an array`)
  } else {
    for (const [mediaIndex, item] of memory.media.entries()) {
      const mediaLabel = `${label}.media[${mediaIndex}]`
      if (!['image', 'video'].includes(item?.type)) errors.push(`${mediaLabel}: type must be image or video`)
      if (!nonEmptyString(item?.alt)) errors.push(`${mediaLabel}: alt text is required`)
      validatePublicMediaPath(item?.src, `${mediaLabel}.src`)
      if (item?.thumbnail !== undefined) validatePublicMediaPath(item.thumbnail, `${mediaLabel}.thumbnail`)
      if (item?.poster !== undefined) validatePublicMediaPath(item.poster, `${mediaLabel}.poster`)
    }
  }
}

if (errors.length > 0) {
  console.error(`Memory content validation failed with ${errors.length} error${errors.length === 1 ? '' : 's'}:`)
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(`Validated ${memories.length} memories and ${authors.length} authors.`)

function readJson(relativePath) {
  try {
    const value = JSON.parse(readFileSync(resolve(root, relativePath), 'utf8'))
    if (!Array.isArray(value)) throw new Error('top-level value must be an array')
    return value
  } catch (error) {
    console.error(`Unable to read ${relativePath}: ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  }
}

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function validDate(value) {
  return nonEmptyString(value) && /^\d{4}-\d{2}-\d{2}(?:T.+)?$/.test(value) && Number.isFinite(Date.parse(value))
}

function validatePublicMediaPath(value, label) {
  if (!nonEmptyString(value)) {
    errors.push(`${label}: media path is required`)
    return
  }
  if (!value.startsWith('/media/')) {
    errors.push(`${label}: media must be stored under public/media and use a /media/... path`)
    return
  }

  let decodedPath
  try {
    decodedPath = decodeURIComponent(new URL(value, 'https://memory-atlas.invalid').pathname.slice(1))
  } catch {
    errors.push(`${label}: invalid media path "${value}"`)
    return
  }

  const filePath = resolve(publicRoot, decodedPath)
  if (!filePath.startsWith(`${publicRoot}${sep}`)) {
    errors.push(`${label}: media path escapes public/`)
  } else if (!existsSync(filePath)) {
    errors.push(`${label}: media file does not exist at public/${decodedPath}`)
  }
}
