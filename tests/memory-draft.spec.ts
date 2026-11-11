import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { expect, test } from '@playwright/test'

test('generates a validated Memory JSON draft without publishing it', async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Run the local draft generator once')
  const workspace = resolve(import.meta.dirname, '..')
  const output = execFileSync(process.execPath, [
    'scripts/create-memory-draft.mjs',
    '--place', 'jinji-lake',
    '--id', 'jinji-lake-draft-example-20990101',
    '--authors', 'zhou-xuanyuan,yunfei',
    '--occurred-at', '2099-01-01',
    '--created-at', '2099-01-02T12:00:00+08:00',
    '--title', '待审核草稿',
    '--description', '用于验证草稿生成器，不会写入公开数据。',
    '--media', '/media/jinji-lake/memories/jinji-lake-city-lights-20261018/01.webp',
    '--alt', '金鸡湖湖岸灯光与城市天际线',
  ], { cwd: workspace, encoding: 'utf8' })

  const draft = JSON.parse(output)
  expect(draft.placeId).toBe('jinji-lake')
  expect(draft.authors).toEqual(['zhou-xuanyuan', 'yunfei'])
  expect(draft.media).toEqual([{
    type: 'image',
    src: '/media/jinji-lake/memories/jinji-lake-city-lights-20261018/01.webp',
    alt: '金鸡湖湖岸灯光与城市天际线',
  }])
})
