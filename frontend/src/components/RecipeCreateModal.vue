<template>
  <div class="modalOverlay" @click="onClose">
    <div class="modal" role="dialog" aria-modal="true" @click.stop>
      <header class="modalHeader">
        <div>
          <div class="modalTitle">新規レシピ登録</div>
          <div class="modalSub">メニュー名、工程、材料と分量を入力してください</div>
        </div>
        <button class="iconBtn" type="button" @click="onClose" aria-label="閉じる">
          ×
        </button>
      </header>

      <div class="modalBody">
        <div v-if="loadError" class="errorBox">
          {{ loadError }}
        </div>

        <div v-else-if="isLoadingLists" class="loadingBox">
          選択肢を準備中...
        </div>

        <form v-else class="form" @submit.prevent="submit">
          <section class="sectionCard">
            <h3 class="sectionTitle">メニュー</h3>
            <div class="fieldRow">
              <label class="label">
                メニュー名
                <input
                  v-model="form.menuName"
                  class="input"
                  type="text"
                  inputmode="text"
                  required
                />
              </label>
              <label class="label">
                メニューかな
                <input
                  v-model="form.menuKana"
                  class="input"
                  type="text"
                  inputmode="text"
                  required
                />
              </label>
            </div>
          </section>

          <section
            v-for="(step, stepIdx) in form.steps"
            :key="stepIdx"
            class="sectionCard stepCard"
          >
            <div class="stepTop">
              <h3 class="sectionTitle">手順 {{ stepIdx + 1 }}</h3>
              <button
                class="dangerBtn"
                type="button"
                @click="removeStep(stepIdx)"
                v-if="form.steps.length > 1"
              >
                手順を削除
              </button>
            </div>

            <div class="itemsBlock">
              <div class="itemsHeader">
                <div>材料（{{ step.items.length }}件）</div>
              </div>

              <div
                v-for="(item, itemIdx) in step.items"
                :key="itemIdx"
                class="itemCard"
              >
                <div class="itemTop">
                  <div class="itemTitle">材料 {{ itemIdx + 1 }}</div>
                  <button
                    class="dangerBtn"
                    type="button"
                    @click="removeItem(stepIdx, itemIdx)"
                  >
                    削除
                  </button>
                </div>

                <div class="twoCol">
                  <div class="col">
                    <div class="inlineRow">
                      <div class="inlineTitle">材料</div>
                      <select
                        class="select ingredientSelect"
                        :value="item.ingredientId ?? ''"
                        @change="onSelectIngredient(stepIdx, itemIdx, $event)"
                      >
                        <option disabled value="">-- 選択してください --</option>
                        <option v-for="ing in ingredients" :key="ing.id" :value="ing.id">
                          {{ ing.name }}（{{ ing.kana }}）
                        </option>
                      </select>
                      <button
                        class="smallBtn plusBtn"
                        type="button"
                        @click="openIngredientRegister(stepIdx, itemIdx)"
                        aria-label="材料新規登録"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div class="col">
                    <div class="measurementRow">
                      <div class="measurementFieldsRow measurementFieldsRowWithTitle">
                        <div class="inlineTitle">分量</div>
                        <select
                          class="select inlineSelect"
                          :value="item.measurementBef"
                          @change="onSelectMeasurementPrefix(stepIdx, itemIdx, $event)"
                        >
                          <option disabled value="">-- 接頭語 --</option>
                          <option v-for="p in measurementPrefixes" :key="p" :value="p">
                            {{ p || '（空）' }}
                          </option>
                        </select>

                        <label class="inlineAmount">
                          <input
                            v-model="item.amount"
                            class="input inlineAmountInput"
                            type="text"
                            inputmode="numeric"
                            :disabled="!item.measurementNessAmount"
                            required
                          />
                        </label>

                        <select
                          class="select inlineSelect"
                          :value="item.measurementAft"
                          @change="onSelectMeasurementSuffix(stepIdx, itemIdx, $event)"
                        >
                          <option
                            v-for="s in getSuffixOptions(item.measurementBef)"
                            :key="s"
                            :value="s"
                          >
                            {{ s || '（空）' }}
                          </option>
                        </select>

                        <button
                          class="smallBtn plusBtn"
                          type="button"
                          @click="openMeasurementRegister(stepIdx, itemIdx)"
                          aria-label="分量新規登録"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="addItemRow">
                <button class="secondaryBtn" type="button" @click="addItem(stepIdx)">
                  材料を追加
                </button>
              </div>
            </div>

            <label class="label">
              手順説明
              <textarea
                v-model="step.description"
                class="textarea"
                rows="3"
                required
              ></textarea>
            </label>
          </section>

          <div class="modalActions">
            <button class="secondaryBtn" type="button" @click="addStep">
              手順を追加
            </button>
            <div class="spacer" />
            <button class="primaryBtn" type="submit" :disabled="isSubmitting">
              {{ isSubmitting ? '登録中...' : '登録する' }}
            </button>
          </div>

          <div v-if="submitError" class="errorBox submitError">
            {{ submitError }}
          </div>
        </form>
      </div>
    </div>
  </div>

  <IngredientRegisterDialog
    v-if="isIngredientDialogOpen"
    :onClose="closeIngredientDialog"
    :onCreated="onIngredientCreated"
  />

  <MeasurementRegisterDialog
    v-if="isMeasurementDialogOpen"
    :onClose="closeMeasurementDialog"
    :onCreated="onMeasurementCreated"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import type {
  IngredientResponse,
  MeasurementResponse,
  RecipeCreateRequest,
} from '../api/types'
import {
  createRecipe,
  getIngredients,
  getMeasurements,
} from '../api/recipeApi'
import { ApiError } from '../api/client'
import IngredientRegisterDialog from './IngredientRegisterDialog.vue'
import MeasurementRegisterDialog from './MeasurementRegisterDialog.vue'

