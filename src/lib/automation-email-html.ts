/** Shared fallback HTML for automation emails (no server-only imports). */

export function buildBirthdayEmail(firstName: string): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;background:#0F0F0F;color:#F8F8F8;padding:40px;">
      <img src="https://rfyglobal.org/images/logo-white.png" alt="Room For You" style="height:44px;margin-bottom:32px;display:block;" />
      <p style="color:#E8001C;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 16px;">Happy Birthday</p>
      <h1 style="font-size:32px;margin:0 0 16px;line-height:1.2;">
        🎂 Happy Birthday, ${firstName}!
      </h1>
      <p style="color:#A0A0A0;font-size:15px;line-height:1.8;margin:0 0 24px;">
        On your special day, the entire Room For You family celebrates you.
        May this year be filled with God's grace, joy, and every good thing He has promised you.
      </p>
      <p style="color:#A0A0A0;font-size:15px;line-height:1.8;margin:0 0 32px;">
        <em>"This is the day the Lord has made; let us rejoice and be glad in it."</em><br/>
        <span style="color:#585858;font-size:13px;">— Psalm 118:24</span>
      </p>
      <p style="color:#F8F8F8;font-size:14px;">With love,<br/>The Room For You Team 🙏</p>
      <div style="margin-top:40px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.08);">
        <p style="color:#585858;font-size:11px;text-align:center;">Room For You · rfyglobal.org · Jesus to Nations</p>
      </div>
    </div>
  `
}

export function buildChristmasEmail(firstName: string): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;background:#0F0F0F;color:#F8F8F8;padding:40px;">
      <img src="https://rfyglobal.org/images/logo-white.png" alt="Room For You" style="height:44px;margin-bottom:32px;display:block;" />
      <p style="color:#E8001C;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 16px;">Merry Christmas</p>
      <h1 style="font-size:28px;margin:0 0 16px;line-height:1.2;">
        🎄 Merry Christmas, ${firstName}!
      </h1>
      <p style="color:#A0A0A0;font-size:15px;line-height:1.8;margin:0 0 20px;">
        On this glorious day, we celebrate the greatest gift ever given —
        Jesus Christ, born for our salvation.
      </p>
      <p style="color:#A0A0A0;font-size:15px;line-height:1.8;margin:0 0 32px;">
        May this Christmas fill your heart with joy, your home with peace,
        and your spirit with the wonder of God's love.
      </p>
      <div style="background:#1A1A1A;border-left:4px solid #E8001C;padding:20px;margin:0 0 32px;">
        <p style="font-size:16px;line-height:1.7;font-style:italic;margin:0 0 8px;">
          "For unto us a child is born, unto us a son is given…"
        </p>
        <p style="color:#E8001C;font-size:13px;font-weight:bold;margin:0;">— Isaiah 9:6</p>
      </div>
      <p style="color:#F8F8F8;font-size:14px;">With love,<br/>The Room For You Team 🙏</p>
      <div style="margin-top:40px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.08);">
        <p style="color:#585858;font-size:11px;text-align:center;">Room For You · rfyglobal.org · Jesus to Nations</p>
      </div>
    </div>
  `
}

export function buildNewYearEmail(firstName: string): string {
  const year = new Date().getFullYear()
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;background:#0F0F0F;color:#F8F8F8;padding:40px;">
      <img src="https://rfyglobal.org/images/logo-white.png" alt="Room For You" style="height:44px;margin-bottom:32px;display:block;" />
      <p style="color:#E8001C;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 16px;">Happy New Year</p>
      <h1 style="font-size:28px;margin:0 0 16px;line-height:1.2;">
        🎉 Happy New Year, ${firstName}!
      </h1>
      <p style="color:#A0A0A0;font-size:15px;line-height:1.8;margin:0 0 20px;">
        Welcome to ${year}! A brand new year, full of God's mercies and new beginnings.
        We believe this will be your greatest year yet.
      </p>
      <p style="color:#A0A0A0;font-size:15px;line-height:1.8;margin:0 0 32px;">
        May God's favour go before you in everything you do this year.
      </p>
      <div style="background:#1A1A1A;border-left:4px solid #E8001C;padding:20px;margin:0 0 32px;">
        <p style="font-size:16px;line-height:1.7;font-style:italic;margin:0 0 8px;">
          "Behold, I am doing a new thing; now it springs forth, do you not perceive it?"
        </p>
        <p style="color:#E8001C;font-size:13px;font-weight:bold;margin:0;">— Isaiah 43:19</p>
      </div>
      <p style="color:#F8F8F8;font-size:14px;">With love,<br/>The Room For You Team 🙏</p>
      <div style="margin-top:40px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.08);">
        <p style="color:#585858;font-size:11px;text-align:center;">Room For You · rfyglobal.org · Jesus to Nations</p>
      </div>
    </div>
  `
}

export function buildEasterEmail(firstName: string): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;background:#0F0F0F;color:#F8F8F8;padding:40px;">
      <img src="https://rfyglobal.org/images/logo-white.png" alt="Room For You" style="height:44px;margin-bottom:32px;display:block;" />
      <p style="color:#E8001C;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 16px;">Happy Easter</p>
      <h1 style="font-size:28px;margin:0 0 16px;line-height:1.2;">
        ✝️ He is Risen, ${firstName}!
      </h1>
      <p style="color:#A0A0A0;font-size:15px;line-height:1.8;margin:0 0 20px;">
        Today we celebrate the resurrection of Jesus Christ — the greatest victory
        in all of history. Because He lives, we live. Because He rose, we rise.
      </p>
      <p style="color:#A0A0A0;font-size:15px;line-height:1.8;margin:0 0 32px;">
        Happy Easter from all of us at Room For You. May the power of the resurrection
        be real and alive in your life today.
      </p>
      <div style="background:#1A1A1A;border-left:4px solid #E8001C;padding:20px;margin:0 0 32px;">
        <p style="font-size:16px;line-height:1.7;font-style:italic;margin:0 0 8px;">
          "He is not here; he has risen, just as he said."
        </p>
        <p style="color:#E8001C;font-size:13px;font-weight:bold;margin:0;">— Matthew 28:6</p>
      </div>
      <p style="color:#F8F8F8;font-size:14px;">With love,<br/>The Room For You Team 🙏</p>
      <div style="margin-top:40px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.08);">
        <p style="color:#585858;font-size:11px;text-align:center;">Room For You · rfyglobal.org · Jesus to Nations</p>
      </div>
    </div>
  `
}
