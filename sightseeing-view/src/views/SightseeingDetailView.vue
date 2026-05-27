<template>
  <main class="detail-page">
    <SightseeingDetail
      v-if="place.name"
      :place="place"
      :city="city"
      @go-back="goBack"
    />

    <section v-else class="empty-state">
      <h1>Detailansicht nicht verfuegbar</h1>
      <p>Bitte oeffne eine Sehenswuerdigkeit aus der Ergebnisliste.</p>
      <button type="button" @click="goToResults">Zur Ergebnisliste</button>
    </section>
  </main>
</template>

<script>
import SightseeingDetail from '@/components/SightseeingDetail.vue'

export default {
  name: 'SightseeingDetailView',
  components: {
    SightseeingDetail
  },
  computed: {
    place() {
      const query = this.$route.query
      return {
        name: query.name || '',
        category: query.category || 'tourism',
        address: query.address || 'Adresse unbekannt',
        website: query.website || null,
        opening_hours: query.opening || null,
        image: query.image || null,
        coords: {
          lat: query.lat ? Number(query.lat) : null,
          lon: query.lon ? Number(query.lon) : null
        }
      }
    },
    city() {
      return this.$route.query.city || ''
    }
  },
  methods: {
    goBack() {
      this.$router.push({
        name: 'results',
        query: {
          city: this.city
        }
      })
    },
    goToResults() {
      if (this.city) {
        this.goBack()
        return
      }

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

.empty-state h1 {
  margin-top: 0;
}

.empty-state p {
  color: #52606d;
}

.empty-state button {
  border: none;
  border-radius: 999px;
  padding: 10px 16px;
  background: #e07a5f;
  color: #fff;
  cursor: pointer;
  font-weight: 600;
}
</style>