type ItemForm = {
  ingredientId: number | null
  measurementId: number | null
  measurementBef: string
  measurementAft: string
  measurementNessAmount: boolean
  amount: string
}

type StepForm = {
  description: string
  items: ItemForm[]
}

type RecipeCreateForm = {
  menuName: string
  menuKana: string
  steps: StepForm[]
}

const props = defineProps<{
  onClose: () => void
  onCreated: (id: number) => void
}>()

const ingredients = ref<IngredientResponse[]>([])
const measurements = ref<MeasurementResponse[]>([])

const isLoadingLists = ref(true)
const loadError = ref<string | null>(null)

const isSubmitting = ref(false)
const submitError = ref<string | null>(null)

const isIngredientDialogOpen = ref(false)
const ingredientDialogTarget = ref<{ stepIdx: number; itemIdx: number } | null>(null)

const isMeasurementDialogOpen = ref(false)
const measurementDialogTarget = ref<{ stepIdx: number; itemIdx: number } | null>(null)

const form = reactive<RecipeCreateForm>({
  menuName: '',
  menuKana: '',
  steps: [],
})

function createDefaultItem(): ItemForm {
  const ing = ingredients.value[0] ?? null
  const meas = measurements.value[0] ?? null

  return {
    ingredientId: ing?.id ?? null,
    measurementId: meas?.id ?? null,
    measurementBef: meas?.name_bef ?? '',
    measurementAft: meas?.name_aft ?? '',
    measurementNessAmount: meas?.ness_amount ?? true,
    amount: meas?.ness_amount ? '1' : '',
  }
}

const measurementPrefixes = computed(() => {
  const set = new Set<string>()
  for (const m of measurements.value) set.add(m.name_bef)
  // 接頭語順に表示（APIの並びに寄せる）
  return Array.from(set).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
})

function getIngredientById(id: number): IngredientResponse | undefined {
  return ingredients.value.find((i) => i.id === id)
}

function getMeasurementByBefAft(
  bef: string,
  aft: string,
): MeasurementResponse | undefined {
  return measurements.value.find((m) => m.name_bef === bef && m.name_aft === aft)
}

function getSuffixOptions(prefix: string): string[] {
  const set = new Set<string>()
  for (const m of measurements.value) {
    if (m.name_bef === prefix) set.add(m.name_aft)
  }
  return Array.from(set).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
}

function ensureFormInitialized() {
  if (form.steps.length > 0) return
  form.steps.push({
    description: '',
    items: [createDefaultItem()],
  })
}

function addStep() {
  form.steps.push({
    description: '',
    items: [createDefaultItem()],
  })
}

function removeStep(stepIdx: number) {
  if (form.steps.length <= 1) return
  form.steps.splice(stepIdx, 1)
}

function addItem(stepIdx: number) {
  form.steps[stepIdx].items.push(createDefaultItem())
}

function removeItem(stepIdx: number, itemIdx: number) {
  form.steps[stepIdx].items.splice(itemIdx, 1)
}

function onSelectIngredient(stepIdx: number, itemIdx: number, ev: Event) {
  const target = ev.target as HTMLSelectElement
  const id = target.value === '' ? null : Number(target.value)
  form.steps[stepIdx].items[itemIdx].ingredientId = id
}

function openIngredientRegister(stepIdx: number, itemIdx: number) {
  ingredientDialogTarget.value = { stepIdx, itemIdx }
  isIngredientDialogOpen.value = true
}

function closeIngredientDialog() {
  isIngredientDialogOpen.value = false
  ingredientDialogTarget.value = null
}

async function refreshIngredients() {
  ingredients.value = await getIngredients()
}

async function onIngredientCreated(ingredient: IngredientResponse) {
  await refreshIngredients()
  if (!ingredientDialogTarget.value) return
  const { stepIdx, itemIdx } = ingredientDialogTarget.value
  form.steps[stepIdx].items[itemIdx].ingredientId = ingredient.id
  closeIngredientDialog()
}

