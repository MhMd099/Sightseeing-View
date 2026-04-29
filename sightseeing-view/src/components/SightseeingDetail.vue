<template>
  <div v-if="place" class="detail-view">
    <button @click="goBack">⬅ Zurück</button>

    <h2>{{ place.name }}</h2>
    
    <img v-if="place.image" :src="place.image" alt="Bild der Sehenswürdigkeit" style="width:100%; max-width:400px;">
    <div v-else class="image-placeholder">Kein Bild verfügbar</div>

    <div class="info-grid">
      <p><strong>Kategorie:</strong> {{ place.category }}</p>
      <p><strong>Adresse:</strong> {{ place.address }}</p>
      
      <p v-if="place.website">
        <a :href="place.website" target="_blank">Offizielle Website</a>
      </p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SightseeingDetail',
  props: {
    place: Object // Validierung: Wir erwarten ein Objekt 
  },
  methods: {
    goBack() {
      // Wir feuern ein Event nach oben (wie ein C# Event)
      this.$emit('close-detail'); 



    }
  }
}
</script>

<style scoped>
.detail-view {
  border: 1px solid #ccc;
  padding: 20px;
  border-radius: 8px;
  background-color: #f9f9f9;
}
.image-placeholder {
  height: 200px;
  background: #eee;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>