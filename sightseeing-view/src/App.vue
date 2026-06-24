<template>
  <div id="app">
    <header class="app-header">
      <router-link class="brand" to="/">Sightseeing View</router-link>
      <nav class="app-nav" aria-label="Hauptnavigation">
        <router-link to="/">Start</router-link>
        <router-link v-if="!userId" to="/register">Registrieren</router-link>
        <router-link v-if="!userId" to="/login">Login</router-link>
        <router-link v-if="userId" to="/favorites">Favoriten</router-link>
        <router-link v-if="userId" to="/profile">Profil</router-link>
        <span v-if="displayName" class="user-greeting">Hallo, {{ displayName }}</span>
        <button v-if="displayName" type="button" class="logout-btn" @click="handleLogout">Logout</button>
      </nav>
    </header>
    <router-view />
  </div>
</template>

<script>
import { getCurrentUser, getUserProfile, logoutUser, supabase } from '@/services/services'

export default {
  name: 'App',
  data() {
    return {
      displayName: '',
      userId: '',
      authSubscription: null
    }
  },
  async created() {
    await this.syncSession()

    const { data } = supabase.auth.onAuthStateChange(() => {
      this.syncSession()
    })

    this.authSubscription = data?.subscription || null
  },
  beforeUnmount() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe()
    }
  },
  methods: {
    async syncSession() {
      const { user, displayName } = await getCurrentUser()

      this.userId = user?.id || ''

      if (!user) {
        this.displayName = ''
        return
      }

      const { profile } = await getUserProfile(user.id)
      this.displayName = profile?.username || displayName
    },
    async handleLogout() {
      await logoutUser()
      this.displayName = ''
      this.userId = ''
      this.$router.push({ name: 'login' })
    }
  }
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Space+Grotesk:wght@400;500;600;700&display=swap');

:root {
  --ink-900: #111214;
  --ink-700: #4a5568;
  --sand-50: #faf8f2;
  --sand-100: #f2ecdd;
  --sand-200: #e6dcc4;
  --teal-500: #2a9d8f;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: 'Space Grotesk', sans-serif;
  color: var(--ink-900);
  background:
    radial-gradient(circle at 12% 18%, rgba(42, 157, 143, 0.16), transparent 55%),
    radial-gradient(circle at 88% 15%, rgba(224, 122, 95, 0.18), transparent 50%),
    linear-gradient(135deg, var(--sand-50), var(--sand-100) 55%, var(--sand-200));
}

#app {
  min-height: 100vh;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 18px 7vw 0;
}

.brand {
  font-family: 'Fraunces', serif;
  font-size: 1.2rem;
  font-weight: 700;
}

.app-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  color: var(--ink-700);
  align-items: center;
}

.app-nav a.router-link-exact-active {
  color: var(--teal-500);
  font-weight: 700;
}

.user-greeting {
  color: var(--ink-900);
  font-weight: 700;
}

.logout-btn {
  border: 1px solid rgba(17, 18, 20, 0.12);
  background: rgba(255, 255, 255, 0.72);
  color: var(--ink-900);
  border-radius: 999px;
  padding: 8px 14px;
  font: inherit;
  cursor: pointer;
}

@media (max-width: 640px) {
  .app-header {
    flex-direction: column;
    align-items: flex-start;
  }
}

a {
  color: inherit;
  text-decoration: none;
}
</style>
