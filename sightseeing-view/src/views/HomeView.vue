<template>
  <main class="home">
    <section class="hero">
      <p class="hero-kicker">Hoehlen weltweit</p>
      <h1>Hoehlen nach Land anzeigen.</h1>
      <p class="hero-subtitle">
        Gib ein Land ein und wir lesen die Wikipedia-Kategorie mit Hoehlen aus.
      </p>
      <CitySearch
        v-model="countryQuery"
        placeholder="z.B. Österreich, Venezuela, Kanada"
        helper="Nach dem Suchen landest du direkt in der Hoehlenliste."
        @submit="startSearch"
      />
    </section>
  </main>
</template>

<script>

import CitySearch from '@/components/CitySearch.vue'

export default {
  name: 'HomeView',
  components: {
    CitySearch
  },
  data() {
    return {
      countryQuery: ''
    }
  },
  methods: {
    startSearch(country) {
      this.$router.push({ name: 'results', query: { country } })
    }
  }
}
</script>

<style scoped>
.home {
  min-height: calc(100vh - 40px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 64px 7vw;
}

.hero {
  max-width: 640px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 18px;
  text-align: center;
  align-items: center;
}

.hero-kicker {
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-size: 0.75rem;
  color: var(--teal-500);
  margin: 0;
}

.hero h1 {
  font-family: 'Fraunces', serif;
  font-size: clamp(2.4rem, 2vw + 1.8rem, 3.4rem);
  margin: 0;
}

.hero-subtitle {
  margin: 0;
  color: var(--ink-700);
}
</style>
