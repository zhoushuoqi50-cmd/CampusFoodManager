import type { Food } from './foodData'

const FAVORITE_FOODS_KEY = 'favoriteFoods'

export interface FavoriteFood {
  id: string
  foodName: string
  price: number
  tags: string[]
  type: string
  reason: string
  requirement: string
  favoritedAt: number
}

const createId = () => {
  return `favorite-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

const isFavoriteFood = (value: unknown): value is FavoriteFood => {
  if (!value || typeof value !== 'object') return false

  const favorite = value as FavoriteFood
  return typeof favorite.id === 'string'
    && typeof favorite.foodName === 'string'
    && typeof favorite.price === 'number'
    && Array.isArray(favorite.tags)
    && favorite.tags.every(tag => typeof tag === 'string')
    && typeof favorite.type === 'string'
    && typeof favorite.reason === 'string'
    && typeof favorite.requirement === 'string'
    && typeof favorite.favoritedAt === 'number'
}

const saveFavorites = (favorites: FavoriteFood[]) => {
  wx.setStorageSync(FAVORITE_FOODS_KEY, favorites)
}

export const getFavorites = (): FavoriteFood[] => {
  const storedFavorites: unknown = wx.getStorageSync(FAVORITE_FOODS_KEY)
  if (!Array.isArray(storedFavorites)) return []

  return storedFavorites.filter(isFavoriteFood)
}

export const isFavorite = (foodName: string): boolean => {
  return getFavorites().some(favorite => favorite.foodName === foodName)
}

export const addFavorite = (food: Food, requirement = ''): FavoriteFood => {
  const favorites = getFavorites()
  const existingFavorite = favorites.find(item => item.foodName === food.name)
  const favorite: FavoriteFood = {
    id: existingFavorite ? existingFavorite.id : createId(),
    foodName: food.name,
    price: food.price,
    tags: [...food.tags],
    type: food.type,
    reason: food.reason,
    requirement,
    favoritedAt: Date.now(),
  }
  const updatedFavorites = [
    ...favorites.filter(item => item.foodName !== food.name),
    favorite,
  ]

  saveFavorites(updatedFavorites)
  return favorite
}

export const removeFavorite = (foodName: string): FavoriteFood[] => {
  const favorites = getFavorites().filter(item => item.foodName !== foodName)
  saveFavorites(favorites)
  return favorites
}

export const toggleFavorite = (food: Food, requirement = '') => {
  if (isFavorite(food.name)) {
    removeFavorite(food.name)
    return false
  }

  addFavorite(food, requirement)
  return true
}

export const clearFavorites = () => {
  saveFavorites([])
}
