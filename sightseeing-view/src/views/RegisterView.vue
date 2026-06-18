<template>
  <main class="auth-page">
    <section class="auth-card">
      <p class="auth-kicker">Supabase Auth</p>
      <h1>Registrieren</h1>
      <p class="auth-text">Lege einen neuen Account mit E-Mail und Passwort an.</p>

      <form class="auth-form" @submit.prevent="handleRegister">
        <label>
          Name
          <input v-model.trim="fullName" type="text" autocomplete="name" placeholder="Dein Name" />
        </label>

        <label>
          E-Mail
          <input v-model.trim="email" type="email" autocomplete="email" placeholder="name@example.com" />
        </label>

        <label>
          Passwort
          <input v-model="password" type="password" autocomplete="new-password" placeholder="Mindestens 6 Zeichen" />
        </label>

        <button type="submit" :disabled="isLoading">
          {{ isLoading ? 'Registriere...' : 'Account erstellen' }}
        </button>
      </form>

      <p v-if="message" class="auth-message success">{{ message }}</p>
      <p v-if="error" class="auth-message error">{{ error }}</p>

      <p class="auth-switch">
        Schon registriert?
        <router-link to="/login">Zum Login</router-link>
      </p>
    </section>
  </main>
</template>

<script>
import { registerUser } from '@/services/services'

export default {
  name: 'RegisterView',
  data() {
    return {
      fullName: '',
      email: '',
      password: '',
      isLoading: false,
      error: '',
      message: ''
    }
  },
  methods: {
    async handleRegister() {
      this.error = ''
      this.message = ''

      if (!this.email || !this.password) {
        this.error = 'Bitte E-Mail und Passwort ausfuellen.'
        return
      }

      this.isLoading = true

      try {
        const { data, error } = await registerUser({
          email: this.email,
          password: this.password,
          fullName: this.fullName
        })

        if (error) {
          const lowered = String(error.message || '').toLowerCase()

          if (lowered.includes('already registered')) {
            this.error = 'Diese E-Mail ist bereits registriert. Bitte logge dich ein.'
            return
          }

          if (lowered.includes('rate limit exceeded')) {
            this.error = 'Zu viele Registrierungsversuche in kurzer Zeit. Bitte warte ein paar Minuten und versuche es dann erneut.'
            return
          }

          throw error
        }

        const needsConfirmation = !data?.session

        if (needsConfirmation) {
          this.message = 'Registrierung gespeichert. Bitte bestaetige die E-Mail im Supabase Auth-Postfach, dann kannst du dich einloggen. Ein Eintrag in einer eigenen users-Tabelle reicht dafuer nicht aus.'
          return
        }

        this.message = 'Registrierung erfolgreich. Du bist direkt eingeloggt.'
        this.$router.push({ name: 'home' })
      } catch (err) {
        this.error = err?.message || 'Registrierung fehlgeschlagen.'
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