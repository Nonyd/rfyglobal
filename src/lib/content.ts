import 'server-only'

import { db } from '@/lib/db'
import { DEFAULT_OG_IMAGE } from '@/lib/seo'

const DEFAULTS: Record<string, string> = {
  'landing.hero.eyebrow': 'Worship · Prayer · Study · Community',
  'landing.hero.headline1': 'There Is Room',
  'landing.hero.headline2': 'For You.',
  'landing.hero.subtext':
    'A community of young men and women singing songs of salvation, studying the Word, and getting others saved. Jesus to nations.',
  'landing.hero.cta.primary': 'Join the Community',
  'landing.hero.cta.secondary': 'Our Story',
  'landing.hero.portrait': '/images/yadah-portrait.jpg',
  'landing.vision.label': 'The Vision',
  'landing.vision.heading': 'Building a community',
  'landing.vision.mission.label': 'The Mission',
  'landing.vision.mission.heading': 'Jesus to Nations',
  'landing.vision.mission.scripture': '2 Corinthians 5:17–21',
  'landing.vision.activities':
    'Monthly community gatherings across cities\nCorporate prayer and intercession\nStructured online Bible study\nOne-on-one mentorship and counseling\nFoot evangelism and outreaches',
  'landing.vision.subheading': 'Jesus to Nations',
  'landing.vision.text':
    'We exist to raise a family of believers who walk in newness of life — ambassadors reconciling others to God.',
  'landing.cta.headline': 'The door is open.',
  'landing.cta.subtext': 'Step in. There is room for you.',
  'landing.cta.label': 'Join Us',
  'landing.cta.button': 'Join the Community',
  'landing.cta.buttonSecondary': 'Our Story',

  'stats.enabled': 'true',
  'stats.stat1.number': '100',
  'stats.stat1.suffix': 'M+',
  'stats.stat1.label': 'Streams',
  'stats.stat2.number': '600',
  'stats.stat2.suffix': 'K+',
  'stats.stat2.label': 'Followers',
  'stats.stat3.number': '5',
  'stats.stat3.suffix': '+',
  'stats.stat3.label': 'Years',
  'stats.stat4.number': '24',
  'stats.stat4.suffix': '+',
  'stats.stat4.label': 'Gatherings',

  'shepherd.quote':
    'Room For You was born out of a deep conviction — that every young person deserves a community where they are seen, known, and called into purpose. This is not just a ministry. It is a family. And there is room for you here.',
  'shepherd.name': 'Minister Yadah',
  'shepherd.title': 'Founder, Room For You',
  'shepherd.portrait': '/images/yadah-portrait.svg',
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
  'highlights.section.eyebrow': 'What We Do',
  'highlights.section.title': 'Community',
  'highlights.section.titleAccent': 'life.',

  'confession.home.label': 'The Confession',
  'confession.home.lines':
    'I am saved by grace through faith.\nI am justified and redeemed by the blood of Jesus.\nI am now a part of God\'s family.\nI am saved — and I get others saved.\nIt\'s Jesus to nations, and I am a willing vessel.',
  'confession.home.footer':
    'This is the declaration of every member of Room For You. Make it yours.',
  'confession.home.link': 'Read the full confession →',
  'confession.full.lines':
    'I am saved by grace through faith.\nI am justified and redeemed by the blood of Jesus.\nI have received mercy because of the sacrifice of Jesus on the cross.\nGod\'s love has been shed abroad in my heart\nand I am sealed with the Holy Spirit.\nI am now a part of God\'s family!\nI am committed to learning the value of this family\nand I grow in both wisdom and stature.\nI am committed to study and prayers!\nI am saved and I get others saved.\nI am reconciled and I reconcile others.\nOn account of me, many come to the knowledge of the Son.\nIt\'s Jesus to nations —\nand I am a willing vessel!\nI live my life in honor of the one who died for me,\ntill his return!',
  'confession.page.eyebrow': 'Room For You',
  'confession.page.title': 'The Confession',
  'confession.page.intro': 'Scroll to declare.',
  'confession.page.cta.headline': 'Make this your confession.',
  'confession.page.cta.subtext':
    'There is a community waiting to grow with you. Step in — there is room for you.',
  'confession.page.cta.primary': 'Join the Community',
  'confession.page.cta.secondary': 'Back to Home',
  'confession.page.footer': 'rfyglobal.org · Room For You · A SonsHub Media Initiative',

  'about.hero.eyebrow': 'Our Story',
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
  'about.cta.button': 'Join the Community',
  'about.activities.heading': 'What Room For You Looks Like',
  'about.activities.1.title': 'Monthly Meetings',
  'about.activities.1.desc':
    'Physical gatherings across cities where the Word comes alive and community is built.',
  'about.activities.2.title': 'Prayer',
  'about.activities.2.desc':
    "Corporate and personal prayer — we carry one another's burdens before the throne.",
  'about.activities.3.title': 'Online Study',
  'about.activities.3.desc': 'Structured Bible study with weekly tasks and materials accessible to everyone.',
  'about.activities.4.title': 'Mentorship',
  'about.activities.4.desc': 'One-on-one spiritual mentorship and counseling for growth and accountability.',
  'about.activities.5.title': 'Counseling & Support',
  'about.activities.5.desc': "A safe community to receive support and walk through life's challenges together.",
  'about.activities.6.title': 'Evangelical Outreach',
  'about.activities.6.desc': 'Foot evangelism and outreaches — taking the Gospel beyond the walls.',
  'about.confession.heading': 'We Declare',
  'about.confession.text':
    "I am saved by grace through faith. I am justified and redeemed by the blood of Jesus. I have received mercy because of the sacrifice of Jesus on the cross. God's love has been shed abroad in my heart and I am sealed with the Holy Spirit. I am now a part of God's family! I am committed to learning the value of this family and I grow in both wisdom and stature. I am committed to study and prayers! I am saved and I get others saved. I am reconciled and I reconcile others. On account of me, many come to the knowledge of the Son. It's Jesus to nations — and I am a willing vessel! I live my life in honor of the one who died for me, till his return!",
  'about.confession.link': 'Read the full confession →',
  'about.shepherd.heading': 'The Shepherd',
  'about.shepherd.name': 'Minister Yadah',
  'about.shepherd.role': 'Founder · Room For You',
  'about.shepherd.websiteLink': 'Visit yadahworld.com →',
  'about.shepherd.musicLinkLabel': 'Listen to her music →',

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
  'footer.instagram': 'https://instagram.com/rfyglobal',
  'footer.youtube': 'https://youtube.com/@yadah',
  'footer.twitter': 'https://twitter.com/rfyglobal',
  'contact.eyebrow': 'Get In Touch',
  'contact.heading': 'We would love\nto hear from you.',
  'contact.subheading':
    'Reach out with questions, partnership enquiries, or just to say hello. We read every message.',
  'contact.email': 'hello@rfyglobal.org',
  'contact.whatsapp': '',
  'contact.instagramHandle': '@rfyglobal',
  'contact.youtubeHandle': 'Yadah',
  'contact.twitterHandle': '@rfyglobal',
  'contact.responseNote':
    'We typically respond within 24-48 hours. For urgent prayer needs, visit our Prayer Wall.',
  // If production SiteContent still has old URLs, update them in /admin/cms → Contact.
  'contact.instagram': 'https://instagram.com/rfyglobal',
  'contact.youtube': 'https://youtube.com/@yadah',
  'contact.twitter': 'https://x.com/rfyglobal',
  'contact.address': 'Abuja, Nigeria',
  'faq.heading': 'Frequently Asked\nQuestions.',
  'faq.subheading': "Can't find what you're looking for? Reach out via our contact page.",

  'seo.defaultTitle': 'Room For You — A Christian Community with Minister Yadah',
  'seo.defaultDescription':
    'Room For You is a global Christian community founded by Minister Yadah. We gather monthly across cities for worship, prayer, and Bible study. Join us — there is room for you here.',
  'seo.ogImage': DEFAULT_OG_IMAGE,

  'join.hero.line1': 'A MOVEMENT',
  'join.hero.line2': 'OF YOUNG',
  'join.hero.line3': 'BELIEVERS',
  'join.hero.line4': 'ON FIRE',
  'join.hero.line5': 'FOR JESUS.',

  'prayer.eyebrow': 'Prayer Wall',
  'prayer.title': 'We will pray\nwith you.',
  'prayer.subtitle':
    'Share your prayer request with the Room For You prayer team. Minister Yadah and the team will personally pray over every request.',
  'prayer.privacy':
    'Your prayer request is completely private — it is seen only by Minister Yadah and the Room For You prayer team. It will never be publicly displayed.',

  'pages.word.eyebrow': 'Room For You',
  'pages.word.title': 'The Word',
  'pages.word.subtitle': 'One scripture. Every day. With audio to bring it alive.',
  'pages.study.eyebrow': 'Room For You',
  'pages.study.title': 'Study Portal',
  'pages.study.subtitle':
    'Materials, resources, and tasks to help you grow in the Word. Open to everyone — no account required.',
  'pages.events.eyebrow': 'Room For You',
  'pages.events.title': 'Events',
  'pages.events.subtitle': 'Monthly physical meetings across cities. Come as you are.',
  'pages.gallery.eyebrow': 'Room For You',
  'pages.gallery.title': 'Moments.',
  'pages.gallery.subtitle':
    'A record of what God has done in our gatherings. Real people. Real community.',
  'pages.blog.eyebrow': 'Room For You',
  'pages.blog.title': 'Devotionals',
  'pages.blog.subtitle': '',
  'pages.testimonies.eyebrow': 'Testimonies',
  'pages.testimonies.title': 'What God\nhas done.',
  'pages.testimonies.subtitle':
    'Real stories from the Room For You community. God is moving — here is the evidence.',
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