function onSelectMeasurementPrefix(stepIdx: number, itemIdx: number, ev: Event) {
  const target = ev.target as HTMLSelectElement
  const prefix = target.value
  const item = form.steps[stepIdx].items[itemIdx]

  item.measurementBef = prefix

  // 接尾語の選択肢を更新し、まずは先頭の組み合わせを選ぶ
  const suffixOptions = getSuffixOptions(prefix)
  const nextSuffix = suffixOptions[0] ?? ''
  item.measurementAft = nextSuffix

  const m = getMeasurementByBefAft(prefix, nextSuffix)
  if (!m) {
    item.measurementId = null
    item.measurementNessAmount = false
    item.amount = ''
    return
  }

  item.measurementId = m.id
  item.measurementNessAmount = m.ness_amount
  item.amount = m.ness_amount ? item.amount || '1' : ''
}

function onSelectMeasurementSuffix(stepIdx: number, itemIdx: number, ev: Event) {
  const target = ev.target as HTMLSelectElement
  const suffix = target.value
  const item = form.steps[stepIdx].items[itemIdx]

  item.measurementAft = suffix
  const m = getMeasurementByBefAft(item.measurementBef, suffix)
  if (!m) {
    item.measurementId = null
    item.measurementNessAmount = false
    item.amount = ''
    return
  }

  item.measurementId = m.id
  item.measurementNessAmount = m.ness_amount
  item.amount = m.ness_amount ? item.amount || '1' : ''
}

function openMeasurementRegister(stepIdx: number, itemIdx: number) {
  measurementDialogTarget.value = { stepIdx, itemIdx }
  isMeasurementDialogOpen.value = true
}

function closeMeasurementDialog() {
  isMeasurementDialogOpen.value = false
  measurementDialogTarget.value = null
}

async function refreshMeasurements() {
  measurements.value = await getMeasurements()
}

async function onMeasurementCreated(measurement: MeasurementResponse) {
  await refreshMeasurements()
  if (!measurementDialogTarget.value) return
  const { stepIdx, itemIdx } = measurementDialogTarget.value
  const item = form.steps[stepIdx].items[itemIdx]

  item.measurementId = measurement.id
  item.measurementBef = measurement.name_bef
  item.measurementAft = measurement.name_aft
  item.measurementNessAmount = measurement.ness_amount
  item.amount = measurement.ness_amount ? item.amount || '1' : ''

  closeMeasurementDialog()
}

function validateForm(): string | null {
  if (!form.menuName.trim()) return 'メニュー名を入力してください。'
  if (!form.menuKana.trim()) return 'メニューかなを入力してください。'
  if (form.steps.length === 0) return '工程がありません。'

  for (let s = 0; s < form.steps.length; s++) {
    const step = form.steps[s]
    if (!step.description.trim()) return `手順 ${s + 1} の工程説明を入力してください。`
    if (step.items.length === 0) return `手順 ${s + 1} に材料がありません。`

    for (let i = 0; i < step.items.length; i++) {
      const item = step.items[i]
      if (item.ingredientId === null) return `手順 ${s + 1}・材料 ${i + 1}: 材料を選択してください。`

      if (!item.measurementBef && !item.measurementAft) {
        return `手順 ${s + 1}・材料 ${i + 1}: 分量を選択してください。`
      }

      if (item.measurementNessAmount && !item.amount.trim()) {
        return `手順 ${s + 1}・材料 ${i + 1}: 数量を入力してください。`
      }
    }
  }

  return null
}

async function submit() {
  submitError.value = null
  const message = validateForm()
  if (message) {
    submitError.value = message
    return
  }

  isSubmitting.value = true
  try {
    const request: RecipeCreateRequest = {
      menu: { name: form.menuName.trim(), kana: form.menuKana.trim() },
      step: form.steps.map((step) => ({
        description: step.description,
        image: [],
        items: step.items.map((item) => {
          const ing = item.ingredientId === null ? null : getIngredientById(item.ingredientId)
          const meas = getMeasurementByBefAft(item.measurementBef, item.measurementAft)

          return {
            ingredient: ing ? { id: ing.id, name: ing.name, kana: ing.kana } : { id: null, name: '', kana: '' },
            measurement: meas
              ? {
                  id: meas.id,
                  name_bef: meas.name_bef,
                  name_aft: meas.name_aft,
                  ness_amount: meas.ness_amount,
                }
              : {
                  id: null,
                  name_bef: item.measurementBef,
                  name_aft: item.measurementAft,
                  ness_amount: item.measurementNessAmount,
                },
            amount: item.measurementNessAmount ? item.amount.trim() : '',
          }
        }),
      })),
    }

    const res = await createRecipe(request)
    props.onCreated(res.id)
  } catch (e) {
    submitError.value =
      e instanceof ApiError ? `登録に失敗しました: ${e.status}` : '登録に失敗しました。'
  } finally {
    isSubmitting.value = false
  }
}

onMounted(async () => {
  isLoadingLists.value = true
  loadError.value = null
  try {
    const [ings, meas] = await Promise.all([getIngredients(), getMeasurements()])
    ingredients.value = ings
    measurements.value = meas
    ensureFormInitialized()
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : '選択肢の取得に失敗しました。'
  } finally {
    isLoadingLists.value = false
  }
})
</script>

