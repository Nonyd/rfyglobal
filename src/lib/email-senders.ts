// Canonical sender addresses for all outgoing emails
export const EMAIL_SENDERS = {
  // General community emails
  hello: {
    name: 'Room For You',
    email: 'hello@rfyglobal.org',
  },
  // Daily Word / devotional
  word: {
    name: 'The Word · Room For You',
    email: 'word@rfyglobal.org',
  },
  // Events
  events: {
    name: 'Room For You Events',
    email: 'events@rfyglobal.org',
  },
  // Prayer team
  prayer: {
    name: 'Room For You Prayer Team',
    email: 'prayer@rfyglobal.org',
  },
  // Partnership / giving
  partner: {
    name: 'Room For You',
    email: 'partner@rfyglobal.org',
  },
} as const
