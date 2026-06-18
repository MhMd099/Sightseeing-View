<template>
  <main class="account-page">
    <section class="account-card">
      <h1>Mein Profil</h1>

      <p v-if="!userId" class="account-message error">Bitte zuerst einloggen.</p>

      <template v-else>
        <div class="profile-summary">
          <p><strong>E-Mail:</strong> {{ email }}</p>
        </div>

        <div class="avatar-preview">
          <div v-if="avatarUrl && !imageLoadFailed" class="preview-frame">
            <img :src="avatarUrl" :alt="`${username || 'Profil'}-Bild`" @error="handleImageError" />
          </div>
          <p v-else class="preview-empty">Noch keine Bild-URL hinterlegt.</p>
        </div>

        <form class="profile-form" @submit.prevent="saveProfile">
          <label>
            Username
            <input v-model.trim="username" type="text" placeholder="Dein Anzeigename" />
          </label>

          <label>
            Avatar-URL
            <input v-model.trim="avatarUrl" type="url" placeholder="https://..." />
          </label>

          <label>
            Bio
            <textarea v-model.trim="bio" rows="4" placeholder="Kurze Beschreibung"></textarea>
          </label>

          <button type="submit" :disabled="isSaving || profileMissing">
            {{ isSaving ? 'Speichere...' : 'Profil speichern' }}
          </button>
        </form>

        <p v-if="message" class="account-message success">{{ message }}</p>
        <p v-if="error" class="account-message error">{{ error }}</p>
      </template>
    </section>
  </main>
</template>

<script>
import { getCurrentUser, getUserProfile, updateUserProfile } from '@/services/services'

export default {
  name: 'ProfileView',
  data() {
    return {
      userId: '',
      email: '',
      username: '',
      avatarUrl: '',
      imageLoadFailed: false,
      bio: '',
      isSaving: false,
      error: '',
      message: ''
    }
  },
  async created() {
    const { user, displayName } = await getCurrentUser()

    if (!user) {
      this.$router.push({ name: 'login' })
      return
    }

    this.userId = user.id
    this.email = user.email || ''
    this.username = displayName

    const { profile, error } = await getUserProfile(user.id)
    if (error) {
      this.error = error.message || 'Profil konnte nicht geladen werden.'
      return
    }

    if (!profile) {
      return
    }

    this.username = profile.username || this.username
    this.avatarUrl = profile.avatar_url || ''
    this.imageLoadFailed = false
    this.bio = profile.bio || ''
  },
  methods: {
    handleImageError() {
      this.imageLoadFailed = true
    },
    async saveProfile() {
      this.error = ''
      this.message = ''

      if (!this.userId) {
        return
      }

      this.isSaving = true

      try {
        const { profile, error } = await updateUserProfile(this.userId, {
          username: this.username,
          avatarUrl: this.avatarUrl,
          bio: this.bio
        })

        if (error) {
          throw error
        }

        if (!profile) {
          throw new Error('Profil konnte nicht gespeichert werden.')
        }

        this.message = 'Profil gespeichert.'
        this.profileMissing = false
      } catch (err) {
        this.error = err?.message || 'Profil konnte nicht gespeichert werden.'
      } finally {
        this.isSaving = false
      }
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
  display: none;
}

.account-card h1 {
  margin: 8px 0 10px;
  font-family: 'Fraunces', serif;
}

.profile-summary {
  display: grid;
  gap: 6px;
  margin-bottom: 18px;
  color: var(--ink-700);
}

.avatar-preview {
  display: grid;
  gap: 10px;
  margin-bottom: 18px;
}

.preview-frame {
  width: 180px;
  height: 180px;
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid rgba(17, 18, 20, 0.12);
  background: rgba(255, 255, 255, 0.95);
  display: grid;
  place-items: center;
}

.preview-frame img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.preview-empty {
  margin: 0;
  color: var(--ink-700);
}

.account-message {
  margin: 0 0 16px;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(42, 157, 143, 0.12);
  color: #1f7a6e;
}

.account-message.error {
  background: rgba(224, 122, 95, 0.12);
  color: #b24b35;
}

.profile-form {
  display: grid;
  gap: 14px;
}

.profile-form label {
  display: grid;
  gap: 8px;
  font-weight: 600;
}

.profile-form input,
.profile-form textarea {
  border: 1px solid rgba(17, 18, 20, 0.12);
  border-radius: 14px;
  padding: 12px 14px;
  font: inherit;
  background: rgba(255, 255, 255, 0.95);
}

.profile-form button {
  border: none;
  border-radius: 14px;
  padding: 13px 18px;
  background: linear-gradient(140deg, #2a9d8f, #1f7a6e);
  color: #fff;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.profile-form button:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}
</style>