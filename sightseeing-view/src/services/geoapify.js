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
  return {
    lat,
    lon,
    label: feature.properties.formatted || cityQuery,
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

export function mapGeoapifyPlace(feature) {
  const properties = feature.properties || {}
  const coordinates = feature.geometry && feature.geometry.coordinates
  const lon = properties.lon ?? (coordinates ? coordinates[0] : null)
  const lat = properties.lat ?? (coordinates ? coordinates[1] : null)
  const address = properties.formatted || [properties.address_line1, properties.address_line2]
    .filter(Boolean)
    .join(', ')

  return {
    name: properties.name || properties.address_line1 || 'Unbenannter Ort',
    category: (properties.categories && properties.categories[0]) || 'tourism',
    address: address || 'Adresse unbekannt',
    coords: {
      lat,
      lon
    },
    website: properties.website || null,
    opening_hours: properties.opening_hours || null,
    image: properties.image || null
  }
}
