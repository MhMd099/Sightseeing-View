<template>
  <main class="account-page">
    <section class="account-card">
      <p class="account-kicker">Supabase Favorites</p>
      <h1>Meine Favoriten</h1>

      <p v-if="!userId" class="account-message error">Bitte zuerst einloggen.</p>
      <template v-else>
        <p v-if="isLoading" class="account-message">Lade Favoriten...</p>
        <p v-else-if="error" class="account-message error">{{ error }}</p>
        <p v-else-if="favorites.length === 0" class="account-message success">
          Noch keine Favoriten gespeichert.
        </p>

        <div v-else class="favorite-list">
          <article v-for="favorite in favorites" :key="favorite.id" class="favorite-item">
            <div>
              <h2>{{ favorite.cave_name }}</h2>
              <p>Gespeichert am {{ formatDate(favorite.created_at) }}</p>
            </div>
            <button type="button" @click="removeFavoriteItem(favorite.cave_name)">Entfernen</button>
          </article>
        </div>
      </template>
    </section>
  </main>
</template>

<script>
import { getCurrentUser, getUserFavorites, removeFavorite } from '@/services/services'

export default {
  name: 'FavoritesView',
  data() {
    return {
      userId: '',
      favorites: [],
      isLoading: false,
      error: ''
    }
  },
  async created() {
    const { user } = await getCurrentUser()

    if (!user) {
      this.$router.push({ name: 'login' })
      return
    }

    this.userId = user.id
    await this.loadFavorites()
  },
  methods: {
    async loadFavorites() {
      this.isLoading = true
      this.error = ''

      try {
        const { favorites, error } = await getUserFavorites(this.userId)
        if (error) {
          throw error
        }

        this.favorites = favorites
      } catch (err) {
        this.error = err?.message || 'Favoriten konnten nicht geladen werden.'
      } finally {
        this.isLoading = false
      }
    },
    async removeFavoriteItem(caveName) {
      this.error = ''

      try {
        const { error } = await removeFavorite(this.userId, caveName)
        if (error) {
          throw error
        }

        this.favorites = this.favorites.filter((item) => item.cave_name !== caveName)
      } catch (err) {
        this.error = err?.message || 'Favorit konnte nicht geloescht werden.'
      }
    },
    formatDate(value) {
      if (!value) {
        return '-'
      }

      return new Date(value).toLocaleString('de-DE')
    }
  }
}
</script>

<style scoped>
.account-page {
  padding: 48px 7vw 64px;
}

.account-card {
  max-width: 900px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 28px 70px rgba(31, 41, 51, 0.16);
}

.account-kicker {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--teal-500);
  font-size: 0.75rem;
}

.account-card h1 {
  margin: 8px 0 10px;
  font-family: 'Fraunces', serif;
}

.account-message {
  margin: 0;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(42, 157, 143, 0.12);
  color: #1f7a6e;
}

.account-message.error {
  background: rgba(224, 122, 95, 0.12);
  color: #b24b35;
}

.favorite-list {
  display: grid;
  gap: 14px;
}

.favorite-item {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  border: 1px solid rgba(17, 18, 20, 0.08);
  border-radius: 18px;
  padding: 18px;
  background: rgba(255, 255, 255, 0.9);
}

.favorite-item h2 {
  margin: 0 0 6px;
  font-size: 1.1rem;
}

.favorite-item p {
  margin: 0;
  color: var(--ink-700);
}

.favorite-item button {
  border: none;
  border-radius: 999px;
  padding: 10px 14px;
  background: #e07a5f;
  color: #fff;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

@media (max-width: 640px) {
  .favorite-item {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>