<template>
  <main class="results-page">
    <header class="results-hero">
      <div>
        <p class="hero-kicker">Listenansicht</p>
        <h1>
          {{ cityLabel ? `Sehenswuerdigkeiten in ${cityLabel}` : 'Finde deine Stadt' }}
        </h1>
        <p class="hero-subtitle">
          Hier landen die Ergebnisse nach deiner Suche. Pro Seite werden 24 Spots geladen.
        </p>
      </div>
      <CitySearch
        v-model="cityQuery"
        button-text="Suche"
        helper="Enter druecken, um die Liste zu laden."
        @submit="handleSearch"
      />
    </header>

    <section class="results-content">
      <p v-if="!hasSearched" class="empty">
        Noch keine Suche gestartet. Gib oben eine Stadt ein.
      </p>

      <div v-else>
        <p v-if="isLoading" class="status">Lade Ergebnisse...</p>
        <p v-else-if="error" class="error">{{ error }}</p>
        <p v-else-if="results.length === 0" class="empty">
          Keine Ergebnisse gefunden. Probiere eine andere Stadt.
        </p>

        <div v-if="results.length" class="results-header">
          <h2>Sehenswuerdigkeiten</h2>
          <div class="pagination">
            <button type="button" @click="changePage(-1)" :disabled="page === 1 || isLoading">
              Zurueck
            </button>
            <span>Seite {{ page }}</span>
            <button type="button" @click="changePage(1)" :disabled="!hasNextPage || isLoading">
              Weiter
            </button>
          </div>
        </div>

        <div v-if="results.length" class="result-grid">
          <article
            v-for="place in results"
            :key="buildPlaceKey(place)"
            class="result-card"
            @click="openDetail(place)"
          >
            <div>
              <p class="result-tag">{{ place.categoryLabel }}</p>
              <h3>{{ displayName(place) }}</h3>
              <p class="result-address">{{ place.address }}</p>
            </div>
            <p class="result-meta">
              {{ place.website || 'Details folgen in der Detailansicht.' }}
            </p>
            <p class="result-cta">Details ansehen</p>
          </article>
        </div>
      </div>
    </section>
  </main>
</template>

<script>
import CitySearch from '@/components/CitySearch.vue'
import { fetchSightseeing, geocodeCity, mapGeoapifyPlace } from '@/services/geoapify'
import { fetchWikipediaAttractions } from '@/services/wikipedia'

