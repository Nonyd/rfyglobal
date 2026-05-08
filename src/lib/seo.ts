export const SITE_URL = 'https://rfyglobal.org'
export const SITE_NAME = 'Room For You'
export const SITE_DESCRIPTION =
  'A global Christian community with Minister Yadah. Monthly gatherings. Daily Word. Prayer. Join us — there is room for you here.'

export function canonical(path: string): string {
  return `${SITE_URL}${path}`
}

export function ogImageUrl(title: string, subtitle?: string): string {
  const params = new URLSearchParams({ title })
  if (subtitle) params.set('subtitle', subtitle)
  return `${SITE_URL}/og?${params.toString()}`
}
