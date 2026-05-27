<template>
  <main class="home">
    <section class="hero">
      <p class="hero-kicker">Stadt entdecken</p>
      <h1>Sehenswuerdigkeiten finden, ohne Umwege.</h1>
      <p class="hero-subtitle">
        Gib eine Stadt ein und wir zeigen dir die wichtigsten Highlights.
      </p>
      <CitySearch
        v-model="cityQuery"
        helper="Nach dem Suchen landest du in der Listenansicht."
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
      cityQuery: ''
    }
  },
  methods: {
    startSearch(city) {
      this.$router.push({ name: 'results', query: { city } })
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
