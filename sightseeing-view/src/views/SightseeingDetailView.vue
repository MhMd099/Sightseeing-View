<template>
  <main class="detail-page">
    <section v-if="place.name" class="detail-shell">
      <button type="button" class="back-btn" @click="goBack">Zurueck zur Liste</button>

      <article class="hero-card">
        <div class="hero-text">
          <p class="eyebrow">Wikipedia Detailseite</p>
          <h1>{{ place.name }}</h1>
          <p class="hero-subtitle">
            {{ details.description || country || place.category || 'Detaillierte Ansicht zur Hoehle.' }}
          </p>

          <div class="hero-chips">
            <span class="info-chip">{{ place.category }}</span>
            <span class="info-chip">{{ place.lang === 'de' ? 'Deutsche Wikipedia' : 'Englische Wikipedia' }}</span>
            <span v-if="country" class="info-chip">{{ country }}</span>
          </div>

          <div class="hero-actions">
            <button v-if="userId" type="button" class="favorite-btn" @click="toggleFavoriteItem" :disabled="favoriteBusy">
              {{ favoriteBusy ? 'Speichere...' : isFavorite ? 'Favorit entfernen' : 'Als Favorit speichern' }}
            </button>
            <button v-if="!userId" type="button" class="favorite-btn" @click="goToLogin">Login</button>
            <a :href="details.pageUrl" target="_blank" rel="noreferrer" class="wiki-link">Wikipedia oeffnen</a>
          </div>

          <p v-if="favoriteMessage" class="detail-note success">{{ favoriteMessage }}</p>
          <p v-if="favoriteError" class="detail-note error">{{ favoriteError }}</p>
        </div>

        <div class="hero-image-wrap">
          <img
            v-if="details.image"
            :src="details.image"
            :alt="place.name"
            class="hero-image"
          />
          <div v-else class="hero-image hero-image--placeholder">
            <span>Kein Bild gefunden</span>
          </div>
        </div>
      </article>

      <section class="detail-grid">
        <article class="detail-card detail-summary">
          <h2>Beschreibung</h2>
          <p v-if="extractLoading">Lädt...</p>
          <p v-else-if="details.extract">{{ details.extract }}</p>
          <p v-else>Für diese Höhle ist gerade kein kurzer Wikipedia-Text verfügbar.</p>
        </article>

        <article class="detail-card">
          <h2>Schnellinfos</h2>
          <ul class="facts-list">
            <li><span>Titel</span><strong>{{ details.title || place.name }}</strong></li>
            <li><span>Land</span><strong>{{ country || 'Unbekannt' }}</strong></li>
            <li><span>Sprache</span><strong>{{ place.lang === 'de' ? 'Deutsch' : 'Englisch' }}</strong></li>
            <li><span>Quelle</span><strong>Wikipedia</strong></li>
          </ul>
        </article>

      </section>
    </section>

    <section v-else class="empty-state">
      <h1>Detailansicht nicht verfuegbar</h1>
      <p>Bitte oeffne eine Hoehle aus der Ergebnisliste.</p>
      <button type="button" @click="goToHome">Zur Startseite</button>
    </section>
  </main>
</template>

<script>
import { getCurrentUser, getFavoriteByCaveName, toggleFavorite } from '@/services/services'
import { fetchWikipediaPageDetails } from '@/services/wikipedia'

export default {
  name: 'SightseeingDetail',
  data() {
    return {
      userId: '',
      isFavorite: false,
      favoriteBusy: false,
      favoriteMessage: '',
      favoriteError: '',
      extractLoading: false,
      details: {
        title: '',
        extract: '',
        description: '',
        image: '',
        pageUrl: ''
      }
    }
  },
  computed: {
    place() {
      const query = this.$route.query
      return {
        name: query.name || '',
        category: query.category || 'Caves',
        lang: query.lang || 'en'
      }
    },
    country() {
      return this.$route.query.country || ''
    }
  },
  async created() {
    await this.loadDetail()
  },
  watch: {
    '$route.query.name': {
      immediate: false,
      handler() {
        this.loadDetail()
      }
    }
  },
  methods: {
    async loadDetail() {
      this.extractLoading = true
      this.favoriteMessage = ''
      this.favoriteError = ''

      const { user } = await getCurrentUser()
      this.userId = user?.id || ''

      if (!this.userId || !this.place.name) {
        this.isFavorite = false
      } else {
        const { favorite } = await getFavoriteByCaveName(this.userId, this.place.name)
        this.isFavorite = Boolean(favorite)
      }

      this.details = await fetchWikipediaPageDetails(this.place.lang, this.place.name)
      this.extractLoading = false
    },
    async toggleFavoriteItem() {
      if (!this.userId) {
        this.$router.push({ name: 'login' })
        return
      }

      this.favoriteBusy = true
      this.favoriteError = ''
      this.favoriteMessage = ''

      try {
        const { isFavorite, error } = await toggleFavorite(this.userId, this.place.name)
        if (error) {
          throw error
        }

        this.isFavorite = Boolean(isFavorite)
        this.favoriteMessage = this.isFavorite ? 'Als Favorit gespeichert.' : 'Favorit entfernt.'
      } catch (err) {
        this.favoriteError = err?.message || 'Favorit konnte nicht gespeichert werden.'
      } finally {
        this.favoriteBusy = false
      }
    },
    goBack() {
      this.$router.push({
        name: 'results',
        query: {
          country: this.country
        }
      })
    },
    goToHome() {
      this.$router.push({ name: 'home' })
    },
    goToLogin() {
      this.$router.push({ name: 'login' })
    }
  }
}
</script>

