import { useCallback, useEffect, useMemo, useState } from 'react'
import { MapView } from './components/MapView'
import { authors, memories, places, routes } from './data/content'
import { loadRemoteMedia } from './services/mediaApi'
import type { Author, MediaItem, Memory, Shop } from './types/content'
import { artworkDataUri } from './map/artwork'

const repositoryUrl = 'https://github.com/ZhouYinLong-lab/Memory_Atlas'
const contributionGuideUrl = `${repositoryUrl}/blob/master/CONTRIBUTING_AGENT.md`
const contributionIssueUrl = `${repositoryUrl}/issues/new?template=memory-submission.yml`
const agentContributionPrompt = `Update a Memory in this Memory Atlas repository: ${repositoryUrl}

Follow CONTRIBUTING_AGENT.md. Inspect my images, EXIF, context, and src/data/places.json to confirm an existing placeId before editing. If the place is uncertain, stop and ask me; never guess or create a Place. Require my ordered author list and an occurrence time, generate grounded title/body only when omitted, always write specific alt text, convert images to WebP with the repository command, update the static JSON, validate, build, test, and prepare a pull request. Do not publish unreviewed content or add a database, login, or server dependency.`

type AtlasUrlState = {
  placeId: string | null
  memoryId: string | null
  author: string
  time: string
  order: 'newest' | 'oldest'
}

function readAtlasUrl(): AtlasUrlState {
  const params = new URLSearchParams(window.location.search)
  const requestedMemory = memories.find((memory) => memory.id === params.get('memory')) ?? null
  const requestedPlace = places.find((place) => place.id === params.get('place')) ?? null
  const placeId = requestedMemory?.placeId ?? requestedPlace?.id ?? null
  const placeMemories = memories.filter((memory) => memory.placeId === placeId)
  const requestedAuthor = params.get('author')
  const requestedTime = params.get('time')

  return {
    placeId,
    memoryId: requestedMemory?.id ?? null,
    author: requestedAuthor && placeMemories.some((memory) => memory.authors.includes(requestedAuthor)) ? requestedAuthor : 'all',
    time: requestedTime && placeMemories.some((memory) => memory.occurredAt === requestedTime) ? requestedTime : 'all',
    order: params.get('order') === 'oldest' ? 'oldest' : 'newest',
  }
}

function atlasHref({ placeId, memoryId = null, author = 'all', time = 'all', order = 'newest' }: AtlasUrlState) {
  const url = new URL(window.location.href)
  url.search = ''
  url.hash = ''
  if (placeId) url.searchParams.set('place', placeId)
  if (memoryId) url.searchParams.set('memory', memoryId)
  if (author !== 'all') url.searchParams.set('author', author)
  if (time !== 'all') url.searchParams.set('time', time)
  if (order === 'oldest') url.searchParams.set('order', order)
  return `${url.pathname}${url.search}`
}

function setAtlasUrl(state: AtlasUrlState, method: 'push' | 'replace' = 'push') {
  window.history[`${method}State`]({}, '', atlasHref(state))
}
function thumbnailSource(item: MediaItem) {
  if (item.thumbnail) return item.thumbnail
  if (item.src.includes('/media/') && item.type === 'image' && /\.webp$/i.test(item.src)) {
    return item.src.replace(/\.webp$/i, '.thumb.webp')
  }
  return item.src
}

function MediaBlock({ item, onPreview }: { item: MediaItem; onPreview: () => void }) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div className="media-error" role="img" aria-label={`${item.alt}加载失败`}>
        <span>MEDIA SIGNAL LOST</span>
        <small>{item.alt}</small>
      </div>
    )
  }

  if (item.type === 'video' && item.src) {
    return <video className="media-block" controls preload="metadata" poster={item.poster} src={item.src} aria-label={item.alt} onError={() => setFailed(true)} />
  }

  if (item.type === 'video') {
    return (
      <div className="video-placeholder" role="img" aria-label={item.alt} style={{ backgroundImage: `url(${item.poster})` }}>
        <span className="video-placeholder__play">▶</span>
        <span className="video-placeholder__caption">VIDEO SLOT / DROP FILE HERE</span>
      </div>
    )
  }

  return (
    <figure className="media-figure">
      <button className="media-preview-trigger" type="button" onClick={onPreview} aria-label={`预览：${item.alt}`}>
        <img className="media-block" src={thumbnailSource(item)} alt={item.alt} loading="lazy" decoding="async" onError={() => setFailed(true)} />
      </button>
      {item.caption && <figcaption>{item.caption}</figcaption>}
    </figure>
  )
}

