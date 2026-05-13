<template>
  <main class="results-page">
    <header class="results-hero">
      <div>
        <p class="hero-kicker">Listenansicht [cite: 7]</p>
        <h1>
          {{ cityLabel ? `Sehenswuerdigkeiten in ${cityLabel}` : 'Finde deine Stadt' }} [cite: 7]
        </h1>
        <p class="hero-subtitle">
          Hier landen die Ergebnisse nach deiner Suche. Pro Seite werden 10 Spots geladen. [cite: 7]
        </p>
      </div>
      <CitySearch
        v-model="cityQuery"
        button-text="Suche"
        helper="Enter druecken, um die Liste zu laden."
        @submit="handleSearch"
      /> </header>

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

    <div v-else>
      <div class="results-header">
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

      <div class="result-grid">
        <article 
          v-for="place in results" 
          :key="place.name" 
          class="result-card"
          @click="selectedPlace = place" 
          style="cursor: pointer;"
        >
          <div>
            <p class="result-tag">{{ place.category }}</p>
            <h3>{{ place.name }}</h3>
            <p class="result-address">{{ place.address }}</p>
          </div>
          <p class="result-meta">
            {{ place.website || 'Klicke für mehr Details.' }}
          </p>
        </article>
      </div>
    </div>
  </div>
</section>

    <div v-if="selectedPlace" class="detail-overlay" @click.self="selectedPlace = null">
      <SightseeingDetail 
        :place="selectedPlace" 
        @close-detail="selectedPlace = null" 
      /> </div>
  </main>
</template>

<script>
import CitySearch from '@/components/CitySearch.vue' [cite: 7, 10]
import SightseeingDetail from '@/components/SightseeingDetail.vue' // Deine Komponente importiert 
import { fetchSightseeing, geocodeCity, mapGeoapifyPlace } from '@/services/geoapify' [cite: 7, 8]

export default {
  name: 'SearchResultsView',
  components: {
    CitySearch,
    SightseeingDetail // Deine Komponente registriert [cite: 5, 11]
  },
  data() {
    return {
      cityQuery: '', [cite: 7]
      cityLabel: '', [cite: 7]
      lastCity: '', [cite: 7]
      lastLocation: null, [cite: 7]
      results: [], [cite: 7]
      page: 1, [cite: 7]
      limit: 10, [cite: 7]
      hasNextPage: false, [cite: 7]
      isLoading: false, [cite: 7]
      error: '', [cite: 7]
      hasSearched: false, [cite: 7]
      selectedPlace: null // Hinzugefügt: Speichert die angeklickte Sehenswürdigkeit 
    }
  },
  watch: {
    '$route.query.city': {
      immediate: true,
      handler(newCity) {
        if (!newCity) {
          this.hasSearched = false [cite: 7]
          this.results = [] [cite: 7]
          this.error = '' [cite: 7]
          return
        }

        const normalizedCity = String(newCity) [cite: 7]
        this.cityQuery = normalizedCity [cite: 7]
        this.handleSearch(normalizedCity) [cite: 7]
      }
    }
  },
  methods: {
    handleSearch(city) {
      const trimmed = city.trim() [cite: 7]
      if (!trimmed) return [cite: 7]

      if (trimmed !== this.lastCity) {
        this.page = 1 [cite: 7]
        this.lastLocation = null [cite: 7]
      }

      if (this.$route.query.city !== trimmed) {
        this.$router.push({ name: 'results', query: { city: trimmed } }) [cite: 7]
      }

      this.fetchResults(trimmed) [cite: 7]
    },
    async fetchResults(city) {
      this.isLoading = true [cite: 7]
      this.error = '' [cite: 7]
      this.hasSearched = true [cite: 7]

      try {
        if (!this.lastLocation || this.lastCity !== city) {
          this.lastLocation = await geocodeCity(city) [cite: 7, 8]
          this.cityLabel = this.lastLocation.label [cite: 7]
          this.lastCity = city [cite: 7]
        }

        const offset = (this.page - 1) * this.limit [cite: 7]
        const payload = await fetchSightseeing({
          lat: this.lastLocation.lat,
          lon: this.lastLocation.lon,
          limit: this.limit,
          offset
        }) [cite: 7, 8]

        const features = payload.features || [] [cite: 7]
        this.results = features.map((feature) => mapGeoapifyPlace(feature)) [cite: 7, 8]
        this.hasNextPage = features.length === this.limit [cite: 7]
      } catch (err) {
        this.error = err.message || 'Etwas ist schiefgelaufen.' [cite: 7]
        this.results = [] [cite: 7]
        this.hasNextPage = false [cite: 7]
      } finally {
        this.isLoading = false [cite: 7]
      }
    },
    changePage(direction) {
      const nextPage = this.page + direction [cite: 7]
      if (nextPage < 1 || (direction > 0 && !this.hasNextPage)) return [cite: 7]

      this.page = nextPage [cite: 7]
      if (this.lastCity) this.fetchResults(this.lastCity) [cite: 7]
    }
  }
}
</script>

<style scoped>
/* Bestehende Styles übernommen [cite: 7] */
.results-page { padding: 48px 7vw 64px; display: flex; flex-direction: column; gap: 40px; }
.results-hero { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; align-items: center; }
.hero-kicker { text-transform: uppercase; letter-spacing: 0.2em; font-size: 0.75rem; color: #2a9d8f; margin: 0; }
.results-hero h1 { font-size: clamp(2rem, 2vw + 1.5rem, 2.8rem); margin: 10px 0 12px; }
.hero-subtitle { margin: 0; color: #5f6c7b; }
.results-content { display: flex; flex-direction: column; gap: 20px; }
.results-header { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px; }
.results-header h2 { margin: 0; font-size: 1.4rem; }
.pagination { display: flex; align-items: center; gap: 12px; background: rgba(255, 255, 255, 0.7); padding: 8px 14px; border-radius: 999px; }
.pagination button { border: none; background: none; color: #e07a5f; font-weight: 600; cursor: pointer; }
.pagination button:disabled { opacity: 0.5; cursor: not-allowed; }
.result-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; }
.result-card { background: #fff; border-radius: 18px; padding: 18px; display: flex; flex-direction: column; gap: 16px; box-shadow: 0 20px 40px rgba(31, 41, 51, 0.1); transition: transform 0.2s; }
.result-card:hover { transform: translateY(-5px); }
.result-tag { text-transform: uppercase; letter-spacing: 0.2em; font-size: 0.7rem; color: #2a9d8f; margin: 0; }
.result-address { margin: 8px 0 0; color: #52606d; }
.result-meta { margin: 0; font-size: 0.85rem; color: #7b8794; }
.status { color: #52606d; }
.error { color: #b42318; background: #ffe4e8; padding: 12px 14px; border-radius: 12px; }
.empty { color: #52606d; }

/* NEU: Styling für das Detail-Overlay  */
.detail-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

@media (max-width: 640px) { .pagination { width: 100%; justify-content: space-between; } }
</style>