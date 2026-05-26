import type { EmailTemplate } from '@prisma/client'
import { EMAIL_TEMPLATE_DEFAULTS, getBaseDesign, type EmailTemplateKey } from '@/lib/email-defaults'

export type EmailTemplateListItem = {
  key: string
  name: string
  subject: string
  description: string | null
  html: string
  isCustom: boolean
  hasSavedDesign: boolean
}

export function slugifyTemplateKey(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60)
}

export function isValidTemplateKey(key: string): boolean {
  return /^[a-z][a-z0-9_]*$/.test(key) && key.length >= 2 && key.length <= 60
}

export function isBuiltInTemplateKey(key: string): key is EmailTemplateKey {
  return key in EMAIL_TEMPLATE_DEFAULTS
}

export function buildPlaceholderHtml(heading: string, body: string): string {
  const safeHeading = heading.replace(/</g, '&lt;')
  const safeBody = body.replace(/</g, '&lt;')
  return `
    <div style="background:#0F0F0F;max-width:600px;margin:0 auto;padding:40px;font-family:Arial,sans-serif;">
      <img src="https://rfyglobal.org/images/logo-white.png" alt="Room For You" style="height:44px;margin-bottom:32px;display:block;" />
      <h1 style="color:#F8F8F8;font-size:24px;margin:0 0 16px;">${safeHeading}</h1>
      <p style="color:#A0A0A0;font-size:14px;line-height:1.8;margin:0;">${safeBody}</p>
      <p style="color:#585858;font-size:11px;text-align:center;margin-top:32px;">Room For You · rfyglobal.org</p>
    </div>
  `.trim()
}

export function resolveBuiltInTemplate(key: string): Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'> | null {
  if (!isBuiltInTemplateKey(key)) return null
  const def = EMAIL_TEMPLATE_DEFAULTS[key]
  const bodyText = def.description ?? 'Edit this template to customize your email content.'
  return {
    key,
    name: def.name,
    subject: def.subject,
    description: def.description ?? null,
    html:
      'defaultHtml' in def && typeof def.defaultHtml === 'string'
        ? def.defaultHtml
        : buildPlaceholderHtml(def.name, bodyText),
    design: getBaseDesign({
      heading: def.name,
      body: bodyText,
      ctaText: 'Visit rfyglobal.org',
      ctaUrl: 'https://rfyglobal.org',
    }) as EmailTemplate['design'],
  }
}

export function mergeEmailTemplateList(dbTemplates: EmailTemplate[]): EmailTemplateListItem[] {
  const dbByKey = new Map(dbTemplates.map((t) => [t.key, t]))
  const seen = new Set<string>()
  const items: EmailTemplateListItem[] = []

  for (const key of Object.keys(EMAIL_TEMPLATE_DEFAULTS) as EmailTemplateKey[]) {
    seen.add(key)
    const def = EMAIL_TEMPLATE_DEFAULTS[key]
    const saved = dbByKey.get(key)
    const fallback = resolveBuiltInTemplate(key)
    items.push({
      key,
      name: saved?.name ?? def.name,
      subject: saved?.subject ?? def.subject,
      description: saved?.description ?? def.description ?? null,
      html: saved?.html ?? fallback?.html ?? '',
      isCustom: false,
      hasSavedDesign: Boolean(saved),
    })
  }

  for (const saved of dbTemplates) {
    if (seen.has(saved.key)) continue
    items.push({
      key: saved.key,
      name: saved.name,
      subject: saved.subject,
      description: saved.description ?? null,
      html: saved.html,
      isCustom: true,
      hasSavedDesign: true,
    })
  }

  return items.sort((a, b) => a.name.localeCompare(b.name))
}

export function resolveEmailTemplateRecord(
  key: string,
  dbTemplate: EmailTemplate | null,
): EmailTemplate | (Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) | null {
  if (dbTemplate) return dbTemplate
  return resolveBuiltInTemplate(key)
}