<style scoped>
.detail-page {
  min-height: 100vh;
  padding: 40px 7vw 60px;
}

.detail-shell {
  max-width: 1160px;
  margin: 0 auto;
  display: grid;
  gap: 24px;
}

.back-btn,
.favorite-btn,
.empty-state button {
  border: none;
  border-radius: 999px;
  padding: 10px 16px;
  cursor: pointer;
  font-weight: 700;
}

.back-btn,
.empty-state button {
  background: #e07a5f;
  color: #fff;
  align-self: flex-start;
}

.hero-card,
.detail-card,
.empty-state {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  box-shadow: 0 24px 60px rgba(31, 41, 51, 0.12);
}

.hero-card {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(280px, 0.9fr);
  gap: 24px;
  padding: 24px;
  align-items: stretch;
}

.eyebrow {
  margin: 0 0 10px;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--teal-500);
  font-size: 0.72rem;
}

.hero-text h1 {
  margin: 0;
  font-family: 'Fraunces', serif;
  font-size: clamp(2.2rem, 3vw + 1rem, 4rem);
  line-height: 1.05;
}

.hero-subtitle {
  margin: 14px 0 0;
  color: var(--ink-700);
  font-size: 1.05rem;
  line-height: 1.6;
}

.hero-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.info-chip {
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(42, 157, 143, 0.12);
  color: #1f7a6e;
  font-weight: 700;
  font-size: 0.88rem;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 22px;
}

.favorite-btn {
  background: linear-gradient(140deg, #2a9d8f, #1f7a6e);
  color: #fff;
}

.favorite-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.wiki-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 10px 16px;
  border: 1px solid rgba(17, 18, 20, 0.12);
  background: rgba(255, 255, 255, 0.72);
  color: var(--ink-900);
  font-weight: 700;
}

.hero-image-wrap {
  min-height: 320px;
}

.hero-image {
  width: 100%;
  height: 100%;
  min-height: 320px;
  object-fit: cover;
  border-radius: 20px;
  display: block;
}

.hero-image--placeholder {
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, rgba(42, 157, 143, 0.2), rgba(224, 122, 95, 0.18));
  color: var(--ink-700);
  font-weight: 700;
}

.detail-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(280px, 0.7fr);
  gap: 20px;
}

.detail-card {
  padding: 22px;
}

.detail-summary {
  min-height: 100%;
}

.detail-card h2 {
  margin: 0 0 14px;
  font-family: 'Fraunces', serif;
}

.detail-card p {
  line-height: 1.7;
  color: var(--ink-700);
}

.facts-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 12px;
}

.facts-list li {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(17, 18, 20, 0.08);
}

.facts-list li:last-child {
  border-bottom: none;
}

.facts-list span {
  color: var(--ink-700);
}

.facts-list strong {
  color: var(--ink-900);
  text-align: right;
}

.detail-note {
  margin: 12px 0 0;
}

.detail-note.success {
  color: #1f7a6e;
}

.detail-note.error {
  color: #b24b35;
}

.empty-state {
  max-width: 540px;
  margin: 10vh auto;
  padding: 30px;
  text-align: center;
}

.empty-state h1 {
  margin-top: 0;
  font-family: 'Fraunces', serif;
}

.empty-state p {
  color: var(--ink-700);
}

@media (max-width: 900px) {
  .hero-card,
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
