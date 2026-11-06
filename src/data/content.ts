import placesData from './places.json'
import routesData from './routes.json'
import authorsData from './authors.json'
import memoriesData from './memories.json'
import type { Author, MediaItem, Memory, Place, Route } from '../types/content'

const staticBaseUrl = new URL(import.meta.env.BASE_URL, window.location.href)

function staticAssetUrl(value: string | undefined) {
  if (!value?.startsWith('/')) return value
  return new URL(value.slice(1), staticBaseUrl).pathname
}

function normalizeMedia(item: MediaItem): MediaItem {
  return {
    ...item,
    src: staticAssetUrl(item.src) ?? item.src,
    thumbnail: staticAssetUrl(item.thumbnail),
    poster: staticAssetUrl(item.poster),
  }
}

export const places = (placesData as unknown as Place[]).map((place) => ({
  ...place,
  markerImage: staticAssetUrl(place.markerImage),
  media: place.media.map(normalizeMedia),
  shops: place.shops?.map((shop) => ({ ...shop, media: shop.media.map(normalizeMedia) })),
}))
export const routes = routesData as unknown as Route[]
export const authors = (authorsData as unknown as Author[]).map((author) => ({
  ...author,
  avatarUrl: staticAssetUrl(author.avatarUrl),
}))
export const memories = (memoriesData as unknown as Memory[]).map((memory) => ({
  ...memory,
  media: memory.media.map(normalizeMedia),
}))
