const ATTRACTIONS_CACHE = new Map()

function buildWikiUrl(base, params) {
  const url = new URL(base)
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value)
    }
  })
  return url.toString()
}

function normalizeTitle(title) {
  return title.replace(/_/g, ' ').trim()
}

function normalizeText(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/g, 'ss')
    .trim()
}

async function searchWikipediaTitle(query, lang) {
  const url = buildWikiUrl(`https://${lang}.wikipedia.org/w/api.php`, {
    action: 'query',
    list: 'search',
    srsearch: query,
    srlimit: 1,
    format: 'json',
    origin: '*'
  })

  const response = await fetch(url)
  if (!response.ok) {
    return null
  }

  const payload = await response.json()
  const hit = payload.query && payload.query.search && payload.query.search[0]
  return hit ? normalizeTitle(hit.title) : null
}

async function fetchSections(lang, title) {
  const url = buildWikiUrl(`https://${lang}.wikipedia.org/w/api.php`, {
    action: 'parse',
    prop: 'sections',
    page: title,
    format: 'json',
    origin: '*'
  })

  const response = await fetch(url)
  if (!response.ok) {
    return []
  }

  const payload = await response.json()
  return (payload.parse && payload.parse.sections) || []
}

async function fetchSectionHtml(lang, title, sectionIndex) {
  const url = buildWikiUrl(`https://${lang}.wikipedia.org/w/api.php`, {
    action: 'parse',
    prop: 'text',
    page: title,
    section: sectionIndex,
    format: 'json',
    origin: '*'
  })

  const response = await fetch(url)
  if (!response.ok) {
    return ''
  }

  const payload = await response.json()
  return (payload.parse && payload.parse.text && payload.parse.text['*']) || ''
}

function extractListItemsFromHtml(html) {
  if (!html) {
    return []
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const items = Array.from(doc.querySelectorAll('li'))
  return items
    .map((item) => {
      const link = item.querySelector('a')
      const text = link ? link.textContent : item.textContent
      return text ? text.replace(/\s+/g, ' ').trim() : ''
    })
    .filter(Boolean)
}

async function extractAttractionsFromPage(lang, title) {
  const sectionKeywords = {
    de: ['sehenswurdigkeiten', 'sehenswuerdigkeiten', 'sehenswertes', 'attraktionen', 'kultur', 'tourismus'],
    en: ['attractions', 'sights', 'landmarks', 'tourist attractions', 'points of interest']
  }

  const sections = await fetchSections(lang, title)
  const keywords = sectionKeywords[lang] || []
  const matches = sections.filter((section) => {
    const normalized = normalizeText(section.line || '')
    return keywords.some((keyword) => normalized.includes(keyword))
  })

  if (matches.length) {
    const combined = []
    for (const match of matches) {
      const html = await fetchSectionHtml(lang, title, match.index)
      combined.push(...extractListItemsFromHtml(html))
    }
    return combined
  }

  const fallbackHtml = await fetchSectionHtml(lang, title, 0)
  return extractListItemsFromHtml(fallbackHtml)
}

async function fetchAttractionsForLang(city, lang) {
  const candidates = lang === 'de'
    ? [
        `${city} Sehenswuerdigkeiten`,
        `Sehenswuerdigkeiten in ${city}`,
        `${city}`
      ]
    : [
        `Tourist attractions in ${city}`,
        `List of tourist attractions in ${city}`,
        `Sights in ${city}`,
        `${city}`
      ]

  const combined = []
  for (const query of candidates) {
    const title = await searchWikipediaTitle(query, lang)
    if (!title) {
      continue
    }

    const items = await extractAttractionsFromPage(lang, title)
    if (items.length) {
      combined.push(...items)
    }
  }

  return combined
}

export async function fetchWikipediaAttractions(city, limit = 60) {
  const cacheKey = normalizeText(city)
  if (ATTRACTIONS_CACHE.has(cacheKey)) {
    return ATTRACTIONS_CACHE.get(cacheKey).slice(0, limit)
  }

  const deItems = await fetchAttractionsForLang(city, 'de')

  const seen = new Set()
  const merged = []

  const addItems = (items) => {
    items.forEach((item) => {
      const normalized = normalizeText(item)
      if (!normalized || seen.has(normalized)) {
        return
      }
      seen.add(normalized)
      merged.push(item)
    })
  }

  addItems(deItems)

  ATTRACTIONS_CACHE.set(cacheKey, merged)
  return merged.slice(0, limit)
}

async function getGermanTitleFromEn(enTitle) {
  const url = buildWikiUrl('https://en.wikipedia.org/w/api.php', {
    action: 'query',
    prop: 'langlinks',
    lllang: 'de',
    titles: enTitle,
    format: 'json',
    origin: '*'
  })

  const response = await fetch(url)
  if (!response.ok) {
    return null
  }

  const payload = await response.json()
  const pages = payload.query && payload.query.pages
  if (!pages) {
    return null
  }

  const page = Object.values(pages)[0]
  const link = page && page.langlinks && page.langlinks[0]
  return link ? normalizeTitle(link['*']) : null
}

function formatPageviewsDate(date) {
  const yyyy = date.getUTCFullYear()
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(date.getUTCDate()).padStart(2, '0')
  return `${yyyy}${mm}${dd}`
}

async function getPageviews(lang, title) {
  const end = new Date()
  const start = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30)
  const url = buildWikiUrl(
    `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/${lang}.wikipedia.org/all-access/user/${encodeURIComponent(title)}/daily/${formatPageviewsDate(start)}/${formatPageviewsDate(end)}`,
    {}
  )

  const response = await fetch(url)
  if (!response.ok) {
    return 0
  }

  const payload = await response.json()
  const items = payload.items || []
  return items.reduce((sum, item) => sum + (item.views || 0), 0)
}

export async function enrichPlacesWithWikipedia(places, cityLabel) {
  const cache = new Map()
  const enriched = []
  const queries = places.map((place) => {
    const key = `${place.name}|${cityLabel}`
    if (cache.has(key)) {
      return cache.get(key)
    }

    const task = (async () => {
      let deTitle = await searchWikipediaTitle(`${place.name} ${cityLabel}`, 'de')
      let enTitle = null

      if (!deTitle) {
        enTitle = await searchWikipediaTitle(`${place.name} ${cityLabel}`, 'en')
        if (enTitle) {
          deTitle = await getGermanTitleFromEn(enTitle)
        }
      }

      const titleForViews = deTitle || enTitle
      const langForViews = deTitle ? 'de' : 'en'
      const pageviews = titleForViews ? await getPageviews(langForViews, titleForViews) : 0

      return {
        place,
        deTitle,
        enTitle,
        pageviews
      }
    })()

    cache.set(key, task)
    return task
  })

  const results = await Promise.all(queries)
  results.forEach(({ place, deTitle, pageviews }) => {
    enriched.push({
      ...place,
      nameGerman: place.nameGerman || deTitle || null,
      wikiScore: pageviews
    })
  })

  return enriched
}
