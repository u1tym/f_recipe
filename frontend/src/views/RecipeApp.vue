<template>
  <div class="appRoot">
    <header class="topBar">
      <div class="titleBlock headerTitleBlock">
        <div class="headerRow">
          <div class="headerIcons">
          <img
            class="headerIcon"
            :src="portalIconUrl"
            alt="PORTAL"
            width="52"
            height="52"
            role="button"
            tabindex="0"
            @click="goPortal"
            @keydown.enter="goPortal"
          />
          <img
            class="headerIcon"
            :src="recipeIconUrl"
            alt="RECIPE"
            width="52"
            height="52"
          />
          </div>
          <h1 class="title">RECIPE</h1>
        </div>
      </div>
    </header>

    <div class="main listOnlyMain">
      <section class="listArea listAreaFull" aria-label="レシピ一覧">
        <RecipeList :recipes="recipes" :selectedId="selectedRecipeId" :loading="isLoadingList" @select="onSelectRecipe" />
      </section>
    </div>

    <RecipeCreateModal
      v-if="isCreateOpen"
      :onClose="closeCreate"
      :onCreated="onCreatedRecipe"
    />

    <!-- 全画面：詳細 -->
    <div
      v-if="selectedRecipe || errorMessage"
      class="detailOverlay"
      role="dialog"
      aria-modal="true"
    >
      <header class="detailOverlayHeader">
        <div class="detailOverlayTitle">
          {{ selectedRecipe ? selectedRecipe.menu.name : '詳細' }}
        </div>
        <button class="iconBtn" type="button" @click="closeDetail" aria-label="閉じる">
          ×
        </button>
      </header>

      <div class="detailOverlayBody">
        <div v-if="errorMessage" class="errorBox">
          {{ errorMessage }}
        </div>
        <RecipeDetail v-else-if="selectedRecipe" :recipe="selectedRecipe" />
      </div>
    </div>

    <!-- 右下：新規登録 -->
    <button v-if="!selectedRecipe" class="fab" type="button" @click="openCreate" aria-label="新規登録">
      ＋
    </button>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { RecipeGetResponse, RecipeListItemResponse } from '../api/types'
import { getRecipeById, getRecipes } from '../api/recipeApi'
import RecipeCreateModal from '../components/RecipeCreateModal.vue'
import RecipeDetail from '../components/RecipeDetail.vue'
import RecipeList from '../components/RecipeList.vue'
import portalIconUrl from '../../images/PORTAL.png'
import recipeIconUrl from '../../images/RECIPE.png'

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

function goPortal() {
  window.location.href = '../m.html'
}

function closeDetail() {
  selectedRecipe.value = null
  selectedRecipeId.value = null
  errorMessage.value = null
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
  selectedRecipeId.value = null
})
</script>

