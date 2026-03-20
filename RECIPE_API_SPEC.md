# m_recipe: PostgreSQLスキーマとFastAPI API仕様

## データベース

### スキーマ: `recipe`

#### `recipe.ingredient`（材料）
- カラム
  - `id` `serial`（主キー）
  - `name` `text`（NOT NULL）
  - `kana` `text`（NOT NULL）
- 制約
  - `UNIQUE(name)`（材料名は重複しない）

#### `recipe.measurements`（分量名称）
- カラム
  - `id` `serial`（主キー）
  - `name_bef` `text`（NOT NULL）（分量の接頭語）
  - `name_aft` `text`（NOT NULL）（分量の接尾語）
  - `ness_amount` `boolean`（NOT NULL）（数量が必要かどうか）
- 制約
  - `UNIQUE(name_bef, name_aft)`（接頭語+接尾語は重複しない）

#### `recipe.menu`（レシピのメニュー）
- カラム
  - `id` `serial`（主キー）
  - `name` `text`（NOT NULL）
  - `kana` `text`（NOT NULL）
  - `is_deleted` `boolean`（NOT NULL DEFAULT `false`）
- 制約
  - `UNIQUE(name)`（メニュー名は重複しない）

`is_deleted=true` は「論理削除（更新時の作り直し対象）」です。

#### `recipe.menu_step`（レシピの工程）
- カラム
  - `id` `serial`（主キー）
  - `menu_id` `integer`（NOT NULL, FK -> `recipe.menu(id)`）
  - `step` `integer`（NOT NULL）（工程番号）
  - `description` `text`（NOT NULL）（工程説明）
- 制約
  - `UNIQUE(menu_id, step)`（同じメニュー内で工程番号は重複しない）

#### `recipe.menu_step_ingredient`（工程ごとの材料）
- カラム
  - `id` `serial`（主キー）
  - `menu_step_id` `integer`（NOT NULL, FK -> `recipe.menu_step(id)`）
  - `ingredient_id` `integer`（NOT NULL, FK -> `recipe.ingredient(id)`）
  - `measurement_id` `integer`（NOT NULL, FK -> `recipe.measurements(id)`）
  - `amount` `text`（NOT NULL）（分量）
- 補足
  - `menu_step` に対して「材料」と「分量名称」と「量」を紐づけます。

### 初期データ（seed）
`db/db.sql` が `recipe.ingredient` と `recipe.measurements` に初期値を投入します。

## API（FastAPI）

FastAPIアプリは `m_recipe`。エンドポイントのベースパスは下記のとおりです。
- `POST /ingredients`
- `GET /ingredients`
- `POST /measurements`
- `GET /measurements`
- `POST /recipes`
- `PUT /recipes`
- `GET /recipes/{id}`
- `GET /recipes`

`.env` からDB接続情報を読み込みます。
- `SERVER=localhost`
- `DATABASE=tamtdb`
- `PORT=5432`
- `USERNAME=tamtuser`
- `PASSWORD=TAMTTAMT`

## 並び順（ソート）
- 材料一覧: `kana` 昇順（同一かななら `id` 昇順）
- 分量名称一覧: `name_bef` 昇順 → `name_aft` 昇順（同一なら `id` 昇順）
- レシピ一覧: `kana` 昇順（同一なら `id` 昇順）
- レシピ取得（GET /recipes/{id}）: `recipe.menu_step.step` 昇順

## `id=null` / 更新ルール（レシピ create/update の挙動）
レシピの step 配列の各 `item` には `ingredient` と `measurement` が含まれます。

### ingredient
- `ingredient.id` が `null`
  - APIは `recipe.ingredient` に対して `(name)` の `UNIQUE` をキーに insert / upsert します。
- `ingredient.id` が `null` ではない
  - その `id` をそのまま使用します。

### measurement
- `measurement.id` が `null`
  - APIは `recipe.measurements` に対して `(name_bef, name_aft)` の `UNIQUE` をキーに insert / upsert します。
- `measurement.id` が `null` ではない
  - その `id` をそのまま使用します。

### menu の upsert（重要）
- `recipe.menu` は `UNIQUE(name)` で upsert します。
- 競合時は `kana` を更新し、`is_deleted=false` に戻します。

### menu_step の制約対策（重要）
`recipe.menu_step` には `UNIQUE(menu_id, step)` があるため、create/update の際に
対象 `menu_id` の既存工程（`menu_step` とその紐づき）を先に削除してから再登録します。

### image
- リクエスト/レスポンスには `image: []` をインタフェースとして含めます。
- 現時点では画像の保存処理は未実装で、空配列として扱われます。

## エラー（観測される仕様）
- `PUT /recipes`
  - 対象 `recipe.menu` が `is_deleted=true` の場合: `409 Conflict`
  - 対象 `id` が存在しない場合: `404 Not Found`
- `GET /recipes/{id}`
  - 対象が見つからない、または `is_deleted=true` の場合: `404 Not Found`

## エンドポイント詳細

### 1) 材料追加
`POST /ingredients`

