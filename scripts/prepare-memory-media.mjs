import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { basename, dirname, extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const mediaRoot = resolve(root, 'public', 'media')
const [placeId, memoryId, ...inputPaths] = process.argv.slice(2)
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

if (!slugPattern.test(placeId ?? '') || !slugPattern.test(memoryId ?? '') || inputPaths.length === 0) {
  fail('Usage: npm run prepare:memory-media -- <place-id> <memory-id> <image-path> [image-path...]')
}

const places = JSON.parse(readFileSync(resolve(root, 'src/data/places.json'), 'utf8'))
if (!places.some((place) => place.id === placeId)) fail(`Unknown place id: ${placeId}`)

const outputDirectory = resolve(mediaRoot, placeId, 'memories', memoryId)
if (!outputDirectory.startsWith(`${mediaRoot}${sep}`)) fail('Output path escapes public/media')

const inputs = inputPaths.map((inputPath) => {
  const source = resolve(process.cwd(), inputPath)
  if (!existsSync(source)) fail(`Input image does not exist: ${inputPath}`)
  return source
})
const targets = inputs.map((_, index) => resolve(outputDirectory, `${String(index + 1).padStart(2, '0')}.webp`))
const collision = targets.find(existsSync)
if (collision) fail(`Refusing to overwrite existing media: ${collision}`)

mkdirSync(outputDirectory, { recursive: true })

const publicPaths = []
for (const [index, source] of inputs.entries()) {
  const target = targets[index]
  try {
    execFileSync('magick', [
      source,
      '-auto-orient',
      '-resize', '2048x2048>',
      '-strip',
      '-define', 'webp:method=6',
      '-quality', '82',
      target,
    ], { stdio: 'inherit' })
  } catch (error) {
    fail(`ImageMagick failed for ${basename(source)}: ${error instanceof Error ? error.message : String(error)}`)
  }

  const [format, width, height] = execFileSync('magick', ['identify', '-format', '%m %w %h', target], { encoding: 'utf8' }).trim().split(/\s+/)
  if (format !== 'WEBP' || Number(width) > 2048 || Number(height) > 2048) {
    fail(`Unexpected output for ${target}: ${format} ${width}x${height}`)
  }
  publicPaths.push(`/media/${placeId}/memories/${memoryId}/${basename(target)}`)
}

process.stdout.write(`${JSON.stringify(publicPaths, null, 2)}\n`)

function fail(message) {
  process.stderr.write(`${message}\n`)
  process.exit(1)
}
