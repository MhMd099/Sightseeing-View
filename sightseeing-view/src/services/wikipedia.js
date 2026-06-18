const CAVE_CACHE = new Map()
const ARTICLE_CACHE = new Map()

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
  return String(title || '').replace(/_/g, ' ').trim()
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/g, 'ss')
    .trim()
}

async function fetchJson(url) {
  const response = await fetch(url)
  if (!response.ok) {
    return null
  }

  return response.json()
}

function parseCaveMetric(text) {
  const matches = String(text || '').matchAll(/(\d{1,3}(?:[.\s]\d{3})*(?:[.,]\d+)?)\s*(km|m|cm|mm)\b/gi)
  let bestValue = null
  let bestLabel = ''

  for (const match of matches) {
    const rawValue = String(match[1] || '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.')
    const numericValue = Number(rawValue)
    if (!Number.isFinite(numericValue)) {
      continue
    }

    const unit = String(match[2] || '').toLowerCase()
    const valueInMeters = unit === 'km' ? numericValue * 1000 : unit === 'cm' ? numericValue / 100 : unit === 'mm' ? numericValue / 1000 : numericValue

    if (bestValue === null || valueInMeters > bestValue) {
      bestValue = valueInMeters
      bestLabel = `${match[1]} ${unit}`
    }
  }

  return {
    value: bestValue,
    label: bestLabel
  }
}

export async function fetchWikipediaArticleIntro(lang, title) {
  const cacheKey = `${lang}:${normalizeText(title)}`
  if (ARTICLE_CACHE.has(cacheKey)) {
    return ARTICLE_CACHE.get(cacheKey)
  }

  const payload = await fetchJson(
    buildWikiUrl(`https://${lang}.wikipedia.org/w/api.php`, {
      action: 'query',
      prop: 'extracts',
      exintro: 1,
      explaintext: 1,
      titles: title,
      format: 'json',
      origin: '*'
    })
  )

  const pages = payload?.query?.pages
  if (!pages) {
    return ''
  }

  const page = Object.values(pages)[0]
  const extract = String(page?.extract || '').trim()
  ARTICLE_CACHE.set(cacheKey, extract)
  return extract
}

export async function fetchWikipediaPageDetails(lang, title) {
  const cacheKey = `${lang}:${normalizeText(title)}:details`
  if (ARTICLE_CACHE.has(cacheKey)) {
    return ARTICLE_CACHE.get(cacheKey)
  }

  const payload = await fetchJson(
    buildWikiUrl(`https://${lang}.wikipedia.org/w/api.php`, {
      action: 'query',
      prop: 'extracts|pageimages|description|info',
      exintro: 1,
      explaintext: 1,
      inprop: 'url',
      pithumbsize: 1400,
      titles: title,
      format: 'json',
      origin: '*'
    })
  )

  const pages = payload?.query?.pages
  if (!pages) {
    const fallback = {
      title: normalizeTitle(title),
      extract: '',
      description: '',
      image: '',
      pageUrl: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title)}`
    }

    ARTICLE_CACHE.set(cacheKey, fallback)
    return fallback
  }

  const page = Object.values(pages)[0] || {}
  const details = {
    title: normalizeTitle(page.title || title),
    extract: String(page.extract || '').trim(),
    description: String(page.description || '').trim(),
    image: page.thumbnail?.source || page.originalimage?.source || '',
    pageUrl: page.fullurl || `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title)}`
  }

  ARTICLE_CACHE.set(cacheKey, details)
  return details
}

async function getBestCaveCandidate(caves) {
  const candidates = Array.isArray(caves) ? caves.slice(0, 12) : []
  const enriched = await Promise.all(
    candidates.map(async (cave) => {
      const extract = await fetchWikipediaArticleIntro(cave.sourceLang, cave.name)
      const metric = parseCaveMetric(extract)

      return {
        ...cave,
        extract,
        metricValue: metric.value === null ? -1 : metric.value,
        metricLabel: metric.label
      }
    })
  )

  return enriched.reduce((best, current) => {
    if (!best) {
      return current
    }

    return current.metricValue > best.metricValue ? current : best
  }, null)
}

async function searchWikipediaTitles(query, lang, limit = 10, namespace) {
  const params = {
    action: 'query',
    list: 'search',
    srsearch: query,
    srlimit: limit,
    format: 'json',
    origin: '*'
  }

  if (namespace !== undefined) {
    params.srnamespace = namespace
  }

  const payload = await fetchJson(buildWikiUrl(`https://${lang}.wikipedia.org/w/api.php`, params))
  const hits = Array.isArray(payload?.query?.search) ? payload.query.search : []
  return hits.map((hit) => normalizeTitle(hit.title)).filter(Boolean)
}

