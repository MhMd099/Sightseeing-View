const GEOAPIFY_KEY = process.env.VUE_APP_GEOAPIFY_KEY

function buildUrl(base, params) {
  const url = new URL(base)
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value)
    }
  })
  return url.toString()
}

export async function geocodeCity(cityQuery) {
  if (!GEOAPIFY_KEY) {
    throw new Error('Missing Geoapify API key. Set VUE_APP_GEOAPIFY_KEY in .env.')
  }

  const url = buildUrl('https://api.geoapify.com/v1/geocode/search', {
    text: cityQuery,
    type: 'city',
    limit: 1,
    lang: 'de',
    apiKey: GEOAPIFY_KEY
  })

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Geoapify geocoding failed.')
  }

  const payload = await response.json()
  const feature = payload.features && payload.features[0]
  if (!feature) {
    throw new Error('No city found. Try a different search term.')
  }

  const { lat, lon } = feature.properties
  const cityName = feature.properties.city || feature.properties.locality || feature.properties.name || cityQuery
  return {
    lat,
    lon,
    label: cityName,
    cityName,
    raw: feature
  }
}

export async function fetchSightseeing({ lat, lon, limit = 10, offset = 0 }) {
  if (!GEOAPIFY_KEY) {
    throw new Error('Missing Geoapify API key. Set VUE_APP_GEOAPIFY_KEY in .env.')
  }

  const url = buildUrl('https://api.geoapify.com/v2/places', {
    categories: 'tourism.sights,tourism.attraction',
    filter: `circle:${lon},${lat},15000`,
    bias: `proximity:${lon},${lat}`,
    limit,
    offset,
    apiKey: GEOAPIFY_KEY
  })

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Geoapify places request failed.')
  }

  return response.json()
}

function categoryLabelFrom(categories) {
  const primary = (categories && categories[0]) || ''
  const map = {
    'tourism.sights': 'Historische Sehenswuerdigkeit',
    'tourism.attraction': 'Attraktion',
    'tourism.museum': 'Museum',
    'tourism.gallery': 'Galerie',
    'tourism.zoo': 'Zoo',
    'tourism.theme_park': 'Freizeitpark',
    'tourism.viewpoint': 'Aussichtspunkt',
    'tourism.monument': 'Denkmal',
    'tourism.artwork': 'Kunstwerk',
    'tourism.castle': 'Burg',
    'tourism.palace': 'Schloss',
    'tourism.heritage': 'Kulturerbe',
    'tourism.information': 'Tourismusinfo'
  }

  return map[primary] || primary.replace(/\./g, ' ') || 'Sehenswuerdigkeit'
}

export function mapGeoapifyPlace(feature) {
  const properties = feature.properties || {}
  const coordinates = feature.geometry && feature.geometry.coordinates
  const lon = properties.lon ?? (coordinates ? coordinates[0] : null)
  const lat = properties.lat ?? (coordinates ? coordinates[1] : null)
  const categories = properties.categories || []
  const rank = properties.rank || {}
  const popularityScore = Number(
    properties.rank_importance ??
    properties.rank_popularity ??
    rank.importance ??
    rank.popularity ??
    0
  )
  const address = properties.formatted || [properties.address_line1, properties.address_line2]
    .filter(Boolean)
    .join(', ')
  const addressLine1 = properties.address_line1 || ''
  const addressLine2 = properties.address_line2 || ''
  const nameOriginal = properties.name || properties.address_line1 || 'Unbenannter Ort'
  const nameGerman = properties['name:de'] || properties['name:deu'] || null

  return {
    id: properties.place_id || properties.datasource?.raw?.osm_id || null,
    name: nameOriginal,
    nameGerman,
    category: categories[0] || 'tourism',
    categoryLabel: categoryLabelFrom(categories),
    address: address || 'Adresse unbekannt',
    addressLine1,
    addressLine2,
    coords: {
      lat,
      lon
    },
    website: properties.website || null,
    opening_hours: properties.opening_hours || null,
    image: properties.image || null,
    categories,
    popularityScore
  }
}
