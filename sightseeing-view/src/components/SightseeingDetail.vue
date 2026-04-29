<template>
  <div v-if="place" class="detail-card">
    <h2>{{ place.name }}</h2> <p><strong>Adresse:</strong> {{ place.address }}</p>
    <p><strong>Öffnungszeiten:</strong> {{ place.opening_hours || 'Nicht verfügbar' }}</p>
    <a :href="place.website" target="_blank">Website besuchen</a> </div>
</template>

<script>
export default {
  props: ['place'] // Hier kommen die Daten von Lukas an 
}
</script>