function ImageLightbox({ items, index, onClose, onNavigate }: { items: MediaItem[]; index: number; onClose: () => void; onNavigate: (index: number) => void }) {
  const item = items[index]
  const canGoPrevious = index > 0
  const canGoNext = index < items.length - 1

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowLeft' && canGoPrevious) onNavigate(index - 1)
      if (event.key === 'ArrowRight' && canGoNext) onNavigate(index + 1)
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [canGoNext, canGoPrevious, index, onClose, onNavigate])

  if (!item) return null

  return (
    <div
      className="media-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`图片预览：${item.alt}`}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      >
      <button className="media-lightbox__close" type="button" onClick={onClose} aria-label="关闭图片预览" autoFocus>×</button>
      <div className="media-lightbox__stage" onClick={(event) => event.stopPropagation()}>
        <img className="media-lightbox__image" src={item.src} alt={item.alt} decoding="async" />
        <div className="media-lightbox__meta" aria-live="polite">
          <span>{String(index + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}</span>
          <p>{item.caption ?? item.alt}</p>
        </div>
        <button
          className="media-lightbox__nav media-lightbox__nav--previous"
          type="button"
          onClick={() => onNavigate(index - 1)}
          disabled={!canGoPrevious}
          aria-label="上一张图片"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M19 12H5M11 6l-6 6 6 6" />
          </svg>
        </button>
        <button
          className="media-lightbox__nav media-lightbox__nav--next"
          type="button"
          onClick={() => onNavigate(index + 1)}
          disabled={!canGoNext}
          aria-label="下一张图片"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function ContributionPanel({ onClose }: { onClose: () => void }) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle')

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(agentContributionPrompt)
      setCopyStatus('copied')
    } catch {
      setCopyStatus('failed')
    }
  }

  return (
    <div
      className="contribution-overlay"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section className="contribution-panel" role="dialog" aria-modal="true" aria-labelledby="contribution-title">
        <button className="contribution-panel__close" type="button" onClick={onClose} aria-label="关闭投稿指南" autoFocus>×</button>
        <span className="contribution-panel__eyebrow">AGENT-ASSISTED CONTRIBUTION</span>
        <h2 id="contribution-title">Contribute a Memory</h2>
        <p>把原始图片和下面的提示词交给编码 Agent。Agent 会先确认地图中已有地点，再整理图片、内容和 PR。</p>

        <ol className="contribution-steps">
          <li><strong>准备材料</strong><span>原始图片、作者显示顺序、发生时间，以及地点线索。</span></li>
          <li><strong>交给 Agent</strong><span>复制提示词；标题或正文未提供时，Agent 会根据图片生成不虚构的文本。</span></li>
          <li><strong>审核后发布</strong><span>管理员审核 PR；只有合并进 memories.json 的内容才会公开。</span></li>
        </ol>

        <label className="agent-prompt">
          <span>可直接交给 Agent 的提示词</span>
          <textarea readOnly value={agentContributionPrompt} rows={8} />
        </label>
        <div className="contribution-panel__actions">
          <button className="contribution-panel__copy" type="button" onClick={copyPrompt}>
            {copyStatus === 'copied' ? '已复制提示词 ✓' : copyStatus === 'failed' ? '复制失败，请手动选择' : '复制 Agent 提示词'}
          </button>
          <a href={contributionGuideUrl} target="_blank" rel="noreferrer">打开完整 Agent 指南 ↗</a>
          <a href={contributionIssueUrl} target="_blank" rel="noreferrer">无法使用 Agent？改用 Issue ↗</a>
        </div>
      </section>
    </div>
  )
}

