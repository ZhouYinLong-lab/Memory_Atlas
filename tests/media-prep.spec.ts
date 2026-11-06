import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { expect, test } from '@playwright/test'

test('prepares submitted images as stripped 2048px WebP files', async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Run the filesystem conversion once')
  const workspace = resolve(import.meta.dirname, '..')
  const temporaryDirectory = mkdtempSync(join(tmpdir(), 'memory-atlas-media-'))
  const memoryId = `e2e-media-${randomUUID()}`
  const inputPath = join(temporaryDirectory, 'submitted-image.png')
  const outputDirectory = resolve(workspace, 'public/media/nju-suzhou-campus/memories', memoryId)

  try {
    mkdirSync(temporaryDirectory, { recursive: true })
    execFileSync('magick', ['-size', '2400x1200', 'xc:#f3bf00', '-set', 'comment', 'private metadata', inputPath])
    const output = execFileSync(
      process.execPath,
      ['scripts/prepare-memory-media.mjs', 'nju-suzhou-campus', memoryId, inputPath],
      { cwd: workspace, encoding: 'utf8' },
    )
    const [publicPath] = JSON.parse(output) as string[]
    const outputPath = resolve(workspace, `public${publicPath}`)
    const identity = execFileSync('magick', ['identify', '-format', '%m %w %h', outputPath], { encoding: 'utf8' })
    const verboseIdentity = execFileSync('magick', ['identify', '-verbose', outputPath], { encoding: 'utf8' })

    expect(publicPath).toBe(`/media/nju-suzhou-campus/memories/${memoryId}/01.webp`)
    expect(identity).toBe('WEBP 2048 1024')
    expect(verboseIdentity).not.toContain('private metadata')
  } finally {
    rmSync(outputDirectory, { recursive: true, force: true })
    rmSync(temporaryDirectory, { recursive: true, force: true })
  }
})
