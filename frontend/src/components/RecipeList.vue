<template>
  <div class="listWrapper">
    <div v-if="loading" class="listLoading">読み込み中...</div>
    <ul v-else class="recipeList">
      <li v-for="r in recipes" :key="r.id" class="recipeListItem">
        <button
          class="recipeButton"
          type="button"
          :class="{ isSelected: r.id === selectedId }"
          @click="$emit('select', r.id)"
        >
          <div class="recipeName">{{ r.name }}</div>
          <div class="recipeKana">{{ r.kana }}</div>
        </button>
      </li>
    </ul>
    <div v-if="!loading && recipes.length === 0" class="emptyList">
      レシピがありません
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RecipeListItemResponse } from '../api/types'

defineProps<{
  recipes: RecipeListItemResponse[]
  selectedId: number | null
  loading: boolean
}>()

defineEmits<{
  (e: 'select', id: number): void
}>()
</script>

