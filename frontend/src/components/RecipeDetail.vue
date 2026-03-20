<template>
  <div class="detail">
    <h2 class="menuTitle">{{ recipe.menu.name }}</h2>
    <div class="menuKana">{{ recipe.menu.kana }}</div>

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
import type { RecipeGetResponse, MeasurementResponse } from '../api/types'

defineProps<{
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
</script>

