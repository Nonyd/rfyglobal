export type HomeGallerySlide = {
  id: string
  url: string
  caption: string | null
  city: string | null
  eventName: string | null
  galleryEvent: { name: string; city: string } | null
}