async function getEnglishTitleFromDe(deTitle) {
  const payload = await fetchJson(
    buildWikiUrl('https://de.wikipedia.org/w/api.php', {
      action: 'query',
      prop: 'langlinks',
      lllang: 'en',
      titles: deTitle,
      format: 'json',
      origin: '*'
    })
  )

  const pages = payload?.query?.pages
  if (!pages) {
    return null
  }

  const page = Object.values(pages)[0]
  const link = page?.langlinks?.[0]
  return link ? normalizeTitle(link['*']) : null
}

async function resolveCountryTitle(country) {
  const query = String(country || '').trim()
  if (!query) {
    return null
  }

  const enHits = await searchWikipediaTitles(query, 'en', 10, 0)
  if (enHits.length) {
    return enHits[0]
  }

  const deHits = await searchWikipediaTitles(query, 'de', 10, 0)
  for (const deHit of deHits) {
    const enTitle = await getEnglishTitleFromDe(deHit)
    if (enTitle) {
      return enTitle
    }
  }

  return null
}

async function getExistingTitle(lang, title) {
  const payload = await fetchJson(
    buildWikiUrl(`https://${lang}.wikipedia.org/w/api.php`, {
      action: 'query',
      titles: title,
      format: 'json',
      origin: '*'
    })
  )

  const pages = payload?.query?.pages
  if (!pages) {
    return null
  }

  const page = Object.values(pages)[0]
  if (!page || page.missing) {
    return null
  }

  return normalizeTitle(page.title)
}

async function resolveCategoryTitle(countryTitle) {
  const normalizedCountry = String(countryTitle || '').trim()
  if (!normalizedCountry) {
    return null
  }

  const candidateSuffixes = [
    normalizedCountry,
    normalizedCountry.replace(/\s*\([^)]*\)\s*$/, ''),
    normalizedCountry.replace(/^the\s+/i, '')
  ].filter(Boolean)

  const exactCandidates = []
  for (const suffix of candidateSuffixes) {
    exactCandidates.push(`Category:Caves of ${suffix}`)
    exactCandidates.push(`Category:Caves of the ${suffix}`)
    exactCandidates.push(`Category:Caves in ${suffix}`)
  }

  for (const candidate of exactCandidates) {
    const existing = await getExistingTitle('en', candidate)
    if (existing) {
      return existing
    }
  }

  const rootMembers = await listCategorySubcategories('en', 'Category:Caves by country')
  const normalizedNeedle = normalizeText(normalizedCountry)
  const rootHit = rootMembers.find((member) => normalizeText(member.title).includes(normalizedNeedle))
  if (rootHit) {
    return rootHit.title
  }

  const searchQueries = [
    `Category:Caves of ${normalizedCountry}`,
    `Category:Caves in ${normalizedCountry}`,
    `Category:Caves ${normalizedCountry}`
  ]

  for (const query of searchQueries) {
    const hits = await searchWikipediaTitles(query, 'en', 10, 14)
    const exactHit = hits.find((title) => /^Category:/i.test(title))
    if (exactHit) {
      return exactHit
    }
  }

  return null
}

