<template>
  <main class="results-page">
    <header class="results-hero">
      <div>
        <p class="hero-kicker">Wikipedia-Kategorie</p>
        <h1>
          {{ countryLabel ? `Hoehlen in ${countryLabel}` : 'Hoehlen weltweit' }}
        </h1>
        <p class="hero-subtitle">
          Wir lesen die Wikipedia-Kategorie aus und zeigen alle gefundenen Hoehlen.
        </p>
      </div>
      <CitySearch
        v-model="countryQuery"
        placeholder="z.B. Österreich, Venezuela, Kanada"
        button-text="Suche"
        helper="Land eingeben und Enter druecken."
        @submit="handleSearch"
      />
    </header>


    <section class="results-content">
      <p v-if="!hasSearched" class="empty">
        Noch keine Suche gestartet. Gib oben ein Land ein.
      </p>

      <div v-else>
        <p v-if="isLoading" class="status">Lade Hoehlen aus Wikipedia...</p>
        <p v-else-if="error" class="error">{{ error }}</p>
        <p v-else-if="caves.length === 0" class="empty">
          Keine Hoehlen gefunden. Probiere ein anderes Land.
        </p>

        <div v-if="caves.length" class="results-header">
          <h2>{{ caves.length }} Hoehlen gefunden</h2>
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

        <div v-if="caves.length" class="result-grid">
          <article v-for="cave in pagedCaves" :key="caveKey(cave)" class="result-card">
            <div>
              <p class="result-tag">Wikipedia</p>
              <h3>{{ cave.name }}</h3>
              <p class="result-address">{{ cave.sourceCategory }}</p>
            </div>
            <p class="result-meta">
              {{ cave.sourceLang === 'de' ? 'Quelle: Deutsche Wikipedia' : 'Quelle: Englische Wikipedia' }}
            </p>
          </article>
        </div>
      </div>
    </section>
  </main>
</template>

<script>
import CitySearch from '@/components/CitySearch.vue'
import { fetchWikipediaCaves } from '@/services/wikipedia'

export default {
  name: 'SearchResultsView',
  components: {
    CitySearch
  },
  data() {
    return {
      countryQuery: '',
      countryLabel: '',
      caves: [],
      page: 1,
      limit: 8,
      isLoading: false,
      error: '',
      hasSearched: false,
      lastCountry: ''
    }
  },
  computed: {
    pagedCaves() {
      const start = (this.page - 1) * this.limit
      return this.caves.slice(start, start + this.limit)
    },
    hasNextPage() {
      return this.page * this.limit < this.caves.length
    }
  },
  watch: {
    '$route.query.country': {
      immediate: true,
      handler(newCountry) {
        if (!newCountry) {
          this.hasSearched = false
          this.caves = []
          this.error = ''
          this.countryLabel = ''
          this.page = 1
          return
        }

        const normalizedCountry = String(newCountry)
        this.countryQuery = normalizedCountry
        this.fetchCaves(normalizedCountry)
      }
    }
  },
  methods: {
    handleSearch(country) {
      const trimmed = country.trim()
      if (!trimmed) {
        return
      }

      if (this.$route.query.country !== trimmed) {
        this.$router.push({ name: 'results', query: { country: trimmed } })
        return
      }

      this.fetchCaves(trimmed)
    },
    async fetchCaves(country) {
      this.isLoading = true
      this.error = ''
      this.hasSearched = true

      try {
        const trimmed = country.trim()
        if (trimmed !== this.lastCountry) {
          this.page = 1
        }

        this.countryLabel = trimmed
        this.lastCountry = trimmed
        this.caves = await fetchWikipediaCaves(trimmed)
      } catch (err) {
        this.error = err.message || 'Etwas ist schiefgelaufen.'
        this.caves = []
      } finally {
        this.isLoading = false
        this.isLoading = false
      }
    },
    changePage(direction) {
      const nextPage = this.page + direction
      if (nextPage < 1 || (direction > 0 && !this.hasNextPage)) {
        return
      }

      this.page = nextPage
    },
    caveKey(cave) {
      return `${cave.sourceLang}:${cave.name}`
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
  min-height: 200px;
  gap: 18px;
  box-shadow: 0 20px 40px rgba(31, 41, 51, 0.1);
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

.empty,
.status,
.error {
  margin: 0;
}

.error {
  color: #c0392b;
}
</style>
