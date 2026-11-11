# Memory Atlas

[![Build](https://github.com/ZhouYinLong-lab/Memory_Atlas/actions/workflows/deploy-pages.yml/badge.svg?branch=master)](https://github.com/ZhouYinLong-lab/Memory_Atlas/actions/workflows/deploy-pages.yml)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=111111)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![MapLibre GL](https://img.shields.io/badge/MapLibre%20GL-5-396CB2?logo=maplibre&logoColor=white)](https://maplibre.org/)

一个以地点为索引、由路线、影像与共同记忆组成的静态地图档案。

[在线查看 Memory Atlas](https://zhouyinlong-lab.github.io/Memory_Atlas/)

## 标签

`React` `TypeScript` `Vite` `MapLibre GL` `Photo Archive` `Shared Memory` `P5R-inspired`

## Overview / 项目简介

Memory Atlas 基于 [Dog-Map](https://github.com/ZhouYinLong-lab/Dog-Map) 渐进演化而来，保留原有地图、路线、地点和媒体内容。路线和地点继续由静态数据驱动；在地点详情下方，可以查看经过审核的多作者 Shared Memories。

视觉上采用原创的黑、红、米白、黄色斜切语言，并将地点图标、路线颜色和媒体内容整合到同一张城市地图中。

## 核心功能

- MapLibre 地图与 3D 城市场景
- 路线数据结构，后续可继续添加路线并动态高亮
- 地点图标随地图缩放比例变化
- 地点详情抽屉与多媒体内容
- 点击图片查看大图，支持背景、关闭按钮和 `Esc` 退出
- 响应式移动端布局
- 静态照片与可选媒体 API 两种内容来源
- 一个地点包含多条 Memory，一条 Memory 支持按展示顺序排列的多位平等作者
- 按作者或发生时间筛选 Shared Memories，并支持新旧排序与 URL 状态恢复
- 地点与 Memory 稳定直达链接，可刷新、分享和使用浏览器前进后退
- Memory 图片灯箱、顺序切换、计数和具体图片说明
- 站内 Agent 投稿面板，可一键复制规范提示词并打开完整指南
- 本地 Memory JSON 草稿生成器，不自动发布内容
- GitHub Pages SEO、分享卡、站点清单和自定义 404
- Agent 创建 PR 为主、GitHub Issue Form 为备用的投稿流程

## 投稿、审核与发布

推荐让编码 Agent 按仓库根目录的 [`CONTRIBUTING_AGENT.md`](./CONTRIBUTING_AGENT.md) 整理材料、校验静态数据并创建 PR。不能使用 Agent/PR 时，可改用 [Memory Submission Issue Form](https://github.com/ZhouYinLong-lab/Memory_Atlas/issues/new?template=memory-submission.yml)。

投稿不会自动公开。管理员需要核对地点、作者许可、隐私、媒体授权、alt 文本和文件路径；审核后才把作者写入 `src/data/authors.json`、把 Memory 写入 `src/data/memories.json`，并将媒体整理到 `public/media`。只有合并或直接推送到 `master` 的内容会触发现有 GitHub Actions 构建并发布到 GitHub Pages。未写入 `memories.json` 的 Issue、草稿分支或未合并 PR 不会出现在网站上。

本阶段不使用数据库、登录系统或独立服务器，也不部署 `server/` 下的 Hono API。

## Memory 内容模型

- `Author`：稳定 `id`、`displayName`，以及可选 `profileUrl`、`avatarUrl`。
- `Memory`：稳定 `id`、`placeId`、标题、正文、发生/创建时间、有序作者 ID 数组、媒体、授权和可选来源 Issue。
- 作者没有主次或摄影者角色；`authors` 数组顺序就是页面显示顺序，每条 Memory 至少有一位作者。

提交前运行：

```bash
npm run validate:memories
npm run build
npm run test:e2e
```

## Getting Started / 本地开发

```bash
npm install
npm run dev
```

生产构建检查：

```bash
npm run build
```

预览构建结果：

```bash
npm run preview
```

运行端到端测试：

```bash
npm run test:e2e
```

## 添加地点

新增或更新地点必须遵循[地点更新规范](./docs/place-update-workflow.md)，尤其是图标风格验收、原图保护和坐标证据要求。

编辑 `src/data/places.json`，新增地点对象：

- `coordinates` 使用 `[经度, 纬度]`；
- `coordinateSource` 必须填写 `photo-exif` 或 `map-poi`；
- `coordinateReference` 必须说明坐标依据；
- `routeId`（可选）指向 `src/data/routes.json` 中的路线；
- `media` 支持多张图片和视频；
- `englishTitle`（可选）用于详情页的英文地点名；
- `shops`（可选）用于地点下的探店记录，每条记录包含店名、类型、简介和独立照片集；
- `markerImage` 可指定地点图标；
- `art` 可生成稳定的地点图案。

坐标证据同步记录在 `data/place-coordinate-evidence.json`。提交前运行：

```bash
npm run validate:places
```

生产构建会自动执行这项校验；地点坐标与证据坐标超过允许误差时，构建会失败。

## 添加路线

编辑 `src/data/routes.json`：

- `coordinates` 使用 `[经度, 纬度]` 的折线点数组；
- `title` 是路线名称；
- `mode` 是步行、公交或其他出行方式；
- 路线颜色会根据顺序自动分配。

## 添加照片

网页使用的图片放在：

```text
public/media/<地点 id>/
```

探店照片可以继续按店铺分目录保存：

```text
public/media/<地点 id>/shops/<店铺 id>/
```

原始照片可以保存在本地项目目录：

```text
media-originals/<地点 id>/
```

`media-originals/` 默认不会提交到 Git。建议网页使用 WebP，原图只作为本地素材归档。

新增或替换 `places.json` 中的本地 WebP 照片/地点贴纸后（需要安装 ImageMagick），运行 `npm run assets:derive` 生成图册缩略图和地图贴纸轻量版。图册先加载最长边 960px 的缩略图，点击后仍查看原图；地图贴纸使用最长边 512px 版本。`npm run build` 会校验派生文件是否齐全。

Agent 投稿的原始图片先运行：

```bash
npm run prepare:memory-media -- <place-id> <memory-id> <image-path> [image-path...]
npm run assets:derive
```

第一条命令会自动旋转、移除元数据，并输出最长边不超过 2048px、质量 82 的 WebP；第二条命令为 Memory 图片生成 960px 缩略图。

图片处理完成后，可用本地草稿工具生成经过基础检查的 Memory JSON（只输出草稿，不会自动写入或发布）：

```bash
npm run draft:memory -- --place <place-id> --id <memory-id> --authors <id,id> --occurred-at <ISO> --title "<title>" --description "<text>" --media </media/file.webp> --alt "<alt text>"
```

日期精度、未知时间、内容授权、人物同意和隐私检查见 [`docs/memory-content-policy.md`](./docs/memory-content-policy.md)。

## Repository Structure / 仓库结构

```text
Memory-Atlas/
├── public/media/             # 网页使用的图片、视频和地点素材
├── media-originals/          # 本地原图目录，不提交到 Git
├── src/
│   ├── components/           # 地图和界面组件
│   ├── data/                 # 地点、路线和内容数据
│   ├── map/                  # 地图样式、路线和图案逻辑
│   ├── services/             # 媒体 API 客户端
│   └── styles/               # 全局样式和设计令牌
├── server/                   # 可选的媒体服务
├── CONTRIBUTING_AGENT.md     # Agent-first Memory 投稿指南
├── tests/                    # Playwright 端到端测试
└── README.md
```

## Contact / 问题反馈

发现问题或有新的路线、地点建议，可以提交 [GitHub Issue](https://github.com/ZhouYinLong-lab/Memory_Atlas/issues)。Memory 投稿优先使用 Agent 创建 PR。

## License / 许可证

### 项目源代码

Memory Atlas 的原创源代码采用 [MIT License](./LICENSE)。该许可只适用于本项目原创代码，不包含图片、地图数据和第三方软件或服务。

### 图片素材

项目照片、照片的 WebP 版本和自制图片素材采用 [CC BY-NC-ND 4.0](./LICENSE-MEDIA.md)。使用时需要署名，不得用于商业用途，也不得发布修改后的版本。

### 地图与第三方来源

地图渲染使用 MapLibre GL JS，地图服务与地图数据的许可、署名和来源见
[THIRD-PARTY-NOTICES.md](./THIRD-PARTY-NOTICES.md)。地图数据归属 OpenStreetMap，
并遵循 ODbL 要求；网页地图角落会显示相应的 attribution。
