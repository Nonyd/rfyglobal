import { db } from '@/lib/db'

const DEFAULTS: Record<string, string> = {
  'landing.hero.eyebrow': 'Worship · Prayer · Study · Community',
  'landing.hero.headline1': 'There Is Room',
  'landing.hero.headline2': 'For You.',
  'landing.hero.subtext':
    'A community of young men and women singing songs of salvation, studying the Word, and getting others saved. Jesus to nations.',
  'landing.hero.cta.primary': 'Join the Community',
  'landing.hero.cta.secondary': 'Learn More',
  'landing.vision.heading': 'Building a community',
  'landing.vision.subheading': 'Jesus to Nations',
  'landing.vision.text':
    'We exist to raise a family of believers who walk in newness of life — ambassadors reconciling others to God.',
  'landing.cta.headline': 'The door is open.',
  'landing.cta.subtext': 'Step in. There is room for you.',
  'landing.cta.button': 'Join the Community',

  'shepherd.quote':
    'Room For You was born out of a deep conviction — that every young person deserves a community where they are seen, known, and called into purpose. This is not just a ministry. It is a family. And there is room for you here.',
  'shepherd.name': 'Minister Yadah',
  'shepherd.title': 'Founder, Room For You',
  'shepherd.image': '/images/yadah-portrait.svg',
  'shepherd.link': 'https://yadahworld.com',

  'highlights.1.title': 'Monthly Meetings',
  'highlights.1.desc': 'Physical gatherings across cities where the Word comes alive.',
  'highlights.2.title': 'Prayer',
  'highlights.2.desc': "Corporate and personal prayer — we carry each other's burdens.",
  'highlights.3.title': 'Bible Study',
  'highlights.3.desc': 'Deep, consistent study of the Word with structured tasks.',
  'highlights.4.title': 'Mentorship',
  'highlights.4.desc': 'One-on-one counseling and spiritual mentorship.',

  'about.hero.headline1': 'More Than a Ministry.',
  'about.hero.headline2': 'A Family.',
  'about.vision.text':
    'Building a community of young men and women who sing songs of salvation with conviction of their identity in Christ, study the Bible, pray and get others saved.',
  'about.mission.heading': 'Jesus to Nations',
  'about.mission.scripture': '2 Corinthians 5:17–21',
  'about.mission.text':
    '"Therefore, if anyone is in Christ, the new creation has come: The old has gone, the new is here! All this is from God, who reconciled us to himself through Christ and gave us the ministry of reconciliation."',
  'about.yadah.bio':
    "I started Room For You because I believe every young person deserves a community where they are not just known, but called into purpose. A place where the Word of God is not just preached but lived. Where prayer is not a ritual but a lifestyle. Where you are not alone in your faith — you are surrounded by people who are running the same race.\n\nThis is that community. And there is room for you here.",
  'about.yadah.image': '/images/yadah-portrait.svg',
  'about.yadah.musicLink': 'https://yadahworld.com/music',
  'about.cta.headline': 'There is room for you.',
  'about.cta.subtext': 'Come as you are. Grow as you will.',

  'partnership.hero.headline': 'Fuel the Mission',
  'partnership.hero.subtext':
    'Every gift you sow into Room For You is a seed planted in the Kingdom. You are not just giving money — you are sending the Gospel to nations.',
  'partnership.hero.scripture':
    '"Each of you should give what you have decided in your heart to give… for God loves a cheerful giver." — 2 Corinthians 9:7',
  'partnership.bank.bankName': 'Access Bank',
  'partnership.bank.accountName': 'Room For You',
  'partnership.bank.accountNumber': '0123456789',
  'partnership.bank.contactEmail': 'partner@rfyglobal.org',
  'partnership.card1.title': 'Community Gatherings',
  'partnership.card1.desc': 'Funding physical meetings across cities where the Word comes alive.',
  'partnership.card2.title': 'Study & Resources',
  'partnership.card2.desc': 'Producing study materials, devotionals, and equipping tools for the community.',
  'partnership.card3.title': 'Evangelical Outreach',
  'partnership.card3.desc': 'Taking the Gospel to the streets — foot evangelism and outreaches.',

  'footer.tagline': 'Jesus to Nations — 2 Cor 5:17-21',
  'footer.copyright': '© 2026 Room For You · rfyglobal.org · A SonsHub Media Initiative.',
  'footer.instagram': 'https://instagram.com/roomforyou',
  'footer.youtube': 'https://youtube.com/@roomforyou',
  'footer.twitter': 'https://twitter.com/roomforyou',

  'seo.defaultTitle': 'Room For You — with Yadah',
  'seo.defaultDescription':
    'A worship, prayer, study, mentorship and evangelism community founded by Minister Yadah. Jesus to Nations. rfyglobal.org',
  'seo.ogImage': '/og-default.png',
}

export async function getContent(key: string): Promise<string> {
  try {
    const record = await db.siteContent.findUnique({ where: { key } })
    return record?.value ?? DEFAULTS[key] ?? ''
  } catch {
    return DEFAULTS[key] ?? ''
  }
}

export async function getContentMany(keys: string[]): Promise<Record<string, string>> {
  try {
    const records = await db.siteContent.findMany({
      where: { key: { in: keys } },
    })
    const map = Object.fromEntries(records.map((r) => [r.key, r.value]))
    return Object.fromEntries(keys.map((key) => [key, map[key] ?? DEFAULTS[key] ?? '']))
  } catch {
    return Object.fromEntries(keys.map((key) => [key, DEFAULTS[key] ?? '']))
  }
}

export function getDefaults() {
  return DEFAULTS
}

export function getDefaultsForKeys(keys: string[]): Record<string, string> {
  const d = getDefaults()
  return Object.fromEntries(keys.map((k) => [k, d[k] ?? '']))
}