export default {
  name: 'SearchResultsView',
  components: {
    CitySearch
  },
  data() {
    return {
      cityQuery: '',
      cityLabel: '',
      lastCity: '',
      lastLocation: null,
      results: [],
      page: 1,
      limit: 24,
      hasNextPage: false,
      isLoading: false,
      error: '',
      hasSearched: false,
      wikiNames: []
    }
  },
  watch: {
    '$route.query.city': {
      immediate: true,
      handler(newCity) {
        if (!newCity) {
          this.hasSearched = false
          this.results = []
          this.error = ''
          return
        }

        const normalizedCity = String(newCity)
        this.cityQuery = normalizedCity
        this.handleSearch(normalizedCity)
      }
    }
  },
  methods: {
    handleSearch(city) {
      const trimmed = city.trim()
      if (!trimmed) {
        return
      }

      if (trimmed !== this.lastCity) {
        this.page = 1
        this.lastLocation = null
        this.wikiNames = []
      }

      if (this.$route.query.city !== trimmed) {
        this.$router.push({ name: 'results', query: { city: trimmed } })
      }

      this.fetchResults(trimmed)
    },
    async fetchResults(city) {
      this.isLoading = true
      this.error = ''
      this.hasSearched = true

      try {
        if (!this.lastLocation || this.lastCity !== city) {
          this.lastLocation = await geocodeCity(city)
          this.cityLabel = this.lastLocation.cityName || this.lastLocation.label
          this.lastCity = city
        }

        const requestLimit = Math.max(this.limit * 4, 200)
        const payload = await fetchSightseeing({
          lat: this.lastLocation.lat,
          lon: this.lastLocation.lon,
          limit: requestLimit,
          offset: (this.page - 1) * requestLimit
        })

        const features = payload.features || []
        const mapped = features.map((feature) => mapGeoapifyPlace(feature))
        const filtered = this.dedupePlaces(this.filterPlaces(mapped))

        if (!this.wikiNames.length) {
          const wikiCity = this.lastLocation.cityName || city
          this.wikiNames = await fetchWikipediaAttractions(wikiCity, 80)
        }

        if (!this.wikiNames.length) {
          this.results = []
          this.hasNextPage = false
          return
        }

        const ordered = this.matchPlacesToWiki(this.wikiNames, filtered)
        const start = (this.page - 1) * this.limit
        this.results = ordered.slice(start, start + this.limit)
        this.hasNextPage = ordered.length > start + this.limit
      } catch (err) {
        this.error = err.message || 'Etwas ist schiefgelaufen.'
        this.results = []
        this.hasNextPage = false
      } finally {
        this.isLoading = false
      }
    },
    changePage(direction) {
      const nextPage = this.page + direction
      if (nextPage < 1 || (direction > 0 && !this.hasNextPage)) {
        return
      }

      this.page = nextPage
      if (this.lastCity) {
        this.fetchResults(this.lastCity)
      }
    },
    filterPlaces(places) {
      const allowlist = new Set([
        'tourism.sights',
        'tourism.attraction',
        'tourism.museum',
        'tourism.gallery',
        'tourism.monument',
        'tourism.artwork',
        'tourism.viewpoint',
        'tourism.theme_park',
        'tourism.zoo',
        'tourism.castle',
        'tourism.palace',
        'tourism.heritage'
      ])

      const streetNamePattern = /(strasse|straße|gasse|platz|weg|allee|ring|ufer|promenade|boulevard|road|street|avenue|lane|drive)\s*\d+/i

      return places.filter((place) => {
        const name = (place.name || '').toLowerCase().trim()
        if (!name || name === 'unbenannter ort') {
          return false
        }

        if (/°/.test(name) || /\d+[.,]\d+/.test(name)) {
          return false
        }

        if (streetNamePattern.test(name)) {
          return false
        }

        const addressLine1 = (place.addressLine1 || '').toLowerCase()
        if (addressLine1 && addressLine1 === name && /\d/.test(addressLine1)) {
          return false
        }

        const categories = place.categories || []
        const allowed = categories.some((category) => allowlist.has(category))
        if (!allowed) {
          return false
        }

        const blocked = categories.some((category) => {
          return (
            category.startsWith('highway') ||
            category.startsWith('building') ||
            category.startsWith('amenity.school') ||
            category.startsWith('amenity.college') ||
            category.startsWith('amenity.university') ||
            category.includes('address') ||
            category.includes('road')
          )
        })

        return !blocked
      })
    },
    dedupePlaces(places) {
      const seen = new Set()
      return places.filter((place) => {
        const key = this.buildPlaceKey(place)
        if (seen.has(key)) {
          return false
        }
        seen.add(key)
        return true
      })
    },
    buildPlaceKey(place) {
      const lat = place.coords?.lat
      const lon = place.coords?.lon
      const roundedLat = typeof lat === 'number' ? lat.toFixed(3) : 'na'
      const roundedLon = typeof lon === 'number' ? lon.toFixed(3) : 'na'
      const nameKey = (place.name || '').toLowerCase().trim()
      const addressKey = (place.addressLine1 || place.address || '').toLowerCase().trim()
      return `${nameKey}|${addressKey}|${roundedLat}|${roundedLon}`
    },
    matchPlacesToWiki(wikiNames, places) {
      const normalize = (value) => {
        return value
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/ß/g, 'ss')
          .replace(/[^a-z0-9 ]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
      }

      const remaining = places.map((place) => ({
        place,
        name: normalize(place.name || ''),
        alt: normalize(place.nameGerman || '')
      }))
      const used = new Set()
      const results = []

      wikiNames.forEach((wikiName) => {
        const target = normalize(wikiName)
        if (!target) {
          return
        }

        let best = null
        let bestScore = 0
        remaining.forEach((entry) => {
          const key = this.buildPlaceKey(entry.place)
          if (used.has(key)) {
            return
          }

          const candidates = [entry.name, entry.alt].filter(Boolean)
          let score = 0
          candidates.forEach((candidate) => {
            if (candidate === target) {
              score = Math.max(score, 3)
            } else if (candidate.startsWith(target) || target.startsWith(candidate)) {
              score = Math.max(score, 2)
            } else if (candidate.includes(target) || target.includes(candidate)) {
              score = Math.max(score, 1)
            }
          })

          if (score > bestScore) {
            bestScore = score
            best = entry.place
          }
        })

        if (best && bestScore > 0) {
          const key = this.buildPlaceKey(best)
          used.add(key)
          results.push(best)
        }
      })

      return results
    },
    displayName(place) {
      const original = place.name || ''
      const german = place.nameGerman
      if (!german) {
        return original
      }

      if (german.toLowerCase() === original.toLowerCase()) {
        return original
      }

      return `${original} (${german})`
    },
    openDetail(place) {
      this.$router.push({
        name: 'detail',
        params: {
          id: this.buildPlaceKey(place)
        },
        query: {
          name: place.name,
          category: place.category,
          address: place.address,
          website: place.website || '',
          opening: place.opening_hours || '',
          image: place.image || '',
          lat: place.coords?.lat ?? '',
          lon: place.coords?.lon ?? '',
          city: this.cityLabel || this.lastCity || ''
        }
      })
    }
  }
}
</script>

<style scoped>
.results-page {
  padding: 48px 7vw 64px;
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.results-hero {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  align-items: center;
}

.hero-kicker {
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-size: 0.75rem;
  color: #2a9d8f;
  margin: 0;
}

.results-hero h1 {
  font-size: clamp(2rem, 2vw + 1.5rem, 2.8rem);
  margin: 10px 0 12px;
}

.hero-subtitle {
  margin: 0;
  color: #5f6c7b;
}

.results-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.results-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.results-header h2 {
  margin: 0;
  font-size: 1.4rem;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.7);
  padding: 8px 14px;
  border-radius: 999px;
}

.pagination button {
  border: none;
  background: none;
  color: #e07a5f;
  font-weight: 600;
  cursor: pointer;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.result-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  align-items: stretch;
}

.result-card {
  background: #fff;
  border-radius: 18px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 210px;
  gap: 18px;
  box-shadow: 0 20px 40px rgba(31, 41, 51, 0.1);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.result-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 24px 48px rgba(31, 41, 51, 0.16);
}

.result-tag {
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-size: 0.7rem;
  color: #2a9d8f;
  margin: 0;
}

.result-address {
  margin: 8px 0 0;
  color: #52606d;
}

.result-meta {
  margin: 0;
  font-size: 0.85rem;
  color: #7b8794;
}

.result-cta {
  margin: 0;
  color: #e07a5f;
  font-weight: 600;
}

.status {
  color: #52606d;
}

.error {
  color: #b42318;
  background: #ffe4e8;
  padding: 12px 14px;
  border-radius: 12px;
}

.empty {
  color: #52606d;
}

@media (max-width: 640px) {
  .pagination {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
