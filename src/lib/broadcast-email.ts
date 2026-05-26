export function wrapInEmailTemplate(body: string): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;background:#0F0F0F;color:#F8F8F8;padding:40px;">
      <img src="https://rfyglobal.org/images/logo-white.png" alt="Room For You" style="height:44px;margin-bottom:32px;display:block;" />
      <div style="font-size:15px;line-height:1.8;color:#F8F8F8;">
        ${body.replace(/\n/g, '<br>')}
      </div>
      <div style="margin-top:40px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.08);">
        <p style="color:#585858;font-size:11px;text-align:center;">Room For You · rfyglobal.org · Jesus to Nations</p>
      </div>
    </div>
  `
}

export function personalizeBroadcastText(
  text: string,
  recipient: { email: string; name: string },
): string {
  const firstName = recipient.name?.split(' ')[0] ?? 'Friend'
  return text
    .replace(/\{\{first_name\}\}/g, firstName)
    .replace(/\{\{name\}\}/g, recipient.name ?? 'Friend')
    .replace(/\{\{email\}\}/g, recipient.email)
}