リクエスト（例）:
```json
{ "name": "大根", "kana": "だいこん" }
```

レスポンス（例）: `IngredientResponse`
```json
{ "id": 2, "name": "大根", "kana": "だいこん" }
```

### 2) 材料一覧取得
`GET /ingredients`

レスポンス（例）: `IngredientResponse[]`
```json
[
  { "id": 2, "name": "大根", "kana": "だいこん" },
  { "id": 1, "name": "人参", "kana": "にんじん" }
]
```

### 3) 分量名称追加
`POST /measurements`

リクエスト例:
```json
{ "name_bef": "大さじ", "name_aft": "", "ness_amount": true }
```
```json
{ "name_bef": "少々", "name_aft": "", "ness_amount": false }
```
```json
{ "name_bef": "", "name_aft": "cc", "ness_amount": true }
```

レスポンス（例）: `MeasurementResponse`
```json
{ "id": 3, "name_bef": "大さじ", "name_aft": "", "ness_amount": true }
```

### 4) 分量名称一覧取得
`GET /measurements`

レスポンス（例）: `MeasurementResponse[]`
```json
[
  { "id": 3, "name_bef": "大さじ", "name_aft": "", "ness_amount": true },
  { "id": 1, "name_bef": "少々", "name_aft": "", "ness_amount": false },
  { "id": 2, "name_bef": "", "name_aft": "cc", "ness_amount": true }
]
```

### 5) レシピ登録
`POST /recipes`

リクエスト（例）: `RecipeCreateRequest`
```json
{
  "menu": { "name": "メニューの名称", "kana": "めにゅーのかな" },
  "step": [
    {
      "description": "ステップ１の説明",
      "items": [
        {
          "ingredient": { "id": 3, "name": "塩", "kana": "しお" },
          "measurement": { "id": 4, "name_bef": "大さじ", "name_aft": "", "ness_amount": true },
          "amount": "1"
        },
        {
          "ingredient": { "id": 5, "name": "胡椒", "kana": "こしょう" },
          "measurement": { "id": 8, "name_bef": "少々", "name_aft": "", "ness_amount": false },
          "amount": ""
        },
        {
          "ingredient": { "id": null, "name": "ニラ", "kana": "にら" },
          "measurement": { "id": null, "name_bef": "", "name_aft": "束", "ness_amount": true },
          "amount": "1"
        }
      ],
      "image": []
    }
  ]
}
```

レスポンス（例）:
```json
{ "id": 11 }
```

登録の主な動作:
- `recipe.menu` を `menu.name` で upsert（既存なら `is_deleted=false` に戻す）
- `step` 配列の要素ごとに、工程番号 `1..N` を付与して `recipe.menu_step` を作成
- 各 `item` について
  - `ingredient.id` が `null` なら `recipe.ingredient` に insert/upsert
  - `measurement.id` が `null` なら `recipe.measurements` に insert/upsert
  - `recipe.menu_step_ingredient` に `amount` を保存

### 6) レシピ更新（作り直し）
`PUT /recipes`

リクエスト（例）: `RecipeUpdateRequest`
```json
{
  "id": 11,
  "menu": { "name": "メニューの名称", "kana": "めにゅーのかな" },
  "step": [
    {
      "description": "ステップ１の説明",
      "items": [
        {
          "ingredient": { "id": 3, "name": "塩", "kana": "しお" },
          "measurement": { "id": 4, "name_bef": "大さじ", "name_aft": "", "ness_amount": true },
          "amount": "1"
        }
      ],
      "image": []
    }
  ]
}
```

レスポンス（例）:
```json
{ "id": 11 }
```

更新ルール:
- 対象 `recipe.menu(id).is_deleted=true` の場合は `409 Conflict`
- それ以外の場合は以下を実施
  - 対象 `recipe.menu(id)` を `is_deleted=true` に設定
  - 提供された `menu` を `recipe.menu` に upsert（`menu.name` がキー）
  - その確定した `menu_id` に紐づく工程を一旦削除し、渡された `step` を再登録

### 7) レシピ取得（id指定）
`GET /recipes/{id}`

レスポンス（例）: `RecipeGetResponse`
```json
{
  "id": 11,
  "menu": { "name": "メニューの名称", "kana": "めにゅーのかな" },
  "step": [
    {
      "description": "ステップ１の説明",
      "items": [
        {
          "ingredient": { "id": 3, "name": "塩", "kana": "しお" },
          "measurement": { "id": 4, "name_bef": "大さじ", "name_aft": "", "ness_amount": true },
          "amount": "1"
        }
      ],
      "image": []
    }
  ]
}
```

取得の主な動作:
- `recipe.menu.is_deleted=false` のものだけ返す
- 工程は `menu_step.step ASC` で返す

### 8) レシピ一覧取得
`GET /recipes`

レスポンス（例）: `RecipeListItemResponse[]`
```json
[
  { "id": 2, "name": "名称", "kana": "めいしょう" },
  { "id": 1, "name": "名称２", "kana": "めいしょう２" }
]
```

