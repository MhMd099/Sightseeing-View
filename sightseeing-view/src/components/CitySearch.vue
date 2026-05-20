<template>
  <form class="city-search" @submit.prevent="submit">
    <label class="sr-only" for="city-input">Stadt</label>
    <div class="city-search__field">
      <input
        id="city-input"
        v-model="internalValue"
        type="text"
        :placeholder="placeholder"
        autocomplete="off"
      />
      <button type="submit" :disabled="!internalValue.trim()">
        {{ buttonText }}
      </button>
    </div>
    <p v-if="helper" class="city-search__helper">{{ helper }}</p>
  </form>
</template>

<script>
export default {
  name: 'CitySearch',
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: 'z.B. Wien, Graz, Salzburg'
    },
    buttonText: {
      type: String,
      default: 'Suchen'
    },
    helper: {
      type: String,
      default: ''
    }
  },
  emits: ['update:modelValue', 'submit'],
  computed: {
    internalValue: {
      get() {
        return this.modelValue
      },
      set(value) {
        this.$emit('update:modelValue', value)
      }
    }
  },
  methods: {
    submit() {
      const trimmed = this.modelValue.trim()
      if (!trimmed) {
        return
      }
      this.$emit('submit', trimmed)
    }
  }
}
</script>

<style scoped>
.city-search {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.city-search__field {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  padding: 10px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.85);
  box-shadow: 0 24px 60px rgba(11, 14, 20, 0.14);
}

.city-search input {
  border: none;
  background: transparent;
  padding: 12px 8px 12px 14px;
  font-size: 1rem;
  outline: none;
}

.city-search button {
  border: none;
  border-radius: 14px;
  padding: 12px 20px;
  background: linear-gradient(140deg, #2a9d8f, #1f7a6e);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}

.city-search button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.city-search__helper {
  margin: 0;
  color: #5f6c7b;
  font-size: 0.95rem;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

@media (max-width: 640px) {
  .city-search__field {
    grid-template-columns: 1fr;
  }
}
</style>
