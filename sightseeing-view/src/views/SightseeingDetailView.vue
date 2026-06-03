<template>
  <main class="detail-page">
    <section v-if="place.name" class="detail-view">
      <button type="button" class="back-btn" @click="goBack">Zurueck zur Liste</button>

      <header class="detail-head">
        <p class="detail-kicker">{{ country ? `Land: ${country}` : 'Detailansicht' }}</p>
        <h1>{{ place.name }}</h1>
        <p class="detail-category">{{ place.category }}</p>
      </header>

      <div class="detail-grid">
        <div class="detail-info">
          <article class="detail-card">
            <h2>Datenquelle</h2>
            <p>
              {{ place.lang === 'de' ? 'Deutsche Wikipedia' : 'Englische Wikipedia' }}
            </p>
          </article>

          <article class="detail-card">
            <h2>Online ansehen</h2>
            <a 
              :href="`https://${place.lang}.wikipedia.org/wiki/${encodeURIComponent(place.name)}`" 
              target="_blank" 
              rel="noreferrer"
              class="wiki-link"
            >
              Artikel auf Wikipedia lesen
            </a>
          </article>
        </div>
      </div>
    </section>

    <section v-else class="empty-state">
      <h1>Detailansicht nicht verfuegbar</h1>
      <p>Bitte oeffne eine Hoehle aus der Ergebnisliste.</p>
      <button type="button" @click="goToHome">Zur Startseite</button>
    </section>
  </main>
</template>

<script>
export default {
  name: 'SightseeingDetail', 
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
  methods: {
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
    }
  }
}
</script>

<style scoped>
.detail-page {
  min-height: 100vh;
  padding: 40px 7vw 60px;
}
.empty-state {
  max-width: 540px;
  margin: 10vh auto;
  background: #fff;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 24px 50px rgba(31, 41, 51, 0.12);
  text-align: center;
}
.empty-state h1 { margin-top: 0; }
.empty-state p { color: #52606d; }
.empty-state button {
  border: none;
  border-radius: 999px;
  padding: 10px 16px;
  background: #e07a5f;
  color: #fff;
  cursor: pointer;
  font-weight: 600;
}
.detail-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.back-btn {
  align-self: flex-start;
  border: none;
  background: #e07a5f;
  color: #fff;
  padding: 8px 16px;
  border-radius: 999px;
  cursor: pointer;
  font-weight: 600;
}
.detail-head h1 {
  font-family: 'Fraunces', serif;
  margin: 8px 0;
}
.detail-kicker {
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 0.8rem;
  color: #2a9d8f;
  margin: 0;
}
.detail-category {
  color: #52606d;
  margin: 0;
}
.detail-card {
  background: #fff;
  padding: 20px;
  border-radius: 18px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.05);
  margin-bottom: 16px;
}
.detail-card h2 {
  margin-top: 0;
  font-size: 1.2rem;
}
.wiki-link {
  color: #2a9d8f;
  font-weight: 600;
  text-decoration: underline;
}
</style>