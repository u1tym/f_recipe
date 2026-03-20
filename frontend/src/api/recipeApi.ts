import { apiRequest } from './client'
import type {
  IngredientResponse,
  IngredientCreateRequest,
  MeasurementResponse,
  MeasurementCreateRequest,
  RecipeCreateRequest,
  RecipeCreateResponse,
  RecipeGetResponse,
  RecipeListItemResponse,
} from './types'

export async function getRecipes(): Promise<RecipeListItemResponse[]> {
  return apiRequest<RecipeListItemResponse[]>('/recipes')
}

export async function getRecipeById(id: number): Promise<RecipeGetResponse> {
  return apiRequest<RecipeGetResponse>(`/recipes/${id}`)
}

export async function getIngredients(): Promise<IngredientResponse[]> {
  return apiRequest<IngredientResponse[]>('/ingredients')
}

export async function createIngredient(
  request: IngredientCreateRequest,
): Promise<IngredientResponse> {
  return apiRequest<IngredientResponse>('/ingredients', {
    method: 'POST',
    body: request,
  })
}

export async function getMeasurements(): Promise<MeasurementResponse[]> {
  return apiRequest<MeasurementResponse[]>('/measurements')
}

export async function createMeasurement(
  request: MeasurementCreateRequest,
): Promise<MeasurementResponse> {
  return apiRequest<MeasurementResponse>('/measurements', {
    method: 'POST',
    body: request,
  })
}

export async function createRecipe(
  request: RecipeCreateRequest,
): Promise<RecipeCreateResponse> {
  return apiRequest<RecipeCreateResponse>('/recipes', {
    method: 'POST',
    body: request,
  })
}

