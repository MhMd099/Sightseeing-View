<template>
  <section v-if="place" class="detail-view">
    <button type="button" class="back-btn" @click="goBack">Zurueck zur Liste</button>

    <header class="detail-head">
      <p class="detail-kicker">{{ city ? `Stadt: ${city}` : 'Detailansicht' }}</p>
      <h1>{{ place.name }}</h1>
      <p class="detail-category">{{ place.category }}</p>
    </header>

    <div class="detail-grid">
      <div class="detail-media">
        <img v-if="place.image" :src="place.image" :alt="`Bild von ${place.name}`">
        <div v-else class="image-placeholder">
          Kein Bild verfuegbar
        </div>
      </div>

      <div class="detail-info">
        <article class="detail-card">
          <h2>Adresse</h2>
          <p>{{ place.address }}</p>
        </article>

        <article class="detail-card" v-if="formattedCoords">
          <h2>Koordinaten</h2>
          <p>{{ formattedCoords }}</p>
        </article>

        <article class="detail-card" v-if="place.opening_hours">
          <h2>Oeffnungszeiten</h2>
          <p>{{ place.opening_hours }}</p>
        </article>

        <article class="detail-card" v-if="place.website">
          <h2>Website</h2>
          <a :href="place.website" target="_blank" rel="noreferrer">Offizielle Website ansehen</a>
        </article>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: 'SightseeingDetail',
  props: {
    place: {
      type: Object,
      required: true
    },
    city: {
      type: String,
      default: ''
    }
  },
  computed: {
    formattedCoords() {
      const hasLat = Number.isFinite(this.place.coords?.lat)
      const hasLon = Number.isFinite(this.place.coords?.lon)

      if (!hasLat || !hasLon) {
        return ''
      }

      return `${this.place.coords.lat.toFixed(4)}, ${this.place.coords.lon.toFixed(4)}`
    }
  },
  methods: {
    goBack() {
      this.$emit('go-back')
    }
  }
}
</script>

<style scoped>
.detail-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.back-btn {
  width: fit-content;
  border: none;
  border-radius: 999px;
  padding: 10px 16px;
  background: #111214;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}

.detail-head h1 {
  font-size: clamp(2rem, 2vw + 1.2rem, 3rem);
  margin: 8px 0;
}

.detail-kicker,
.detail-category {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-size: 0.72rem;
  color: #2a9d8f;
}

.detail-grid {
  display: grid;
  grid-template-columns: minmax(280px, 1.1fr) minmax(280px, 1fr);
  gap: 24px;
}

.detail-media,
.detail-card {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  box-shadow: 0 20px 45px rgba(31, 41, 51, 0.12);
}

.detail-media {
  min-height: 360px;
  overflow: hidden;
}

.detail-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.image-placeholder {
  height: 100%;
  min-height: 360px;
  background: linear-gradient(135deg, #d9efe9, #efe9d9);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #364152;
  font-weight: 600;
  padding: 12px;
  text-align: center;
}

.detail-info {
  display: grid;
  gap: 14px;
  align-content: start;
}

.detail-card {
  padding: 18px;
}

.detail-card h2 {
  margin: 0 0 10px;
  font-size: 1rem;
}

.detail-card p {
  margin: 0;
  color: #364152;
  line-height: 1.45;
}

.detail-card a {
  color: #e07a5f;
  font-weight: 600;
}

@media (max-width: 920px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>