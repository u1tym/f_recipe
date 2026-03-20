export type IngredientResponse = {
  id: number
  name: string
  kana: string
}

export type IngredientCreateRequest = {
  name: string
  kana: string
}

export type MeasurementResponse = {
  id: number
  name_bef: string
  name_aft: string
  ness_amount: boolean
}

export type MeasurementCreateRequest = {
  name_bef: string
  name_aft: string
  ness_amount: boolean
}

export type RecipeListItemResponse = {
  id: number
  name: string
  kana: string
}

export type RecipeGetResponse = {
  id: number
  menu: {
    name: string
    kana: string
  }
  step: Array<{
    description: string
    image: unknown[]
    items: Array<{
      ingredient: {
        id: number
        name: string
        kana: string
      }
      measurement: {
        id: number
        name_bef: string
        name_aft: string
        ness_amount: boolean
      }
      amount: string
    }>
  }>
}

export type RecipeCreateRequest = {
  menu: { name: string; kana: string }
  step: Array<{
    description: string
    image: unknown[]
    items: Array<{
      ingredient: { id: number | null; name: string; kana: string }
      measurement: {
        id: number | null
        name_bef: string
        name_aft: string
        ness_amount: boolean
      }
      amount: string
    }>
  }>
}

export type RecipeCreateResponse = { id: number }