async function fetchCategoryMembers(lang, categoryTitle, seenCategories, depth = 0, includeOnlySubcategories = false) {
  const categoryKey = normalizeText(categoryTitle)
  if (!categoryKey || seenCategories.has(categoryKey) || depth > 4) {
    return []
  }

  seenCategories.add(categoryKey)

  const collected = []
  let cmcontinue = null

  do {
    const payload = await fetchJson(
      buildWikiUrl(`https://${lang}.wikipedia.org/w/api.php`, {
        action: 'query',
        list: 'categorymembers',
        cmtitle: categoryTitle,
        cmtype: includeOnlySubcategories ? 'subcat' : 'page|subcat',
        cmlimit: 'max',
        format: 'json',
        origin: '*',
        ...(cmcontinue ? { cmcontinue } : {})
      })
    )

    const members = Array.isArray(payload?.query?.categorymembers) ? payload.query.categorymembers : []

    for (const member of members) {
      if (member.ns === 14) {
        const nested = await fetchCategoryMembers(lang, member.title, seenCategories, depth + 1)
        collected.push(...nested)
        continue
      }

      if (member.ns === 0) {
        collected.push({
          name: normalizeTitle(member.title),
          sourceCategory: categoryTitle,
          sourceLang: lang
        })
      }
    }

    cmcontinue = payload?.continue?.cmcontinue || null
  } while (cmcontinue)

  return collected
}

async function listCategorySubcategories(lang, categoryTitle) {
  const subcategories = []
  let cmcontinue = null

  do {
    const payload = await fetchJson(
      buildWikiUrl(`https://${lang}.wikipedia.org/w/api.php`, {
        action: 'query',
        list: 'categorymembers',
        cmtitle: categoryTitle,
        cmtype: 'subcat',
        cmlimit: 'max',
        format: 'json',
        origin: '*',
        ...(cmcontinue ? { cmcontinue } : {})
      })
    )

    const members = Array.isArray(payload?.query?.categorymembers) ? payload.query.categorymembers : []
    members.forEach((member) => {
      if (member.ns === 14) {
        subcategories.push({
          title: normalizeTitle(member.title)
        })
      }
    })

    cmcontinue = payload?.continue?.cmcontinue || null
  } while (cmcontinue)

  return subcategories
}

export async function fetchWikipediaCaves(country) {
  const cacheKey = normalizeText(country)
  if (CAVE_CACHE.has(cacheKey)) {
    return CAVE_CACHE.get(cacheKey).slice()
  }

  const countryTitle = await resolveCountryTitle(country)
  const categories = []

  if (countryTitle) {
    const categoryTitle = await resolveCategoryTitle(countryTitle)
    if (categoryTitle) {
      categories.push({ lang: 'en', title: categoryTitle })
    }
  }

  if (!categories.length) {
    const rootMembers = await listCategorySubcategories('en', 'Category:Caves by country')
    const normalizedNeedle = normalizeText(country)
    const rootHit = rootMembers.find((member) => normalizeText(member.title).includes(normalizedNeedle))
    if (rootHit) {
      categories.push({ lang: 'en', title: rootHit.title })
    }
  }

  const collected = []
  for (const category of categories) {
    const members = await fetchCategoryMembers(category.lang, category.title, new Set())
    collected.push(...members)
  }

  const seen = new Set()
  const unique = []

  for (const cave of collected) {
    const key = normalizeText(cave.name)
    if (!key || seen.has(key)) {
      continue
    }

    seen.add(key)
    unique.push(cave)
  }

  CAVE_CACHE.set(cacheKey, unique)
  return unique.slice()
}

export async function compareCaves(countryA, countryB) {
  const [cavesA, cavesB] = await Promise.all([
    fetchWikipediaCaves(countryA),
    fetchWikipediaCaves(countryB)
  ])

  const [bestA, bestB] = await Promise.all([
    getBestCaveCandidate(cavesA),
    getBestCaveCandidate(cavesB)
  ])

  return {
    countryA: String(countryA || '').trim(),
    countryB: String(countryB || '').trim(),
    bestA,
    bestB
  }
}