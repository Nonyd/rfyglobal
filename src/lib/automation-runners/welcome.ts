export function buildWelcomeEmail(firstName: string): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;background:#0F0F0F;color:#F8F8F8;padding:40px;">
      <img src="https://rfyglobal.org/images/logo-white.png" alt="Room For You" style="height:44px;margin-bottom:32px;display:block;" />
      <p style="color:#E8001C;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 16px;">Welcome</p>
      <h1 style="font-size:28px;margin:0 0 16px;line-height:1.2;">
        Welcome to Room For You, ${firstName}!
      </h1>
      <p style="color:#A0A0A0;font-size:15px;line-height:1.8;margin:0 0 20px;">
        We are so glad you are here. Room For You is a community of young men and women 
        singing songs of salvation, studying the Word, and getting others saved.
      </p>
      <p style="color:#A0A0A0;font-size:15px;line-height:1.8;margin:0 0 32px;">
        There is room for you — in worship, in prayer, in community, and in the purposes of God.
      </p>
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:32px;">
        <a href="https://rfyglobal.org/events" style="display:inline-block;background:#E8001C;color:#ffffff;padding:12px 24px;font-size:12px;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;">
          Upcoming Events →
        </a>
        <a href="https://rfyglobal.org/word" style="display:inline-block;background:transparent;border:1px solid rgba(255,255,255,0.2);color:#ffffff;padding:12px 24px;font-size:12px;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;">
          Daily Word
        </a>
      </div>
      <p style="color:#F8F8F8;font-size:14px;">With love,<br/>Minister Yadah & The Room For You Team 🙏</p>
      <div style="margin-top:40px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.08);">
        <p style="color:#585858;font-size:11px;text-align:center;">Room For You · rfyglobal.org · Jesus to Nations</p>
      </div>
    </div>
  `
}