function ShopCard({ shop, onOpen }: { shop: Shop; onOpen: () => void }) {
  const cover = shop.media[0]

  return (
    <button className="shop-card" type="button" onClick={onOpen} aria-label={`打开探店：${shop.name}`}>
      <span className="shop-card__cover">
        {cover && <img src={thumbnailSource(cover)} alt="" loading="lazy" decoding="async" />}
        <span className="shop-card__count">{shop.media.length.toString().padStart(2, '0')} PHOTOS</span>
      </span>
      <span className="shop-card__copy">
        <span className="shop-card__category">{shop.category}</span>
        <strong className="shop-card__name">{shop.name}</strong>
        <span className="shop-card__summary">{shop.summary}</span>
        <span className="shop-card__open">OPEN LOG <span aria-hidden="true">↗</span></span>
      </span>
    </button>
  )
}

function formatOccurredAt(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...(value.includes('T') ? { hour: '2-digit', minute: '2-digit', hour12: false } : {}),
    timeZone: 'Asia/Shanghai',
  }).format(new Date(value))
}

function MemoryCard({
  memory,
  authorsById,
  onPreview,
  onFollowLink,
  isFocused,
}: {
  memory: Memory
  authorsById: Map<string, Author>
  onPreview: (index: number) => void
  onFollowLink: () => void
  isFocused: boolean
}) {
  const memoryAuthors = memory.authors
    .map((authorId) => authorsById.get(authorId))
    .filter((author): author is Author => Boolean(author))

  return (
    <article className={`memory-card ${isFocused ? 'is-focused' : ''}`} id={`memory-${memory.id}`} data-memory-id={memory.id}>
      <div className="memory-card__author-line">
        {memoryAuthors.map((author, index) => (
          <span key={author.id}>
            {index > 0 && <span className="memory-card__author-separator" aria-hidden="true"> · </span>}
            {author.profileUrl
              ? <a href={author.profileUrl} target="_blank" rel="noreferrer">{author.displayName}</a>
              : author.displayName}
          </span>
        ))}
      </div>
      <header className="memory-card__header">
        <time dateTime={memory.occurredAt}>{formatOccurredAt(memory.occurredAt)}</time>
        <span>{memory.id}</span>
      </header>
      <h3>
        <a
          href={atlasHref({ placeId: memory.placeId, memoryId: memory.id, author: 'all', time: 'all', order: 'newest' })}
          onClick={(event) => {
            event.preventDefault()
            onFollowLink()
          }}
        >
          {memory.title}
        </a>
      </h3>
      <p>{memory.description}</p>
      {memory.media.length > 0 && (
        <div className="memory-card__media">
          {memory.media.map((item, index) => (
            <MediaBlock key={`${memory.id}-${item.src}`} item={item} onPreview={() => onPreview(index)} />
          ))}
        </div>
      )}
      <footer className="memory-card__footer">
        <span>{memory.license}</span>
        <span className="memory-card__links">
          <a
            href={atlasHref({ placeId: memory.placeId, memoryId: memory.id, author: 'all', time: 'all', order: 'newest' })}
            onClick={(event) => {
              event.preventDefault()
              onFollowLink()
            }}
            aria-label={`打开记忆永久链接：${memory.title}`}
          >
            LINK ↗
          </a>
          {memory.sourceIssue && <a href={memory.sourceIssue} target="_blank" rel="noreferrer">SOURCE ↗</a>}
        </span>
      </footer>
    </article>
  )
}

