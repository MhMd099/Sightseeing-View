<template>
  <component :is="rootTag" class="city-search" @submit.prevent="submit">
    <label class="sr-only" :for="inputId">Eingabe</label>
    <div class="city-search__field">
      <input
        :id="inputId"
        v-model="internalValue"
        type="text"
        :placeholder="placeholder"
        :list="listId"
        autocomplete="on"
      />
      <button v-if="showButton" type="submit" :disabled="!internalValue.trim()">
        {{ buttonText}}
      </button>
    </div>
    <datalist v-if="suggestions.length" :id="listId">
      <option v-for="item in suggestions" :key="item" :value="item" />
    </datalist>
  </component>
</template>

<script>
export default {
  name: 'CitySearch',
  props: {
    asForm: {
      type: Boolean,
      default: true
    },
    inputId: {
      type: String,
      default: 'city-input'
    },
    modelValue: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: 'z.B. Österreich, Venezuela, Kanada'
    },
    buttonText: {
      type: String,
      default: 'Suchen'
    },
    showButton: {
      type: Boolean,
      default: true
    },
    suggestions: {
      type: Array,
      default: () => []
    }
  },
  emits: ['update:modelValue', 'submit'],
  computed: {
    rootTag() {
      return this.asForm ? 'form' : 'div'
    },
    listId() {
      return `${this.inputId}-suggestions`
    },
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
