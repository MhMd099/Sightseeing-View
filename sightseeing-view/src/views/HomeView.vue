<template>
  <main class="home">
    <section v-if="userId" class="feed-panel">
      <div class="panel-head feed-head">
        <div>
          <h2>Community Feed</h2>
          <p>Neue Favoriten erscheinen live für eingeloggte Nutzer.</p>
        </div>
        <span class="feed-status" :class="{ live: feedLive }">{{ feedLive ? 'Live' : 'Verbinde...' }}</span>
      </div>

      <p v-if="feedError" class="compare-error">{{ feedError }}</p>
      <p v-else-if="feedLoading" class="feed-empty">Feed wird geladen...</p>
      <p v-else-if="feedItems.length === 0" class="feed-empty">Noch keine Aktivitäten vorhanden.</p>

      <div v-else class="feed-list">
        <article v-for="item in feedItems" :key="item.id" class="feed-item">
          <div>
            <p class="feed-user">{{ item.user_name || 'Jemand' }}</p>
            <h3>{{ item.cave_name }}</h3>
            <p class="feed-message">{{ item.message }}</p>
          </div>
          <time :datetime="item.created_at">{{ formatFeedTime(item.created_at) }}</time>
        </article>
      </div>
    </section>

    <section class="mode-switcher">
      <button type="button" class="mode-card" :class="{ active: mode === 'search' }" @click="mode = 'search'">
        <span class="mode-label">Modus 1</span>
        <strong>Suchen</strong>
        <span>Höhlen nach einem Land anzeigen.</span>
      </button>

      <button type="button" class="mode-card" :class="{ active: mode === 'compare' }" @click="mode = 'compare'">
        <span class="mode-label">Modus 2</span>
        <strong>Vergleichen</strong>
        <span>Zwei Länder direkt gegenüberstellen.</span>
      </button>
    </section>

    <section v-if="mode === 'search'" class="panel">
      <div class="panel-head">
        <h1>Höhlen suchen</h1>
      </div>

      <CitySearch
        v-model="countryQuery"
        input-id="search-country"
        placeholder="Land"
        :suggestions="recentSearches"
        @submit="startSearch"
      />

      <div v-if="recentSearches.length" class="history-list">
        <button
          v-for="item in recentSearches"
          :key="item"
          type="button"
          class="history-chip"
          @click="startSearch(item)"
        >
          {{ item }}
        </button>
      </div>
    </section>

    <section v-else class="panel">
      <div class="panel-head">
        <h1>Höhlen vergleichen</h1>
      </div>

      <form class="compare-form" @submit.prevent="compareCountries">
        <CitySearch
          v-model="compareCountryA"
          input-id="compare-country-a"
          placeholder="Land A"
          :suggestions="recentSearches"
          :as-form="false"
          :show-button="false"
        />

        <CitySearch
          v-model="compareCountryB"
          input-id="compare-country-b"
          placeholder="Land B"
          :suggestions="recentSearches"
          :as-form="false"
          :show-button="false"
        />

        <button type="submit" class="compare-action" :disabled="compareLoading">
          {{ compareLoading ? 'Vergleiche...' : 'Vergleichen' }}
        </button>
      </form>

      <p v-if="compareError" class="compare-error">{{ compareError }}</p>

      <div v-if="compareResult" class="compare-results">
        <article class="compare-result-card">
          <p class="result-country">{{ compareResult.countryA }}</p>
          <h2>{{ compareResult.bestA?.name || 'Kein Treffer' }}</h2>
          <p class="compare-meta">{{ compareResult.bestA?.metricLabel || 'kein Wert gefunden' }}</p>
          <p class="compare-extract">{{ compareResult.bestA?.extract || '' }}</p>
        </article>

        <article class="compare-result-card">
          <p class="result-country">{{ compareResult.countryB }}</p>
          <h2>{{ compareResult.bestB?.name || 'Kein Treffer' }}</h2>
          <p class="compare-meta">{{ compareResult.bestB?.metricLabel || 'kein Wert gefunden' }}</p>
          <p class="compare-extract">{{ compareResult.bestB?.extract || '' }}</p>
        </article>
      </div>
    </section>
  </main>