function App() {
  const [initialUrlState] = useState(readAtlasUrl)
  const [activePlaceId, setActivePlaceId] = useState<string | null>(initialUrlState.placeId)
  const [hoveredPlaceId, setHoveredPlaceId] = useState<string | null>(null)
  const [activeRouteId, setActiveRouteId] = useState<string | null>(routes[0]?.id ?? null)
  const [remoteMedia, setRemoteMedia] = useState<Record<string, MediaItem[]>>({})
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null)
  const [selectedMemoryId, setSelectedMemoryId] = useState<string | null>(null)
  const [focusedMemoryId, setFocusedMemoryId] = useState<string | null>(initialUrlState.memoryId)
  const [memoryAuthorFilter, setMemoryAuthorFilter] = useState(initialUrlState.author)
  const [memoryTimeFilter, setMemoryTimeFilter] = useState(initialUrlState.time)
  const [memoryOrder, setMemoryOrder] = useState<'newest' | 'oldest'>(initialUrlState.order)
  const [contributionOpen, setContributionOpen] = useState(false)

  const activePlace = useMemo(
    () => places.find((place) => place.id === activePlaceId) ?? null,
    [activePlaceId],
  )
  const activePlaceIndex = activePlace ? places.findIndex((place) => place.id === activePlace.id) : -1
  const previousPlace = activePlaceIndex >= 0 ? places[(activePlaceIndex - 1 + places.length) % places.length] : null
  const nextPlace = activePlaceIndex >= 0 ? places[(activePlaceIndex + 1) % places.length] : null
  const selectedShop = activePlace?.shops?.find((shop) => shop.id === selectedShopId) ?? null
  const selectedMemory = memories.find((memory) => memory.id === selectedMemoryId) ?? null
  const hasShops = Boolean(activePlace?.shops?.length)
  const activePlaceMemories = useMemo(
    () => memories.filter((memory) => memory.placeId === activePlace?.id),
    [activePlace?.id],
  )
  const memoryAuthors = useMemo(() => {
    const ids = new Set(activePlaceMemories.flatMap((memory) => memory.authors))
    return authors.filter((author) => ids.has(author.id))
  }, [activePlaceMemories])
  const memoryTimes = useMemo(
    () => [...new Set(activePlaceMemories.map((memory) => memory.occurredAt))].sort().reverse(),
    [activePlaceMemories],
  )
  const filteredMemories = useMemo(
    () => activePlaceMemories
      .filter((memory) => memoryAuthorFilter === 'all' || memory.authors.includes(memoryAuthorFilter))
      .filter((memory) => memoryTimeFilter === 'all' || memory.occurredAt === memoryTimeFilter)
      .sort((left, right) => {
        const delta = Date.parse(right.occurredAt) - Date.parse(left.occurredAt)
        return memoryOrder === 'newest' ? delta : -delta
      }),
    [activePlaceMemories, memoryAuthorFilter, memoryOrder, memoryTimeFilter],
  )
  const authorsById = useMemo(() => new Map(authors.map((author) => [author.id, author])), [])
  const previewItems = selectedMemory
    ? selectedMemory.media
    : selectedShop
      ? selectedShop.media
      : activePlace
        ? (remoteMedia[activePlace.id] ?? activePlace.media)
        : []
  const previewItem = previewIndex === null ? null : previewItems[previewIndex] ?? null

  useEffect(() => {
    setSelectedShopId(null)
    setSelectedMemoryId(null)
    setPreviewIndex(null)
  }, [activePlaceId])

  useEffect(() => {
    const handlePopState = () => {
      const next = readAtlasUrl()
      setActivePlaceId(next.placeId)
      setFocusedMemoryId(next.memoryId)
      setMemoryAuthorFilter(next.author)
      setMemoryTimeFilter(next.time)
      setMemoryOrder(next.order)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    if (!focusedMemoryId || !activePlace) return
    const targetMemory = memories.find((memory) => memory.id === focusedMemoryId)
    if (!targetMemory || targetMemory.placeId !== activePlace.id) return

    const frame = window.requestAnimationFrame(() => {
      document.getElementById(`memory-${focusedMemoryId}`)?.scrollIntoView({ block: 'center' })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [activePlace, focusedMemoryId, filteredMemories])

  useEffect(() => {
    if (!activePlace) return
    const controller = new AbortController()
    loadRemoteMedia(activePlace.id, controller.signal)
      .then((items) => {
        if (items) setRemoteMedia((current) => ({ ...current, [activePlace.id]: items }))
      })
      .catch(() => undefined)
    return () => controller.abort()
  }, [activePlace])

  useEffect(() => {
    document.title = activePlace ? `${activePlace.title} · Memory Atlas` : 'Memory Atlas'
  }, [activePlace])

  const handleHoverPlace = useCallback((placeId: string | null) => {
    setHoveredPlaceId(placeId)
  }, [])

  const handleSelectPlace = useCallback((placeId: string) => {
    setActivePlaceId(placeId)
    setFocusedMemoryId(null)
    setMemoryAuthorFilter('all')
    setMemoryTimeFilter('all')
    setMemoryOrder('newest')
    setAtlasUrl({ placeId, memoryId: null, author: 'all', time: 'all', order: 'newest' })
  }, [])

  const handleClearPlace = useCallback(() => {
    setActivePlaceId(null)
    setFocusedMemoryId(null)
    setMemoryAuthorFilter('all')
    setMemoryTimeFilter('all')
    setMemoryOrder('newest')
    setAtlasUrl({ placeId: null, memoryId: null, author: 'all', time: 'all', order: 'newest' })
  }, [])

  const handleFollowMemoryLink = useCallback((memory: Memory) => {
    setActivePlaceId(memory.placeId)
    setFocusedMemoryId(memory.id)
    setMemoryAuthorFilter('all')
    setMemoryTimeFilter('all')
    setMemoryOrder('newest')
    setAtlasUrl({ placeId: memory.placeId, memoryId: memory.id, author: 'all', time: 'all', order: 'newest' })
  }, [])

  const handleAuthorFilter = useCallback((author: string) => {
    setMemoryAuthorFilter(author)
    setFocusedMemoryId(null)
    setAtlasUrl({ placeId: activePlaceId, memoryId: null, author, time: memoryTimeFilter, order: memoryOrder }, 'replace')
  }, [activePlaceId, memoryOrder, memoryTimeFilter])

  const handleTimeFilter = useCallback((time: string) => {
    setMemoryTimeFilter(time)
    setFocusedMemoryId(null)
    setAtlasUrl({ placeId: activePlaceId, memoryId: null, author: memoryAuthorFilter, time, order: memoryOrder }, 'replace')
  }, [activePlaceId, memoryAuthorFilter, memoryOrder])

  const handleMemoryOrder = useCallback((order: 'newest' | 'oldest') => {
    setMemoryOrder(order)
    setFocusedMemoryId(null)
    setAtlasUrl({ placeId: activePlaceId, memoryId: null, author: memoryAuthorFilter, time: memoryTimeFilter, order }, 'replace')
  }, [activePlaceId, memoryAuthorFilter, memoryTimeFilter])

  const handleClearMemoryFilters = useCallback(() => {
    setMemoryAuthorFilter('all')
    setMemoryTimeFilter('all')
    setMemoryOrder('newest')
    setFocusedMemoryId(null)
    setAtlasUrl({ placeId: activePlaceId, memoryId: null, author: 'all', time: 'all', order: 'newest' }, 'replace')
  }, [activePlaceId])

  const handleSelectShop = useCallback((shopId: string) => {
    setSelectedShopId(shopId)
    setSelectedMemoryId(null)
    setPreviewIndex(null)
  }, [])

  const handlePreviewPlaceMedia = useCallback((index: number) => {
    setSelectedMemoryId(null)
    setPreviewIndex(index)
  }, [])

  const handlePreviewMemoryMedia = useCallback((memoryId: string, index: number) => {
    setSelectedMemoryId(memoryId)
    setPreviewIndex(index)
  }, [])

  const handleSelectRoute = useCallback((routeId: string) => {
    setActiveRouteId(routeId)
  }, [])

  return (
    <main className={`app-shell ${activePlace ? 'has-detail' : ''}`}>
      <div className="map-stage">
        <MapView
          places={places}
          routes={routes}
          activePlaceId={activePlaceId}
          hoveredPlaceId={hoveredPlaceId}
          activeRouteId={activeRouteId}
          onHoverPlace={handleHoverPlace}
          onSelectPlace={handleSelectPlace}
          onClearPlace={handleClearPlace}
          onSelectRoute={handleSelectRoute}
        />

      </div>

      {activePlace && (
        <aside className="detail-drawer" aria-label={`${activePlace.title}详情`}>
          <button className="detail-drawer__close" type="button" onClick={handleClearPlace} aria-label="关闭详情">×</button>
          <div className="detail-drawer__identity" aria-label={activePlace.title}>
            <img
              className="detail-drawer__identity-icon"
              src={activePlace.markerImage ?? artworkDataUri(activePlace.id, activePlace.accent, activePlace.art)}
              alt=""
              aria-hidden="true"
            />
            <div className="detail-drawer__identity-copy">
              <h1 className="detail-drawer__identity-name">{activePlace.title}</h1>
              {activePlace.englishTitle && <p className="detail-drawer__identity-english">{activePlace.englishTitle}</p>}
              <p className="detail-drawer__identity-subtitle">{activePlace.subtitle}</p>
            </div>
          </div>
          {selectedShop ? (
            <section className="shop-detail" aria-label={`${selectedShop.name}探店详情`}>
              <button className="shop-detail__back" type="button" onClick={() => setSelectedShopId(null)}>
                <span aria-hidden="true">←</span> 返回地点
              </button>
              <div className="shop-detail__heading">
                <span className="detail-section__index">SHOP / {selectedShop.category.toUpperCase()}</span>
                <h2>{selectedShop.name}</h2>
              </div>
              <p className="detail-drawer__description">{selectedShop.description}</p>
              {selectedShop.tags && (
                <div className="shop-tags" aria-label="店铺标签">
                  {selectedShop.tags.map((tag) => <span key={tag}>{tag}</span>)}
                </div>
              )}
              <div className="detail-section__heading">
                <span className="detail-section__index">01 / PHOTO LOG</span>
                <h3>现场照片</h3>
              </div>
              <div className="media-grid">
                {previewItems.map((item, index) => <MediaBlock key={`${item.type}-${index}`} item={item} onPreview={() => setPreviewIndex(index)} />)}
              </div>
            </section>
          ) : (
            <>
              <p className="detail-drawer__description">{activePlace.description}</p>
              {hasShops && activePlace.shops && (
                <section className="detail-section detail-section--shops" aria-label="探店列表">
                  <div className="detail-section__heading">
                    <span className="detail-section__index">01 / SHOPPING LOG</span>
                    <h2>探店</h2>
                    <span className="detail-section__count">{activePlace.shops.length.toString().padStart(2, '0')} PLACES</span>
                  </div>
                  <div className="shop-list">
                    {activePlace.shops.map((shop) => <ShopCard key={shop.id} shop={shop} onOpen={() => handleSelectShop(shop.id)} />)}
                  </div>
                </section>
              )}
              <section className="detail-section" aria-label="地点照片">
                <div className="detail-section__heading">
                  <span className="detail-section__index">{hasShops ? '02' : '01'} / FIELD NOTES</span>
                  <h2>地点图册</h2>
                </div>
                <div className="media-grid">
                  {(remoteMedia[activePlace.id] ?? activePlace.media).map((item, index) => <MediaBlock key={`${item.type}-${index}`} item={item} onPreview={() => handlePreviewPlaceMedia(index)} />)}
                </div>
              </section>
              {activePlaceMemories.length > 0 && (
                <section className="detail-section shared-memories" aria-label="Shared Memories">
                  <div className="detail-section__heading">
                    <span className="detail-section__index">MEMORY / SHARED</span>
                    <h2>Shared Memories</h2>
                    <span className="detail-section__count">{activePlaceMemories.length.toString().padStart(2, '0')} STORIES</span>
                  </div>
                  <div className="memory-filters" aria-label="记忆筛选">
                    <label>
                      <span>作者</span>
                      <select value={memoryAuthorFilter} onChange={(event) => handleAuthorFilter(event.target.value)}>
                        <option value="all">全部作者</option>
                        {memoryAuthors.map((author) => <option key={author.id} value={author.id}>{author.displayName}</option>)}
                      </select>
                    </label>
                    <label>
                      <span>时间</span>
                      <select value={memoryTimeFilter} onChange={(event) => handleTimeFilter(event.target.value)}>
                        <option value="all">全部时间</option>
                        {memoryTimes.map((time) => <option key={time} value={time}>{formatOccurredAt(time)}</option>)}
                      </select>
                    </label>
                    <label>
                      <span>排序</span>
                      <select value={memoryOrder} onChange={(event) => handleMemoryOrder(event.target.value as 'newest' | 'oldest')}>
                        <option value="newest">最新在前</option>
                        <option value="oldest">最早在前</option>
                      </select>
                    </label>
                  </div>
                  {(memoryAuthorFilter !== 'all' || memoryTimeFilter !== 'all' || memoryOrder !== 'newest') && (
                    <button className="memory-filters__clear" type="button" onClick={handleClearMemoryFilters}>清除筛选与排序</button>
                  )}
                  <div className="memory-list">
                    {filteredMemories.map((memory) => (
                      <MemoryCard
                        key={memory.id}
                        memory={memory}
                        authorsById={authorsById}
                        onPreview={(index) => handlePreviewMemoryMedia(memory.id, index)}
                        onFollowLink={() => handleFollowMemoryLink(memory)}
                        isFocused={focusedMemoryId === memory.id}
                      />
                    ))}
                    {filteredMemories.length === 0 && <p className="memory-list__empty">没有符合当前筛选条件的记忆。</p>}
                  </div>
                </section>
              )}
            </>
          )}
          {previousPlace && nextPlace && (
            <nav className="detail-place-nav" aria-label="详情地点切换">
              <span className="detail-place-nav__index">
                {String(activePlaceIndex + 1).padStart(2, '0')} / {String(places.length).padStart(2, '0')}
              </span>
              <button type="button" aria-label={`上一个地点：${previousPlace.title}`} onClick={() => handleSelectPlace(previousPlace.id)}>
                <span aria-hidden="true">←</span>
                <strong>{previousPlace.title}</strong>
              </button>
              <button type="button" aria-label={`下一个地点：${nextPlace.title}`} onClick={() => handleSelectPlace(nextPlace.id)}>
                <strong>{nextPlace.title}</strong>
                <span aria-hidden="true">→</span>
              </button>
            </nav>
          )}
        </aside>
      )}

      {previewItem && previewIndex !== null && (
        <ImageLightbox
          items={previewItems}
          index={previewIndex}
          onClose={() => setPreviewIndex(null)}
          onNavigate={setPreviewIndex}
        />
      )}

      {contributionOpen && <ContributionPanel onClose={() => setContributionOpen(false)} />}

      <a
        className="github-repo-link"
        href={repositoryUrl}
        target="_blank"
        rel="noreferrer"
        aria-label="打开 Memory Atlas GitHub 仓库"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M12 .7a11.3 11.3 0 0 0-3.57 22.02c.57.1.78-.25.78-.55v-2.14c-3.17.69-3.84-1.34-3.84-1.34-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.75 1.18 1.75 1.18 1.02 1.74 2.68 1.24 3.33.95.1-.74.4-1.24.73-1.53-2.53-.29-5.2-1.27-5.2-5.65 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.45.11-3.02 0 0 .96-.31 3.13 1.17a10.86 10.86 0 0 1 5.7 0c2.17-1.48 3.13-1.17 3.13-1.17.62 1.57.23 2.73.11 3.02.73.8 1.18 1.82 1.18 3.07 0 4.39-2.68 5.35-5.22 5.64.41.36.78 1.07.78 2.16v3.2c0 .3.2.66.79.55A11.3 11.3 0 0 0 12 .7Z" />
        </svg>
      </a>
      <button className="contribute-memory-link" type="button" onClick={() => setContributionOpen(true)}>
        <span>＋</span> Contribute a Memory
      </button>
    </main>
  )
}

export default App
