<template>
  <main class="auth-page">
    <section class="auth-card">
      <p class="auth-kicker">Supabase Auth</p>
      <h1>Login</h1>
      <p class="auth-text">Melde dich mit deinem Account an.</p>

      <p v-if="registered" class="auth-message success">Registrierung erfolgreich. Bitte jetzt einloggen.</p>

      <form class="auth-form" @submit.prevent="handleLogin">
        <label>
          E-Mail
          <input v-model.trim="email" type="email" autocomplete="email" placeholder="name@example.com" />
        </label>

        <label>
          Passwort
          <input v-model="password" type="password" autocomplete="current-password" placeholder="Passwort" />
        </label>

        <button type="submit" :disabled="isLoading">
          {{ isLoading ? 'Logge ein...' : 'Einloggen' }}
        </button>
      </form>

      <p v-if="error" class="auth-message error">{{ error }}</p>

      <p class="auth-switch">
        Noch keinen Account?
        <router-link to="/register">Jetzt registrieren</router-link>
      </p>
    </section>
  </main>
</template>

<script>
import { loginUser } from '@/services/services'

export default {
  name: 'LoginView',
  data() {
    return {
      email: '',
      password: '',
      isLoading: false,
      error: ''
    }
  },
  computed: {
    registered() {
      return this.$route.query.registered === '1'
    }
  },
  created() {
    if (this.$route.query.email) {
      this.email = String(this.$route.query.email)
    }
  },
  methods: {
    async handleLogin() {
      this.error = ''

      if (!this.email || !this.password) {
        this.error = 'Bitte E-Mail und Passwort ausfuellen.'
        return
      }

      this.isLoading = true

      try {
        const { data, error } = await loginUser({
          email: this.email,
          password: this.password
        })

        if (error) {
          const lowered = String(error.message || '').toLowerCase()
          if (lowered.includes('email not confirmed')) {
            this.error = 'Der Auth-Account in Supabase ist noch nicht bestaetigt. Eine Zeile in deiner eigenen users-Tabelle zaehlt dafuer nicht. Bitte pruefe Authentication > Users in Supabase.'
            return
          }

          throw error
        }

        const userName = data?.user?.user_metadata?.full_name || data?.user?.email || 'Benutzer'
        this.$router.push({
          name: 'home',
          query: {
            welcome: userName
          }
        })
      } catch (err) {
        this.error = err?.message || 'Login fehlgeschlagen.'
      } finally {
        this.isLoading = false
      }
    }
  }
}
</script>

<style scoped>
.auth-page {
  min-height: calc(100vh - 72px);
  display: grid;
  place-items: center;
  padding: 40px 7vw 64px;
}

.auth-card {
  width: min(100%, 520px);
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 28px 70px rgba(31, 41, 51, 0.16);
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.auth-kicker {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--teal-500);
  font-size: 0.75rem;
}

.auth-card h1 {
  margin: 0;
  font-family: 'Fraunces', serif;
  font-size: clamp(2rem, 2vw + 1.3rem, 2.8rem);
}

.auth-text,
.auth-switch {
  margin: 0;
  color: var(--ink-700);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.auth-form label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-weight: 600;
}

.auth-form input {
  border: 1px solid rgba(17, 18, 20, 0.12);
  border-radius: 14px;
  padding: 12px 14px;
  font: inherit;
  background: rgba(255, 255, 255, 0.95);
}

.auth-form button {
  border: none;
  border-radius: 14px;
  padding: 13px 18px;
  background: linear-gradient(140deg, #2a9d8f, #1f7a6e);
  color: #fff;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.auth-form button:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.auth-message {
  margin: 0;
  padding: 12px 14px;
  border-radius: 14px;
}

.auth-message.success {
  background: rgba(42, 157, 143, 0.12);
  color: #1f7a6e;
}

.auth-message.error {
  background: rgba(224, 122, 95, 0.12);
  color: #b24b35;
}
</style>