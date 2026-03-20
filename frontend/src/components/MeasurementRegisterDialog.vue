<template>
  <div class="dialogOverlay" @click="props.onClose">
    <div class="dialogModal" role="dialog" aria-modal="true" @click.stop>
      <header class="modalHeader">
        <div>
          <div class="modalTitle">分量名称の新規登録</div>
          <div class="modalSub">接頭語・接尾語と「数量あり」を設定してください</div>
        </div>
        <button class="iconBtn" type="button" @click="props.onClose" aria-label="閉じる">
          ×
        </button>
      </header>

      <div class="modalBody">
        <form class="form" @submit.prevent="submit">
          <div class="fieldRow">
            <label class="label">
              接頭語（例: 大さじ）
              <input v-model="nameBef" class="input" type="text" inputmode="text" />
            </label>
            <label class="label">
              接尾語（例: 束）
              <input v-model="nameAft" class="input" type="text" inputmode="text" />
            </label>
          </div>

          <label class="label checkboxLabel">
            <input type="checkbox" v-model="nessAmount" />
            数量あり（例: 大さじ1 / 2束）
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
import type { MeasurementResponse } from '../api/types'
import { createMeasurement } from '../api/recipeApi'

const props = defineProps<{
  onClose: () => void
  onCreated: (measurement: MeasurementResponse) => void
}>()

const nameBef = ref('')
const nameAft = ref('')
const nessAmount = ref(true)

const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)

async function submit() {
  errorMessage.value = null

  const bef = nameBef.value.trim()
  const aft = nameAft.value.trim()

  if (!bef && !aft) {
    errorMessage.value = '接頭語/接尾語のどちらかを入力してください。'
    return
  }

  isSubmitting.value = true
  try {
    const res = await createMeasurement({
      name_bef: bef,
      name_aft: aft,
      ness_amount: nessAmount.value,
    })
    props.onCreated(res)
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : '登録に失敗しました。'
  } finally {
    isSubmitting.value = false
  }
}
</script>

