export function OrganizationJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Room For You',
    alternateName: 'RFY',
    url: 'https://rfyglobal.org',
    logo: 'https://rfyglobal.org/images/logo-white.svg',
    description:
      'A worship, prayer, study, mentorship and evangelism community founded by Minister Yadah. Jesus to Nations.',
    founder: {
      '@type': 'Person',
      name: 'Minister Yadah',
      url: 'https://yadahworld.com',
    },
    sameAs: ['https://instagram.com/roomforyou', 'https://youtube.com/@roomforyou'],
  }

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  )
}

export function WebsiteJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Room For You',
    url: 'https://rfyglobal.org',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://rfyglobal.org/blog?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  )
}
