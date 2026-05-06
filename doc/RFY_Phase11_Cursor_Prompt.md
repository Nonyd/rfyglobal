# ROOM FOR YOU — Phase 11 Cursor Prompt
## Demo Data — Seed Script + Admin One-Click Button

---

## CONTEXT

Phase 11 adds comprehensive demo data across every module of the platform so the site feels alive and complete when presented. Demo data loads two ways:

1. **Seed script** — `npx prisma db seed` (runs locally or in CI)
2. **Admin one-click button** — `/admin/demo` page with a "Load Demo Data" button that calls an API route

Demo data covers:
- 10 daily scriptures (scheduled + random pool)
- 5 published blog devotionals
- 2 study series with materials and tasks
- 6 events across 3 Nigerian cities
- 20 gallery images (using Unsplash placeholder URLs)
- 1 join form with 15 sample registrations
- 8 giving records across payment gateways
- Site CMS content (all pages filled with real Room For You copy)

---

## TASK 1 — Update Prisma Seed File

Replace `prisma/seed.ts` entirely:

```typescript
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Room For You database...')

  // ── ADMIN USER ─────────────────────────────────────────────
  const email = process.env.ADMIN_EMAIL || 'admin@rfyglobal.org'
  const password = process.env.ADMIN_PASSWORD || 'Admin@RFY2026'

  const existingUser = await db.user.findUnique({ where: { email } })
  if (!existingUser) {
    const hashed = await bcrypt.hash(password, 12)
    await db.user.create({
      data: { email, password: hashed, name: 'Admin', role: 'ADMIN' },
    })
    console.log('✅ Admin user created:', email)
  } else {
    console.log('⏭️  Admin user already exists — skipping')
  }

  // ── SCRIPTURES ─────────────────────────────────────────────
  const existingScriptures = await db.scripture.count()
  if (existingScriptures === 0) {
    await db.scripture.createMany({
      data: [
        {
          reference: '2 Corinthians 5:17',
          text: 'Therefore, if anyone is in Christ, the new creation has come: The old has gone, the new is here!',
          translation: 'NIV',
          scheduledAt: new Date(),
          isActive: true,
        },
        {
          reference: 'Romans 8:1',
          text: 'Therefore, there is now no condemnation for those who are in Christ Jesus.',
          translation: 'NIV',
          isActive: true,
        },
        {
          reference: 'John 3:16',
          text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
          translation: 'NIV',
          isActive: true,
        },
        {
          reference: 'Philippians 4:13',
          text: 'I can do all this through him who gives me strength.',
          translation: 'NIV',
          isActive: true,
        },
        {
          reference: 'Jeremiah 29:11',
          text: 'For I know the plans I have for you, declares the LORD, plans to prosper you and not to harm you, plans to give you hope and a future.',
          translation: 'NIV',
          isActive: true,
        },
        {
          reference: 'Isaiah 41:10',
          text: 'So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand.',
          translation: 'NIV',
          isActive: true,
        },
        {
          reference: 'Psalm 23:1',
          text: 'The LORD is my shepherd, I lack nothing.',
          translation: 'NIV',
          isActive: true,
        },
        {
          reference: 'Romans 10:9',
          text: 'If you declare with your mouth, "Jesus is Lord," and believe in your heart that God raised him from the dead, you will be saved.',
          translation: 'NIV',
          isActive: true,
        },
        {
          reference: 'Ephesians 2:8-9',
          text: 'For it is by grace you have been saved, through faith — and this is not from yourselves, it is the gift of God — not by works, so that no one can boast.',
          translation: 'NIV',
          isActive: true,
        },
        {
          reference: '1 John 4:4',
          text: 'You, dear children, are from God and have overcome them, because the one who is in you is greater than the one who is in the world.',
          translation: 'NIV',
          isActive: true,
        },
      ],
    })
    console.log('✅ 10 scriptures created')
  } else {
    console.log('⏭️  Scriptures already exist — skipping')
  }

  // ── BLOG POSTS ─────────────────────────────────────────────
  const existingPosts = await db.post.count()
  if (existingPosts === 0) {
    const posts = [
      {
        title: 'You Are Not Your Past',
        slug: 'you-are-not-your-past',
        excerpt: 'The grace of God is not a license to sin — it is a power to live differently. You are a new creation.',
        content: `<p>One of the greatest lies the enemy tells us is that our past defines us. That the things we've done, the places we've been, the people we've hurt — those things are who we are.</p><p>But the Word of God says something entirely different.</p><blockquote>"Therefore, if anyone is in Christ, the new creation has come: The old has gone, the new is here!" — 2 Corinthians 5:17</blockquote><p>When you gave your life to Jesus, you didn't just get a fresh start. You got a new identity. A new nature. A new standing before God.</p><p>The old has gone. This means the old man — the one who was bound by sin, driven by flesh, separated from God — that man is dead. He doesn't get a vote anymore.</p><p>The new is here. The new creation is not a better version of the old you. It is an entirely new being, created in the image of Christ, filled with the Holy Spirit, and positioned in the righteousness of God.</p><p>This week, I want to challenge you: Stop rehearsing your past to yourself. Stop using it as the lens through which you see your future. You are in Christ. And in Christ, you are new.</p>`,
        isPublished: true,
        publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        coverImage: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=900&h=450&fit=crop',
      },
      {
        title: 'The Power of Singing Songs of Salvation',
        slug: 'power-of-singing-songs-of-salvation',
        excerpt: 'Worship is not a warm-up to the message. Worship is the message. When we sing, we declare.',
        content: `<p>There is something that happens in the spirit when the people of God open their mouths and sing.</p><p>It is not just music. It is not just emotion. It is declaration. It is war. It is intimacy with the Father.</p><p>When we sing songs of salvation — songs about the blood of Jesus, songs about grace and redemption — we are not just expressing what we feel. We are announcing what is true.</p><p>The enemy hates it when the church sings. Because when we sing, we remember who we are. We remember whose we are. We remember what has been done for us.</p><p>Room For You was built on this conviction: that a community that sings together is a community that stays together. That the songs we sing shape the theology we carry. That worship is not something we do before the "real" thing — worship IS the real thing.</p><p>So sing. Sing loudly. Sing in the car, in the shower, in the kitchen. Let your life be a song that declares the goodness of God.</p>`,
        isPublished: true,
        publishedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        coverImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=900&h=450&fit=crop',
      },
      {
        title: 'Why Bible Study Changes Everything',
        slug: 'why-bible-study-changes-everything',
        excerpt: 'The Word of God is not information to be accumulated. It is a person to be encountered.',
        content: `<p>Many of us grew up treating the Bible like a textbook. We read it to pass a test, to know the right answers, to appear knowledgeable in Sunday school.</p><p>But the Bible is not a textbook. It is a love letter. It is a living document. It is the breath of God breathed into ink and paper.</p><p>Hebrews 4:12 says: "For the word of God is alive and active. Sharper than any double-edged sword, it penetrates even to dividing soul and spirit, joints and marrow; it judges the thoughts and attitudes of the heart."</p><p>When you study the Word consistently — not just reading verses in passing, but sitting with the text, asking questions, letting it read you — something happens inside you.</p><p>Your thinking changes. Your desires change. Your responses change. The things that used to pull you no longer have the same grip. The fears that used to paralyze you begin to lose their power.</p><p>This is why in Room For You, Bible study is not optional. It is central. Because we believe a community that knows the Word is a community that can withstand anything.</p>`,
        isPublished: true,
        publishedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
        coverImage: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=900&h=450&fit=crop',
      },
      {
        title: 'Getting Others Saved — It Is Your Assignment',
        slug: 'getting-others-saved-your-assignment',
        excerpt: 'Evangelism is not a gift for a few. It is a commission for all. You were saved to save others.',
        content: `<p>2 Corinthians 5:18-19 says: "All this is from God, who reconciled us to himself through Christ and gave us the ministry of reconciliation: that God was reconciling the world to himself in Christ, not counting people's sins against them. And he has committed to us the message of reconciliation."</p><p>Did you catch that? He committed to US the message of reconciliation. Not to angels. Not to a special class of anointed ministers. To us.</p><p>You are a minister of reconciliation. That means every believer in Room For You is carrying a message that the world needs. A message that saves lives. A message that breaks chains. A message that restores families.</p><p>We are not just a community that gathers for ourselves. We gather so that we can be sent. We study so that we can speak. We pray so that we have power to go.</p><p>Jesus to Nations is not just a motto. It is a mandate. And it starts with the person next to you — your neighbor, your colleague, your family member who doesn't yet know that there is room for them too.</p>`,
        isPublished: true,
        publishedAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
        coverImage: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=900&h=450&fit=crop',
      },
      {
        title: 'Prayer Is Not a Last Resort',
        slug: 'prayer-is-not-a-last-resort',
        excerpt: 'We pray when we have no other options. But God designed prayer to be our first option, not our last.',
        content: `<p>How many times have you heard someone say — or said yourself — "All we can do now is pray"?</p><p>As if prayer is the thing you turn to when everything else has failed. As if prayer is plan B.</p><p>But prayer is not a last resort. Prayer is a first response. Prayer is not what you do when you run out of options. Prayer is what you do before you even consider the options.</p><p>Philippians 4:6 says: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God."</p><p>Every situation. Not some situations. Not the big ones that you can't handle. Every single one.</p><p>In Room For You, we believe that a community of prayer is a community of power. That when we come together and lift our voices before God — not with polished words but with honest hearts — things shift in the spirit.</p><p>So pray. Pray in the morning. Pray at night. Pray in the middle of the meeting when things get tense. Pray for the people in your life who don't yet know God. Pray for Nigeria. Pray for the nations. Pray.</p>`,
        isPublished: true,
        publishedAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
        coverImage: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=900&h=450&fit=crop',
      },
    ]

    for (const post of posts) {
      await db.post.create({ data: post })
    }
    console.log('✅ 5 blog posts created')
  } else {
    console.log('⏭️  Blog posts already exist — skipping')
  }

  // ── STUDY SERIES ───────────────────────────────────────────
  const existingSeries = await db.studySeries.count()
  if (existingSeries === 0) {
    const series1 = await db.studySeries.create({
      data: {
        title: 'Identity in Christ',
        description: 'A foundational series on who you are in Christ. Understanding your new nature, your standing before God, and the implications for how you live.',
        order: 0,
      },
    })

    await db.studyTask.createMany({
      data: [
        {
          seriesId: series1.id,
          title: 'Read 2 Corinthians 5:14-21 every day this week',
          description: 'Read it in at least two different translations. Write down what stands out to you each day.',
          order: 0,
        },
        {
          seriesId: series1.id,
          title: 'Write your personal confession',
          description: 'Based on what you have learned about your identity in Christ, write a personal confession of at least 10 statements starting with "I am..."',
          order: 1,
        },
        {
          seriesId: series1.id,
          title: 'Share the Gospel with one person this week',
          description: 'As a new creation, you carry the ministry of reconciliation. Share what Christ has done for you with someone in your life.',
          order: 2,
        },
      ],
    })

    const series2 = await db.studySeries.create({
      data: {
        title: 'The Discipline of Prayer',
        description: 'A practical series on building a consistent, powerful prayer life. Moving from religious duty to genuine conversation with God.',
        order: 1,
      },
    })

    await db.studyTask.createMany({
      data: [
        {
          seriesId: series2.id,
          title: 'Pray for 15 minutes every morning for 7 days',
          description: 'Use the ACTS model: Adoration, Confession, Thanksgiving, Supplication. Journal what happens.',
          order: 0,
        },
        {
          seriesId: series2.id,
          title: 'Create a prayer list',
          description: 'Write down 5 people who do not know Christ and begin praying for them by name every day.',
          order: 1,
        },
        {
          seriesId: series2.id,
          title: 'Memorize Philippians 4:6-7',
          description: 'Commit these verses to memory. Use them as a prayer anchor throughout the week.',
          order: 2,
        },
      ],
    })

    console.log('✅ 2 study series with tasks created')
  } else {
    console.log('⏭️  Study series already exist — skipping')
  }

  // ── EVENTS ─────────────────────────────────────────────────
  const existingEvents = await db.event.count()
  if (existingEvents === 0) {
    await db.event.createMany({
      data: [
        {
          title: 'Room For You — Abuja Monthly Gathering',
          description: 'Our monthly community gathering in Abuja. Come ready to worship, pray, study the Word, and connect with other believers. There is room for you.',
          city: 'Abuja',
          venue: 'The Civic Centre, Maitama',
          date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          time: '4:00 PM',
          isActive: true,
          imageUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=400&fit=crop',
        },
        {
          title: 'Room For You — Lagos Monthly Gathering',
          description: 'The Lagos community comes together for worship, the Word, and fellowship. If you are in Lagos, this is your room.',
          city: 'Lagos',
          venue: 'The Landmark Event Centre, Victoria Island',
          date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
          time: '5:00 PM',
          isActive: true,
          imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop',
        },
        {
          title: 'Room For You — Port Harcourt Gathering',
          description: 'Port Harcourt, there is room for you too. Join us for our monthly gathering — worship, prayer, and the Word.',
          city: 'Port Harcourt',
          venue: 'Hotel Presidential, GRA',
          date: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
          time: '4:30 PM',
          isActive: true,
          imageUrl: 'https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=800&h=400&fit=crop',
        },
        {
          title: 'Room For You — Online Prayer Night',
          description: 'Join us online for a corporate prayer night. All locations, one voice. We carry each other\'s burdens before the throne.',
          city: 'Online',
          venue: 'Zoom — link sent to registered members',
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          time: '9:00 PM',
          isActive: true,
        },
        {
          title: 'Room For You — Abuja Outreach',
          description: 'Foot evangelism in the streets of Abuja. We take the Gospel to the people. Come ready to share your faith.',
          city: 'Abuja',
          venue: 'Wuse Market Area',
          date: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000),
          time: '10:00 AM',
          isActive: true,
        },
        {
          title: 'Room For You — Lagos Bible Study Marathon',
          description: 'A full-day Bible study event in Lagos. Bring your Bible, your notebook, and your hunger for the Word.',
          city: 'Lagos',
          venue: 'Eko Hotel & Suites, Victoria Island',
          date: new Date(Date.now() + 56 * 24 * 60 * 60 * 1000),
          time: '10:00 AM',
          isActive: true,
          imageUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=400&fit=crop',
        },
      ],
    })
    console.log('✅ 6 events created')
  } else {
    console.log('⏭️  Events already exist — skipping')
  }

  // ── GALLERY IMAGES ─────────────────────────────────────────
  const existingGallery = await db.galleryImage.count()
  if (existingGallery === 0) {
    await db.galleryImage.createMany({
      data: [
        { url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800', eventName: 'Abuja Monthly Gathering', city: 'Abuja', takenAt: new Date('2025-03-15'), isActive: true, order: 0 },
        { url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800', eventName: 'Lagos Gathering', city: 'Lagos', takenAt: new Date('2025-03-08'), isActive: true, order: 1 },
        { url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800', eventName: 'Abuja Monthly Gathering', city: 'Abuja', takenAt: new Date('2025-02-15'), isActive: true, order: 2 },
        { url: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=800', eventName: 'Prayer Night', city: 'Online', takenAt: new Date('2025-02-10'), isActive: true, order: 3 },
        { url: 'https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=800', eventName: 'Port Harcourt Gathering', city: 'Port Harcourt', takenAt: new Date('2025-01-25'), isActive: true, order: 4 },
        { url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800', eventName: 'Lagos Gathering', city: 'Lagos', takenAt: new Date('2025-01-18'), isActive: true, order: 5 },
        { url: 'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?w=800', eventName: 'Abuja Outreach', city: 'Abuja', takenAt: new Date('2025-01-11'), isActive: true, order: 6 },
        { url: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800', eventName: 'Port Harcourt Gathering', city: 'Port Harcourt', takenAt: new Date('2024-12-21'), isActive: true, order: 7 },
        { url: 'https://images.unsplash.com/photo-1516997121675-4c2d1684aa3e?w=800', eventName: 'Abuja Monthly Gathering', city: 'Abuja', takenAt: new Date('2024-12-14'), isActive: true, order: 8 },
        { url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800', eventName: 'Lagos Bible Study', city: 'Lagos', takenAt: new Date('2024-11-30'), isActive: true, order: 9 },
        { url: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=800', eventName: 'Worship Night', city: 'Abuja', takenAt: new Date('2024-11-16'), isActive: true, order: 10 },
        { url: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800', eventName: 'Lagos Gathering', city: 'Lagos', takenAt: new Date('2024-11-09'), isActive: true, order: 11 },
        { url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800', eventName: 'Bible Study Marathon', city: 'Abuja', takenAt: new Date('2024-10-26'), isActive: true, order: 12 },
        { url: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800', eventName: 'Port Harcourt Outreach', city: 'Port Harcourt', takenAt: new Date('2024-10-19'), isActive: true, order: 13 },
        { url: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=800', eventName: 'Abuja Monthly Gathering', city: 'Abuja', takenAt: new Date('2024-10-12'), isActive: true, order: 14 },
        { url: 'https://images.unsplash.com/photo-1445633743309-b60418bedbf2?w=800', eventName: 'Lagos Prayer Night', city: 'Lagos', takenAt: new Date('2024-09-28'), isActive: true, order: 15 },
        { url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800', eventName: 'Youth Outreach', city: 'Abuja', takenAt: new Date('2024-09-14'), isActive: true, order: 16 },
        { url: 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=800', eventName: 'Study Session', city: 'Lagos', takenAt: new Date('2024-08-31'), isActive: true, order: 17 },
        { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800', eventName: 'Port Harcourt Gathering', city: 'Port Harcourt', takenAt: new Date('2024-08-17'), isActive: true, order: 18 },
        { url: 'https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?w=800', eventName: 'Abuja Founding Gathering', city: 'Abuja', takenAt: new Date('2024-08-03'), isActive: true, order: 19 },
      ],
    })
    console.log('✅ 20 gallery images created')
  } else {
    console.log('⏭️  Gallery images already exist — skipping')
  }

  // ── JOIN FORM + SUBMISSIONS ─────────────────────────────────
  const existingJoinForm = await db.form.findUnique({ where: { slug: 'join-room-for-you' } })

  let joinForm = existingJoinForm
  if (!joinForm) {
    joinForm = await db.form.create({
      data: {
        title: 'Join Room For You',
        description: 'We are glad you want to be part of the Room For You community. Fill in your details below and we will be in touch.',
        slug: 'join-room-for-you',
        isActive: true,
        notifyEmail: 'admin@rfyglobal.org',
        fields: {
          create: [
            { label: 'Full Name', type: 'SHORT_TEXT', placeholder: 'Your full name', required: true, order: 0 },
            { label: 'Phone Number', type: 'PHONE', placeholder: '+234...', required: true, order: 1 },
            { label: 'Email Address', type: 'EMAIL', placeholder: 'your@email.com', required: true, order: 2 },
            { label: 'Location (City)', type: 'LOCATION', placeholder: 'e.g. Abuja, Nigeria', required: true, order: 3 },
            { label: 'What are your expectations from Room For You?', type: 'LONG_TEXT', placeholder: 'Share what you are hoping to experience...', required: false, order: 4 },
          ],
        },
      },
      include: { fields: true },
    })
    console.log('✅ Join form created')
  }

  // Sample registrations
  const existingSubmissions = await db.formSubmission.count({ where: { formId: joinForm.id } })
  if (existingSubmissions === 0) {
    const fields = await db.formField.findMany({ where: { formId: joinForm.id } })
    const nameField = fields.find(f => f.label === 'Full Name')
    const phoneField = fields.find(f => f.label === 'Phone Number')
    const emailField = fields.find(f => f.label === 'Email Address')
    const locationField = fields.find(f => f.label === 'Location (City)')
    const expectField = fields.find(f => f.label === 'What are your expectations from Room For You?')

    const members = [
      { name: 'Chioma Okafor', phone: '+2348012345678', email: 'chioma@email.com', location: 'Abuja, Nigeria', expectation: 'I want to grow in my faith and connect with other believers who are serious about the Word.' },
      { name: 'Emmanuel Adeyemi', phone: '+2348023456789', email: 'emma@email.com', location: 'Lagos, Nigeria', expectation: 'I am looking for a community where I can be mentored and also mentor others.' },
      { name: 'Blessing Nwosu', phone: '+2348034567890', email: 'blessing@email.com', location: 'Port Harcourt, Nigeria', expectation: 'I want to be part of something bigger than myself — a movement for Jesus.' },
      { name: 'David Fashola', phone: '+2348045678901', email: 'david@email.com', location: 'Abuja, Nigeria', expectation: 'Deep Bible study and real fellowship.' },
      { name: 'Grace Eze', phone: '+2348056789012', email: 'grace@email.com', location: 'Lagos, Nigeria', expectation: 'I want to learn how to share my faith effectively.' },
      { name: 'Samuel Idowu', phone: '+2348067890123', email: 'samuel@email.com', location: 'Ibadan, Nigeria', expectation: 'Community, accountability, and growth in the Word.' },
      { name: 'Favour Okeke', phone: '+2348078901234', email: 'favour@email.com', location: 'Abuja, Nigeria', expectation: 'I heard about Room For You from a friend and I want to see what God is doing here.' },
      { name: 'Joshua Adeleke', phone: '+2348089012345', email: 'joshua@email.com', location: 'Lagos, Nigeria', expectation: 'Mentorship and a praying community.' },
      { name: 'Miracle Chukwu', phone: '+2348090123456', email: 'miracle@email.com', location: 'Enugu, Nigeria', expectation: 'I want to be equipped to reach my generation for Christ.' },
      { name: 'Ruth Okonkwo', phone: '+2348001234567', email: 'ruth@email.com', location: 'Port Harcourt, Nigeria', expectation: 'I am new in the faith and I need a community to help me grow.' },
      { name: 'Daniel Afolabi', phone: '+2348012345679', email: 'daniel.a@email.com', location: 'Abuja, Nigeria', expectation: 'I want to be part of the outreach and evangelism efforts.' },
      { name: 'Peace Ugwu', phone: '+2348023456780', email: 'peace@email.com', location: 'Lagos, Nigeria', expectation: 'Worship, prayer, and genuine community.' },
      { name: 'Isaac Balogun', phone: '+2348034567891', email: 'isaac@email.com', location: 'Abuja, Nigeria', expectation: 'I want accountability and to be challenged to grow spiritually.' },
      { name: 'Esther Musa', phone: '+2348045678902', email: 'esther@email.com', location: 'Kano, Nigeria', expectation: 'I want to find my purpose and identity in Christ.' },
      { name: 'Philip Osei', phone: '+2348056789013', email: 'philip@email.com', location: 'Lagos, Nigeria', expectation: 'I want to learn to pray effectively and study the Bible deeply.' },
    ]

    for (let i = 0; i < members.length; i++) {
      const m = members[i]
      const submission = await db.formSubmission.create({
        data: {
          formId: joinForm.id,
          createdAt: new Date(Date.now() - (members.length - i) * 2 * 24 * 60 * 60 * 1000),
        },
      })

      const values = []
      if (nameField) values.push({ submissionId: submission.id, fieldId: nameField.id, fieldLabel: 'Full Name', value: m.name })
      if (phoneField) values.push({ submissionId: submission.id, fieldId: phoneField.id, fieldLabel: 'Phone Number', value: m.phone })
      if (emailField) values.push({ submissionId: submission.id, fieldId: emailField.id, fieldLabel: 'Email Address', value: m.email })
      if (locationField) values.push({ submissionId: submission.id, fieldId: locationField.id, fieldLabel: 'Location (City)', value: m.location })
      if (expectField) values.push({ submissionId: submission.id, fieldId: expectField.id, fieldLabel: 'What are your expectations from Room For You?', value: m.expectation })

      await db.formSubmissionValue.createMany({ data: values })
    }
    console.log('✅ 15 join form submissions created')
  } else {
    console.log('⏭️  Join form submissions already exist — skipping')
  }

  // ── GIVING RECORDS ─────────────────────────────────────────
  const existingGifts = await db.givingRecord.count()
  if (existingGifts === 0) {
    await db.givingRecord.createMany({
      data: [
        { donorName: 'Chioma Okafor', donorEmail: 'chioma@email.com', amount: 10000, currency: 'NGN', gateway: 'PAYSTACK', reference: 'PSK-DEMO-001', status: 'SUCCESS', meta: { frequency: 'ONE_TIME' }, createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
        { donorName: 'Emmanuel Adeyemi', donorEmail: 'emma@email.com', amount: 5000, currency: 'NGN', gateway: 'FLUTTERWAVE', reference: 'FLW-DEMO-002', status: 'SUCCESS', meta: { frequency: 'MONTHLY' }, createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
        { donorName: 'David Fashola', donorEmail: 'david@email.com', amount: 25000, currency: 'NGN', gateway: 'PAYSTACK', reference: 'PSK-DEMO-003', status: 'SUCCESS', meta: { frequency: 'MONTHLY' }, createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) },
        { donorName: 'Grace Eze', donorEmail: 'grace@email.com', amount: 2500, currency: 'NGN', gateway: 'PAYAZA', reference: 'PAZ-DEMO-004', status: 'SUCCESS', meta: { frequency: 'ONE_TIME' }, createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000) },
        { donorName: 'Anonymous', donorEmail: null, amount: 50000, currency: 'NGN', gateway: 'PAYSTACK', reference: 'PSK-DEMO-005', status: 'SUCCESS', meta: { frequency: 'ONE_TIME' }, createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) },
        { donorName: 'Samuel Idowu', donorEmail: 'samuel@email.com', amount: 10000, currency: 'NGN', gateway: 'FLUTTERWAVE', reference: 'FLW-DEMO-006', status: 'SUCCESS', meta: { frequency: 'ANNUAL' }, createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) },
        { donorName: 'Ruth Okonkwo', donorEmail: 'ruth@email.com', amount: 1000, currency: 'NGN', gateway: 'PAYSTACK', reference: 'PSK-DEMO-007', status: 'SUCCESS', meta: { frequency: 'ONE_TIME' }, createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000) },
        { donorName: 'Philip Osei', donorEmail: 'philip@email.com', amount: 5000, currency: 'NGN', gateway: 'PAYSTACK', reference: 'PSK-DEMO-008', status: 'PENDING', meta: { frequency: 'ONE_TIME' }, createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
      ],
    })
    console.log('✅ 8 giving records created')
  } else {
    console.log('⏭️  Giving records already exist — skipping')
  }

  // ── SITE CMS CONTENT ───────────────────────────────────────
  const existingCMS = await db.siteContent.count()
  if (existingCMS === 0) {
    await db.siteContent.createMany({
      data: [
        { key: 'landing.hero.eyebrow', value: 'Worship · Prayer · Study · Community', type: 'TEXT' },
        { key: 'landing.vision.heading', value: 'Building a community', type: 'TEXT' },
        { key: 'landing.vision.subheading', value: 'Jesus to Nations', type: 'TEXT' },
        { key: 'landing.vision.text', value: 'Building a community of young men and women who sing songs of salvation with conviction of their identity in Christ, study the Bible, pray and get others saved.', type: 'TEXT' },
        { key: 'landing.cta.headline', value: 'The door is open.', type: 'TEXT' },
        { key: 'landing.cta.subtext', value: 'Step in. There is room for you.', type: 'TEXT' },
        { key: 'landing.cta.button', value: 'Join the Community', type: 'TEXT' },
        { key: 'shepherd.quote', value: 'Room For You was born out of a deep conviction — that every young person deserves a community where they are not just known, but called into purpose. This is not just a ministry. It is a family. And there is room for you here.', type: 'TEXT' },
        { key: 'shepherd.name', value: 'Minister Yadah', type: 'TEXT' },
        { key: 'shepherd.title', value: 'Founder · Room For You', type: 'TEXT' },
        { key: 'shepherd.link', value: 'https://yadahworld.com', type: 'TEXT' },
        { key: 'highlights.1.title', value: 'Monthly Meetings', type: 'TEXT' },
        { key: 'highlights.1.desc', value: 'Physical gatherings across cities where the Word comes alive and community is built.', type: 'TEXT' },
        { key: 'highlights.2.title', value: 'Prayer', type: 'TEXT' },
        { key: 'highlights.2.desc', value: 'Corporate and personal prayer — we carry one another\'s burdens before the throne.', type: 'TEXT' },
        { key: 'highlights.3.title', value: 'Bible Study', type: 'TEXT' },
        { key: 'highlights.3.desc', value: 'Deep, consistent study of the Word with structured tasks and materials.', type: 'TEXT' },
        { key: 'highlights.4.title', value: 'Mentorship', type: 'TEXT' },
        { key: 'highlights.4.desc', value: 'One-on-one counseling and spiritual mentorship for growth and accountability.', type: 'TEXT' },
        { key: 'about.hero.headline1', value: 'More Than a Ministry.', type: 'TEXT' },
        { key: 'about.hero.headline2', value: 'A Family.', type: 'TEXT' },
        { key: 'about.yadah.bio', value: 'I started Room For You because I believe every young person deserves a community where they are not just known, but called into purpose. A place where the Word of God is not just preached but lived. Where prayer is not a ritual but a lifestyle. Where you are not alone in your faith — you are surrounded by people who are running the same race.\n\nThis is that community. And there is room for you here.', type: 'TEXT' },
        { key: 'about.yadah.musicLink', value: 'https://yadahworld.com/music', type: 'TEXT' },
        { key: 'partnership.hero.headline', value: 'Fuel the Mission', type: 'TEXT' },
        { key: 'partnership.hero.subtext', value: 'Every gift you sow into Room For You is a seed planted in the Kingdom. You are not just giving money — you are sending the Gospel to nations.', type: 'TEXT' },
        { key: 'partnership.bank.bankName', value: 'Access Bank', type: 'TEXT' },
        { key: 'partnership.bank.accountName', value: 'Room For You', type: 'TEXT' },
        { key: 'partnership.bank.accountNumber', value: '0123456789', type: 'TEXT' },
        { key: 'partnership.bank.contactEmail', value: 'partner@rfyglobal.org', type: 'TEXT' },
        { key: 'footer.tagline', value: 'Jesus to Nations — 2 Cor 5:17-21', type: 'TEXT' },
        { key: 'footer.copyright', value: '© 2026 Room For You · rfyglobal.org · A SonsHub Media Initiative.', type: 'TEXT' },
      ],
    })
    console.log('✅ Site CMS content seeded')
  } else {
    console.log('⏭️  CMS content already exists — skipping')
  }

  console.log('\n🎉 Seeding complete! Room For You database is ready.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
```

---

## TASK 2 — Demo Data API Route

Create `src/app/api/admin/demo/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const results: string[] = []

  try {
    // Scriptures
    const scriptureCount = await db.scripture.count()
    if (scriptureCount === 0) {
      await db.scripture.createMany({
        data: [
          { reference: '2 Corinthians 5:17', text: 'Therefore, if anyone is in Christ, the new creation has come: The old has gone, the new is here!', translation: 'NIV', scheduledAt: new Date(), isActive: true },
          { reference: 'Romans 8:1', text: 'Therefore, there is now no condemnation for those who are in Christ Jesus.', translation: 'NIV', isActive: true },
          { reference: 'John 3:16', text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.', translation: 'NIV', isActive: true },
          { reference: 'Philippians 4:13', text: 'I can do all this through him who gives me strength.', translation: 'NIV', isActive: true },
          { reference: 'Jeremiah 29:11', text: 'For I know the plans I have for you, declares the LORD, plans to prosper you and not to harm you, plans to give you hope and a future.', translation: 'NIV', isActive: true },
          { reference: 'Isaiah 41:10', text: 'So do not fear, for I am with you; do not be dismayed, for I am your God.', translation: 'NIV', isActive: true },
          { reference: 'Psalm 23:1', text: 'The LORD is my shepherd, I lack nothing.', translation: 'NIV', isActive: true },
          { reference: 'Romans 10:9', text: 'If you declare with your mouth, "Jesus is Lord," and believe in your heart that God raised him from the dead, you will be saved.', translation: 'NIV', isActive: true },
          { reference: 'Ephesians 2:8-9', text: 'For it is by grace you have been saved, through faith — and this is not from yourselves, it is the gift of God.', translation: 'NIV', isActive: true },
          { reference: '1 John 4:4', text: 'You, dear children, are from God and have overcome them, because the one who is in you is greater than the one who is in the world.', translation: 'NIV', isActive: true },
        ],
      })
      results.push('✅ 10 scriptures created')
    } else {
      results.push('⏭️ Scriptures already exist')
    }

    // Blog posts
    const postCount = await db.post.count()
    if (postCount === 0) {
      await db.post.createMany({
        data: [
          { title: 'You Are Not Your Past', slug: 'you-are-not-your-past', excerpt: 'The grace of God is not a license to sin — it is a power to live differently.', content: '<p>One of the greatest lies the enemy tells us is that our past defines us...</p>', isPublished: true, publishedAt: new Date(Date.now() - 7 * 86400000), coverImage: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=900&h=450&fit=crop' },
          { title: 'The Power of Singing Songs of Salvation', slug: 'power-of-singing-songs-of-salvation', excerpt: 'Worship is not a warm-up to the message. Worship is the message.', content: '<p>There is something that happens in the spirit when the people of God open their mouths and sing...</p>', isPublished: true, publishedAt: new Date(Date.now() - 14 * 86400000), coverImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=900&h=450&fit=crop' },
          { title: 'Why Bible Study Changes Everything', slug: 'why-bible-study-changes-everything', excerpt: 'The Word of God is not information to be accumulated. It is a person to be encountered.', content: '<p>Many of us grew up treating the Bible like a textbook...</p>', isPublished: true, publishedAt: new Date(Date.now() - 21 * 86400000), coverImage: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=900&h=450&fit=crop' },
          { title: 'Getting Others Saved — It Is Your Assignment', slug: 'getting-others-saved-your-assignment', excerpt: 'Evangelism is not a gift for a few. It is a commission for all.', content: '<p>2 Corinthians 5:18-19 says: All this is from God, who reconciled us to himself through Christ...</p>', isPublished: true, publishedAt: new Date(Date.now() - 28 * 86400000), coverImage: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=900&h=450&fit=crop' },
          { title: 'Prayer Is Not a Last Resort', slug: 'prayer-is-not-a-last-resort', excerpt: 'We pray when we have no other options. But God designed prayer to be our first option.', content: '<p>How many times have you heard someone say — All we can do now is pray?...</p>', isPublished: true, publishedAt: new Date(Date.now() - 35 * 86400000), coverImage: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=900&h=450&fit=crop' },
        ],
      })
      results.push('✅ 5 blog posts created')
    } else {
      results.push('⏭️ Blog posts already exist')
    }

    // Events
    const eventCount = await db.event.count()
    if (eventCount === 0) {
      await db.event.createMany({
        data: [
          { title: 'Room For You — Abuja Monthly Gathering', description: 'Our monthly community gathering in Abuja.', city: 'Abuja', venue: 'The Civic Centre, Maitama', date: new Date(Date.now() + 14 * 86400000), time: '4:00 PM', isActive: true, imageUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=400&fit=crop' },
          { title: 'Room For You — Lagos Monthly Gathering', description: 'The Lagos community comes together for worship, the Word, and fellowship.', city: 'Lagos', venue: 'The Landmark Event Centre, Victoria Island', date: new Date(Date.now() + 21 * 86400000), time: '5:00 PM', isActive: true, imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop' },
          { title: 'Room For You — Port Harcourt Gathering', description: 'Port Harcourt, there is room for you too.', city: 'Port Harcourt', venue: 'Hotel Presidential, GRA', date: new Date(Date.now() + 28 * 86400000), time: '4:30 PM', isActive: true },
          { title: 'Online Prayer Night', description: 'Join us online for a corporate prayer night.', city: 'Online', venue: 'Zoom — link sent to registered members', date: new Date(Date.now() + 7 * 86400000), time: '9:00 PM', isActive: true },
          { title: 'Abuja Outreach', description: 'Foot evangelism in the streets of Abuja.', city: 'Abuja', venue: 'Wuse Market Area', date: new Date(Date.now() + 42 * 86400000), time: '10:00 AM', isActive: true },
          { title: 'Lagos Bible Study Marathon', description: 'A full-day Bible study event in Lagos.', city: 'Lagos', venue: 'Eko Hotel & Suites, Victoria Island', date: new Date(Date.now() + 56 * 86400000), time: '10:00 AM', isActive: true },
        ],
      })
      results.push('✅ 6 events created')
    } else {
      results.push('⏭️ Events already exist')
    }

    // Gallery
    const galleryCount = await db.galleryImage.count()
    if (galleryCount === 0) {
      await db.galleryImage.createMany({
        data: [
          { url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800', eventName: 'Abuja Monthly Gathering', city: 'Abuja', takenAt: new Date('2025-03-15'), isActive: true, order: 0 },
          { url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800', eventName: 'Lagos Gathering', city: 'Lagos', takenAt: new Date('2025-03-08'), isActive: true, order: 1 },
          { url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800', eventName: 'Abuja Monthly Gathering', city: 'Abuja', takenAt: new Date('2025-02-15'), isActive: true, order: 2 },
          { url: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=800', eventName: 'Prayer Night', city: 'Online', takenAt: new Date('2025-02-10'), isActive: true, order: 3 },
          { url: 'https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=800', eventName: 'Port Harcourt Gathering', city: 'Port Harcourt', takenAt: new Date('2025-01-25'), isActive: true, order: 4 },
          { url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800', eventName: 'Lagos Gathering', city: 'Lagos', takenAt: new Date('2025-01-18'), isActive: true, order: 5 },
          { url: 'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?w=800', eventName: 'Abuja Outreach', city: 'Abuja', takenAt: new Date('2025-01-11'), isActive: true, order: 6 },
          { url: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800', eventName: 'Port Harcourt Gathering', city: 'Port Harcourt', takenAt: new Date('2024-12-21'), isActive: true, order: 7 },
          { url: 'https://images.unsplash.com/photo-1516997121675-4c2d1684aa3e?w=800', eventName: 'Abuja Monthly Gathering', city: 'Abuja', takenAt: new Date('2024-12-14'), isActive: true, order: 8 },
          { url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800', eventName: 'Lagos Bible Study', city: 'Lagos', takenAt: new Date('2024-11-30'), isActive: true, order: 9 },
          { url: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=800', eventName: 'Worship Night', city: 'Abuja', takenAt: new Date('2024-11-16'), isActive: true, order: 10 },
          { url: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800', eventName: 'Lagos Gathering', city: 'Lagos', takenAt: new Date('2024-11-09'), isActive: true, order: 11 },
          { url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800', eventName: 'Bible Study Marathon', city: 'Abuja', takenAt: new Date('2024-10-26'), isActive: true, order: 12 },
          { url: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800', eventName: 'Port Harcourt Outreach', city: 'Port Harcourt', takenAt: new Date('2024-10-19'), isActive: true, order: 13 },
          { url: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=800', eventName: 'Abuja Monthly Gathering', city: 'Abuja', takenAt: new Date('2024-10-12'), isActive: true, order: 14 },
          { url: 'https://images.unsplash.com/photo-1445633743309-b60418bedbf2?w=800', eventName: 'Lagos Prayer Night', city: 'Lagos', takenAt: new Date('2024-09-28'), isActive: true, order: 15 },
          { url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800', eventName: 'Youth Outreach', city: 'Abuja', takenAt: new Date('2024-09-14'), isActive: true, order: 16 },
          { url: 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=800', eventName: 'Study Session', city: 'Lagos', takenAt: new Date('2024-08-31'), isActive: true, order: 17 },
          { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800', eventName: 'Port Harcourt Gathering', city: 'Port Harcourt', takenAt: new Date('2024-08-17'), isActive: true, order: 18 },
          { url: 'https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?w=800', eventName: 'Abuja Founding Gathering', city: 'Abuja', takenAt: new Date('2024-08-03'), isActive: true, order: 19 },
        ],
      })
      results.push('✅ 20 gallery images created')
    } else {
      results.push('⏭️ Gallery images already exist')
    }

    // Giving records
    const giftCount = await db.givingRecord.count()
    if (giftCount === 0) {
      await db.givingRecord.createMany({
        data: [
          { donorName: 'Chioma Okafor', donorEmail: 'chioma@email.com', amount: 10000, currency: 'NGN', gateway: 'PAYSTACK', reference: 'PSK-DEMO-001', status: 'SUCCESS', meta: { frequency: 'ONE_TIME' } },
          { donorName: 'Emmanuel Adeyemi', donorEmail: 'emma@email.com', amount: 5000, currency: 'NGN', gateway: 'FLUTTERWAVE', reference: 'FLW-DEMO-002', status: 'SUCCESS', meta: { frequency: 'MONTHLY' } },
          { donorName: 'David Fashola', donorEmail: 'david@email.com', amount: 25000, currency: 'NGN', gateway: 'PAYSTACK', reference: 'PSK-DEMO-003', status: 'SUCCESS', meta: { frequency: 'MONTHLY' } },
          { donorName: 'Grace Eze', donorEmail: 'grace@email.com', amount: 2500, currency: 'NGN', gateway: 'PAYAZA', reference: 'PAZ-DEMO-004', status: 'SUCCESS', meta: { frequency: 'ONE_TIME' } },
          { donorName: 'Anonymous', donorEmail: null, amount: 50000, currency: 'NGN', gateway: 'PAYSTACK', reference: 'PSK-DEMO-005', status: 'SUCCESS', meta: { frequency: 'ONE_TIME' } },
          { donorName: 'Samuel Idowu', donorEmail: 'samuel@email.com', amount: 10000, currency: 'NGN', gateway: 'FLUTTERWAVE', reference: 'FLW-DEMO-006', status: 'SUCCESS', meta: { frequency: 'ANNUAL' } },
          { donorName: 'Ruth Okonkwo', donorEmail: 'ruth@email.com', amount: 1000, currency: 'NGN', gateway: 'PAYSTACK', reference: 'PSK-DEMO-007', status: 'SUCCESS', meta: { frequency: 'ONE_TIME' } },
          { donorName: 'Philip Osei', donorEmail: 'philip@email.com', amount: 5000, currency: 'NGN', gateway: 'PAYSTACK', reference: 'PSK-DEMO-008', status: 'PENDING', meta: { frequency: 'ONE_TIME' } },
        ],
      })
      results.push('✅ 8 giving records created')
    } else {
      results.push('⏭️ Giving records already exist')
    }

    return NextResponse.json({ success: true, results })
  } catch (err: unknown) {
    console.error('[Demo seed error]', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Seed failed' },
      { status: 500 }
    )
  }
}
```

---

## TASK 3 — Admin Demo Page

Add Demo to admin sidebar. Open `src/components/admin/AdminSidebar.tsx` and add at the bottom of the SETTINGS group:

```typescript
{ label: 'Demo Data', href: '/admin/demo', icon: Database },
```

Import `Database` from `lucide-react`.

Create `src/app/admin/(dashboard)/demo/page.tsx`:

```typescript
import { DemoDataManager } from '@/components/admin/DemoDataManager'

export default function DemoPage() {
  return <DemoDataManager />
}
```

Create `src/components/admin/DemoDataManager.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { Database, CheckCircle, AlertCircle, Loader2, Trash2 } from 'lucide-react'

export function DemoDataManager() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const loadDemoData = async () => {
    if (!confirm('This will add demo data to your database. Existing data will not be overwritten. Continue?')) return

    setLoading(true)
    setError(null)
    setResults([])

    try {
      const res = await fetch('/api/admin/demo', { method: 'POST' })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error ?? 'Failed to load demo data')
      }

      setResults(data.results)
      setDone(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <h2 className="font-display text-2xl font-semibold" style={{ color: 'var(--admin-text)' }}>
          Demo Data
        </h2>
        <p className="font-body text-sm mt-1" style={{ color: 'var(--admin-text-muted)' }}>
          Load sample data across all modules to make the site feel alive
        </p>
      </div>

      {/* Info card */}
      <div className="p-6 border mb-8" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
        <div className="flex items-start gap-3 mb-6">
          <Database size={18} className="shrink-0 mt-0.5" style={{ color: 'var(--admin-gold)' }} />
          <div>
            <p className="font-body text-sm font-medium mb-1" style={{ color: 'var(--admin-text)' }}>
              What gets created
            </p>
            <p className="font-body text-xs leading-relaxed" style={{ color: 'var(--admin-text-muted)' }}>
              Existing data is never overwritten — demo data is only added if a module is empty.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {[
            '10 daily scriptures (KJV/NIV)',
            '5 published blog devotionals with full content',
            '2 study series with tasks',
            '6 upcoming events across Abuja, Lagos, Port Harcourt',
            '20 gallery images (Unsplash placeholders)',
            'Join form with 15 sample member registrations',
            '8 giving/partnership records',
            'Site CMS content for all pages',
          ].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full" style={{ background: 'var(--admin-gold)' }} />
              <p className="font-body text-sm" style={{ color: 'var(--admin-text-secondary)' }}>{item}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="p-5 border mb-6" style={{ background: 'var(--admin-sidebar)', borderColor: 'var(--admin-border)' }}>
          <div className="space-y-2">
            {results.map((r, i) => (
              <div key={i} className="flex items-center gap-2">
                {r.startsWith('✅') ? (
                  <CheckCircle size={14} className="text-green-600 shrink-0" />
                ) : (
                  <div className="w-3.5 h-3.5 shrink-0" />
                )}
                <p className="font-body text-sm" style={{ color: 'var(--admin-text-secondary)' }}>
                  {r.replace('✅ ', '').replace('⏭️ ', '')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 border border-red-200 bg-red-50 mb-6">
          <AlertCircle size={16} className="text-red-600 shrink-0" />
          <p className="font-body text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Action button */}
      {!done ? (
        <button
          onClick={loadDemoData}
          disabled={loading}
          className="flex items-center gap-3 px-6 py-3 font-body text-sm font-medium text-white transition-all disabled:opacity-50"
          style={{ background: loading ? 'var(--admin-text-muted)' : 'var(--admin-gold)' }}
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Loading demo data…
            </>
          ) : (
            <>
              <Database size={16} />
              Load Demo Data
            </>
          )}
        </button>
      ) : (
        <div className="flex items-center gap-3 p-4 border border-green-200 bg-green-50">
          <CheckCircle size={16} className="text-green-600 shrink-0" />
          <p className="font-body text-sm text-green-700 font-medium">
            Demo data loaded successfully. Your site is now populated and ready to present.
          </p>
        </div>
      )}

      {/* Warning */}
      <p className="font-body text-xs mt-6" style={{ color: 'var(--admin-text-muted)' }}>
        Note: Gallery images use Unsplash placeholder URLs. Replace them with real Room For You event photos via the Gallery module when available.
      </p>
    </div>
  )
}
```

---

## PHASE 11 COMPLETION CHECKLIST

- [ ] `prisma/seed.ts` updated with all demo data
- [ ] `npx prisma db seed` runs successfully and prints all ✅ messages
- [ ] `src/app/api/admin/demo/route.ts` created
- [ ] `src/components/admin/DemoDataManager.tsx` created
- [ ] `src/app/admin/(dashboard)/demo/page.tsx` created
- [ ] "Demo Data" item added to admin sidebar
- [ ] `/admin/demo` page loads and shows the module list
- [ ] Clicking "Load Demo Data" calls the API and shows results
- [ ] After loading — `/word` shows today's scripture
- [ ] After loading — `/blog` shows 5 posts
- [ ] After loading — `/events` shows upcoming events
- [ ] After loading — `/gallery` shows masonry grid with 20 images
- [ ] After loading — admin dashboard home shows populated stat cards
- [ ] `npm run build` passes

---

## NOTES FOR CURSOR

- The seed script and API route share the same data — they are intentionally duplicated so both methods work independently. Do not try to consolidate them into a shared file — the seed script runs in a Node process while the API route runs in Next.js runtime.
- All demo data checks for existing records before creating — `if (count === 0)`. This means running the seed or clicking the button multiple times is safe — it will never duplicate data.
- Unsplash URLs use the format `https://images.unsplash.com/photo-[id]?w=800` — these are publicly accessible and do not require an API key. They are suitable for demo purposes only.
- The join form is created with slug `join-room-for-you` — this matches the existing CTA links throughout the site (`/forms/join-room-for-you`). If a form with this slug already exists, the seed skips form creation but still attempts to create submissions.
- After running demo data, go to `/admin/integrations` and save your real credentials. The demo data does not touch credentials.
