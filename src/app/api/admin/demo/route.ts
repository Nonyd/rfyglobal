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
