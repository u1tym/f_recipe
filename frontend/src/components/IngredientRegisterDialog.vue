<template>
  <div class="dialogOverlay" @click="props.onClose">
    <div class="dialogModal" role="dialog" aria-modal="true" @click.stop>
      <header class="modalHeader">
        <div>
          <div class="modalTitle">材料の新規登録</div>
          <div class="modalSub">材料名と材料かなを入力してください</div>
        </div>
        <button class="iconBtn" type="button" @click="props.onClose" aria-label="閉じる">
          ×
        </button>
      </header>

      <div class="modalBody">
        <form class="form" @submit.prevent="submit">
          <label class="label">
            材料名
            <input v-model="name" class="input" type="text" inputmode="text" required />
          </label>

          <label class="label">
            材料かな
            <input v-model="kana" class="input" type="text" inputmode="text" required />
          </label>

          <div class="modalActions">
            <button class="secondaryBtn" type="button" @click="props.onClose">
              キャンセル
            </button>
            <div class="spacer" />
            <button class="primaryBtn" type="submit" :disabled="isSubmitting">
              {{ isSubmitting ? '登録中...' : '登録する' }}
            </button>
          </div>
        </form>

        <div v-if="errorMessage" class="errorBox submitError">
          {{ errorMessage }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { IngredientResponse } from '../api/types'
import { createIngredient } from '../api/recipeApi'

const props = defineProps<{
  onClose: () => void
  onCreated: (ingredient: IngredientResponse) => void
}>()

const name = ref('')
const kana = ref('')
const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)

async function submit() {
  errorMessage.value = null
  if (!name.value.trim()) {
    errorMessage.value = '材料名を入力してください。'
    return
  }
  if (!kana.value.trim()) {
    errorMessage.value = '材料かなを入力してください。'
    return
  }

  isSubmitting.value = true
  try {
    const res = await createIngredient({ name: name.value.trim(), kana: kana.value.trim() })
    props.onCreated(res)
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : '登録に失敗しました。'
  } finally {
    isSubmitting.value = false
  }
}
</script>