</template>

<script>
import CitySearch from '@/components/CitySearch.vue'
import { compareCaves } from '@/services/wikipedia'
import { getActivityFeed, getCurrentUser, supabase } from '@/services/services'

export default {
  name: 'HomeView',
  components: {
    CitySearch
  },
  data() {
    return {
      mode: 'search',
      countryQuery: '',
      compareCountryA: '',
      compareCountryB: '',
      recentSearches: [],
      compareLoading: false,
      compareError: '',
      compareResult: null,
      userId: '',
      feedItems: [],
      feedLoading: false,
      feedError: '',
      feedLive: false,
      feedChannel: null
    }
  },
  async created() {
    this.loadHistory()
    await this.syncUserAndFeed()
  },
  beforeUnmount() {
    this.stopFeedSubscription()
  },
  methods: {
    async syncUserAndFeed() {
      const { user } = await getCurrentUser()
      this.userId = user?.id || ''

      if (!this.userId) {
        this.stopFeedSubscription()
        return
      }

      await this.loadFeed()
      this.startFeedSubscription()
    },
    loadHistory() {
      try {
        const history = JSON.parse(localStorage.getItem('history') || '[]')
        this.recentSearches = Array.isArray(history) ? history.filter(Boolean).slice(0, 5) : []
      } catch {
        this.recentSearches = []
      }
    },
    saveHistory(country) {
      const normalized = String(country || '').trim()
      if (!normalized) {
        return
      }

      let history = []
      try {
        history = JSON.parse(localStorage.getItem('history') || '[]')
      } catch {
        history = []
      }

      const nextHistory = [
        normalized,
        ...history.filter((item) => String(item || '').trim().toLowerCase() !== normalized.toLowerCase())
      ].slice(0, 5)

      localStorage.setItem('history', JSON.stringify(nextHistory))
      this.recentSearches = nextHistory
    },
    startSearch(country) {
      const trimmed = String(country || '').trim()
      if (!trimmed) {
        return
      }

      this.saveHistory(trimmed)
      this.$router.push({ name: 'results', query: { country: trimmed } })
    },
    async compareCountries() {
      this.compareError = ''
      this.compareResult = null

      const countryA = this.compareCountryA.trim()
      const countryB = this.compareCountryB.trim()

      if (!countryA || !countryB) {
        this.compareError = 'Beide Länder eingeben.'
        return
      }

      this.compareLoading = true

      try {
        this.compareResult = await compareCaves(countryA, countryB)
      } catch (error) {
        this.compareError = error?.message || 'Vergleich nicht möglich.'
      } finally {
        this.compareLoading = false
      }
    },
    async loadFeed() {
      this.feedLoading = true
      this.feedError = ''

      try {
        const { feed, error } = await getActivityFeed(15)
        if (error) {
          throw error
        }

        this.feedItems = feed
      } catch (error) {
        this.feedError = error?.message || 'Feed konnte nicht geladen werden.'
      } finally {
        this.feedLoading = false
      }
    },
    startFeedSubscription() {
      this.stopFeedSubscription()

      const channel = supabase
        .channel('home-activity-feed')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'activity_feed'
          },
          (payload) => {
            const item = payload?.new
            if (!item) {
              return
            }

            this.feedItems = [item, ...this.feedItems].slice(0, 15)
          }
        )
        .subscribe((status) => {
          this.feedLive = status === 'SUBSCRIBED'
        })

      this.feedChannel = channel
    },
    stopFeedSubscription() {
      if (this.feedChannel) {
        supabase.removeChannel(this.feedChannel)
        this.feedChannel = null
      }

      this.feedLive = false
    },
    formatFeedTime(value) {
      if (!value) {
        return '-'
      }

      return new Date(value).toLocaleString('de-DE', {
        dateStyle: 'short',
        timeStyle: 'short'
      })
    }
  }
}
</script>

