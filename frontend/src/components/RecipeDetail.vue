<template>
  <div class="detail">
    <h2 class="menuTitle">{{ recipe.menu.name }}</h2>
    <div class="menuKana">{{ recipe.menu.kana }}</div>

    <section v-if="ingredientEntries.length > 0" class="ingredientsSummary">
      <h3 class="ingredientsTitle">材料一覧</h3>
      <ul class="ingredientsList">
        <li
          v-for="e in ingredientEntries"
          :key="e.key"
          class="ingredientSummaryRow"
        >
          <div class="ingredientSummaryGrid">
            <span class="ingredientSummaryName">{{ e.ingredientName }}</span>
            <span class="ingredientSummaryAmount">{{ e.line }}</span>
          </div>
        </li>
      </ul>
    </section>

    <div class="steps">
      <article v-for="(step, idx) in recipe.step" :key="idx" class="stepCard">
        <div class="stepHeader">
          <div class="stepNo">手順 {{ idx + 1 }}</div>
          <div class="stepDesc">{{ step.description }}</div>
        </div>

        <ul class="itemList">
          <li v-for="(item, itemIdx) in step.items" :key="itemIdx" class="itemRow">
            <div class="ingredientName">{{ item.ingredient.name }}</div>
            <div class="ingredientLine">
              {{ formatMeasurement(item.measurement, item.amount) }}
            </div>
          </li>
        </ul>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { RecipeGetResponse, MeasurementResponse } from '../api/types'

const props = defineProps<{
  recipe: RecipeGetResponse
}>()

function formatMeasurement(measurement: MeasurementResponse, amount: string): string {
  if (measurement.ness_amount) {
    const amt = amount ?? ''
    return `${measurement.name_bef}${amt}${measurement.name_aft}`.trim()
  }
  // 数量不要（少々等）
  return `${measurement.name_bef}${measurement.name_aft}`.trim()
}

const ingredientEntries = computed(() => {
  // レシピ内（全ステップ）で材料をフラットにして表示
  const out: Array<{ key: string; ingredientName: string; line: string }> = []
  for (let stepIdx = 0; stepIdx < props.recipe.step.length; stepIdx++) {
    const step = props.recipe.step[stepIdx]
    for (let itemIdx = 0; itemIdx < step.items.length; itemIdx++) {
      const item = step.items[itemIdx]
      const key = `${stepIdx}-${itemIdx}-${item.ingredient.id}`
      out.push({
        key,
        ingredientName: item.ingredient.name,
        line: formatMeasurement(item.measurement, item.amount),
      })
    }
  }
  return out
})
</script>

