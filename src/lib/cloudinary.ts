import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export { cloudinary }

export const UPLOAD_FOLDERS = {
  blogCover: 'rfyglobal/blog/covers',
  blogInline: 'rfyglobal/blog/inline',
  scriptureAudio: 'rfyglobal/scripture/audio',
  studyMaterial: 'rfyglobal/study/materials',
  gallery: 'rfyglobal/gallery',
  cms: 'rfyglobal/cms',
  portraits: 'rfyglobal/portraits',
  eventImage: 'rfyglobal/events',
  testimony: 'rfyglobal/testimonies',
  homeCarousel: 'rfyglobal/home-carousel',
} as const

export function cloudinaryImageUrl(
  publicId: string,
  options: {
    width?: number
    height?: number
    quality?: string | number
    format?: string
    crop?: string
  } = {},
): string {
  const { width, height, quality = 'auto', format = 'auto', crop = 'fill' } = options

  const transforms = [
    `f_${format}`,
    `q_${quality}`,
    width && `w_${width}`,
    height && `h_${height}`,
    width && height && `c_${crop}`,
  ]
    .filter(Boolean)
    .join(',')

  return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${transforms}/${publicId}`
}

export function getPublicId(url: string): string {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/)
  return match?.[1] ?? url
}