<style scoped>
.home {
  min-height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
  gap: 24px;
  align-items: center;
  padding: 60px 7vw 72px;
}

.mode-switcher {
  width: min(100%, 980px);
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.mode-card {
  border: 1px solid rgba(17, 18, 20, 0.08);
  border-radius: 24px;
  padding: 18px;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(10px);
  box-shadow: 0 18px 44px rgba(31, 41, 51, 0.08);
  display: grid;
  gap: 8px;
  text-align: left;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.mode-card.active {
  border-color: rgba(42, 157, 143, 0.45);
  box-shadow: 0 22px 54px rgba(42, 157, 143, 0.16);
  transform: translateY(-2px);
}

.mode-label {
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-size: 0.72rem;
  color: var(--teal-500);
}

.mode-card strong,
.panel-head h1,
.feed-head h2 {
  font-family: 'Fraunces', serif;
}

.panel,
.feed-panel {
  width: min(100%, 980px);
  display: grid;
  gap: 18px;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(10px);
  border-radius: 28px;
  padding: 28px;
  box-shadow: 0 24px 60px rgba(31, 41, 51, 0.12);
}

.panel-head h1 {
  margin: 0;
  font-size: clamp(2rem, 2vw + 1.5rem, 2.8rem);
}

.history-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.history-chip,
.compare-action {
  border: none;
  border-radius: 999px;
  padding: 12px 16px;
  font: inherit;
  cursor: pointer;
}

.history-chip {
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 12px 24px rgba(31, 41, 51, 0.08);
}

.compare-form {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  align-items: start;
}

.compare-action {
  align-self: stretch;
  background: linear-gradient(140deg, #2a9d8f, #1f7a6e);
  color: #fff;
  font-weight: 700;
}

.compare-action:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.compare-error {
  margin: 0;
  color: #b24b35;
}

.compare-results {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
}

.compare-result-card {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 18px;
  padding: 18px;
  box-shadow: 0 16px 36px rgba(31, 41, 51, 0.08);
}

.result-country {
  margin: 0 0 8px;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font-size: 0.72rem;
  color: var(--teal-500);
}

.compare-result-card h2 {
  margin: 0 0 8px;
  font-size: 1.1rem;
}

.compare-meta,
.compare-extract {
  margin: 0;
  color: var(--ink-700);
}

.compare-extract {
  margin-top: 8px;
  line-height: 1.5;
}

.feed-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
}

.feed-head h2 {
  margin: 0;
  font-size: clamp(1.4rem, 1vw + 1.1rem, 2rem);
}

.feed-head p {
  margin: 4px 0 0;
  color: var(--ink-700);
}

.feed-status {
  border-radius: 999px;
  padding: 8px 12px;
  background: rgba(224, 122, 95, 0.12);
  color: #b24b35;
  font-weight: 700;
  white-space: nowrap;
}

.feed-status.live {
  background: rgba(42, 157, 143, 0.14);
  color: #1f7a6e;
}

.feed-empty {
  margin: 0;
  color: var(--ink-700);
}

.feed-list {
  display: grid;
  gap: 12px;
}

.feed-item {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 18px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 14px 28px rgba(31, 41, 51, 0.08);
}

.feed-user {
  margin: 0 0 6px;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font-size: 0.72rem;
  color: var(--teal-500);
}

.feed-item h3 {
  margin: 0 0 6px;
  font-size: 1.05rem;
}

.feed-message {
  margin: 0;
  color: var(--ink-700);
}

.feed-item time {
  color: var(--ink-700);
  white-space: nowrap;
}

@media (max-width: 640px) {
  .mode-switcher,
  .compare-form {
    grid-template-columns: 1fr;
  }

  .feed-head,
  .feed-item {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
