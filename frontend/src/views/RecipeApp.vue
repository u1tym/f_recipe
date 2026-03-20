<template>
  <div class="appRoot">
    <header class="topBar">
      <div class="titleBlock">
        <h1 class="title">レシピ</h1>
        <div class="meta">{{ recipes.length }}件</div>
      </div>
      <button class="primaryBtn" type="button" @click="openCreate">
        新規登録
      </button>
    </header>

    <div class="main">
      <section class="listArea" aria-label="レシピ一覧">
        <RecipeList
          :recipes="recipes"
          :selectedId="selectedRecipeId"
          :loading="isLoadingList"
          @select="onSelectRecipe"
        />
      </section>

      <section class="detailArea" aria-label="レシピ詳細">
        <div v-if="errorMessage" class="errorBox">
          {{ errorMessage }}
        </div>

        <RecipeDetail v-else-if="selectedRecipe" :recipe="selectedRecipe" />

        <div v-else class="empty">
          レシピを選択してください。
        </div>
      </section>
    </div>

    <RecipeCreateModal
      v-if="isCreateOpen"
      :onClose="closeCreate"
      :onCreated="onCreatedRecipe"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { RecipeGetResponse, RecipeListItemResponse } from '../api/types'
import { getRecipeById, getRecipes } from '../api/recipeApi'
import RecipeCreateModal from '../components/RecipeCreateModal.vue'
import RecipeDetail from '../components/RecipeDetail.vue'
import RecipeList from '../components/RecipeList.vue'

const recipes = ref<RecipeListItemResponse[]>([])
const selectedRecipeId = ref<number | null>(null)
const selectedRecipe = ref<RecipeGetResponse | null>(null)
const isLoadingList = ref(false)
const errorMessage = ref<string | null>(null)

const isCreateOpen = ref(false)

function openCreate() {
  isCreateOpen.value = true
}

function closeCreate() {
  isCreateOpen.value = false
}

async function refreshList() {
  isLoadingList.value = true
  errorMessage.value = null
  try {
    recipes.value = await getRecipes()
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : '一覧の取得に失敗しました。'
  } finally {
    isLoadingList.value = false
  }
}

async function loadSelectedRecipe(id: number) {
  errorMessage.value = null
  selectedRecipe.value = null
  try {
    selectedRecipe.value = await getRecipeById(id)
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : 'レシピ詳細の取得に失敗しました。'
  }
}

async function onSelectRecipe(id: number) {
  selectedRecipeId.value = id
  await loadSelectedRecipe(id)
}

async function onCreatedRecipe(id: number) {
  closeCreate()
  await refreshList()
  selectedRecipeId.value = id
  await loadSelectedRecipe(id)
}

onMounted(async () => {
  await refreshList()
  if (recipes.value.length > 0) {
    selectedRecipeId.value = recipes.value[0].id
    await loadSelectedRecipe(recipes.value[0].id)
  }
})
</script>

