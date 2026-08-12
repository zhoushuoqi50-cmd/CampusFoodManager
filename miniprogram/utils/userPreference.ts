import type { Food } from './foodData'

const USER_PREFERENCE_KEY = 'userPreference'
const TASTE_TAGS = ['辣', '不辣', '清淡', '甜', '酸', '重口味']

export interface PreferenceFood {
  foodName: string
  price: number
  tags: string[]
}

export interface UserPreference {
  likedFoods: PreferenceFood[]
  dislikedFoods: PreferenceFood[]
  likedTastes: string[]
  dislikedTastes: string[]
}

const createEmptyPreference = (): UserPreference => ({
  likedFoods: [],
  dislikedFoods: [],
  likedTastes: [],
  dislikedTastes: [],
})

const unique = <T>(items: T[]): T[] => Array.from(new Set(items))

const isPreferenceFood = (value: unknown): value is PreferenceFood => {
  if (!value || typeof value !== 'object') return false

  const food = value as PreferenceFood
  return typeof food.foodName === 'string'
    && typeof food.price === 'number'
    && Array.isArray(food.tags)
    && food.tags.every(tag => typeof tag === 'string')
}

const getTasteTags = (tags: string[]) => {
  return tags.filter(tag => TASTE_TAGS.includes(tag))
}

const buildTastePreference = (
  likedFoods: PreferenceFood[],
  dislikedFoods: PreferenceFood[]
) => {
  const likedTasteCandidates = unique(likedFoods.flatMap(food => getTasteTags(food.tags)))
  const dislikedTasteCandidates = unique(dislikedFoods.flatMap(food => getTasteTags(food.tags)))

  return {
    likedTastes: likedTasteCandidates.filter(taste => !dislikedTasteCandidates.includes(taste)),
    dislikedTastes: dislikedTasteCandidates.filter(taste => !likedTasteCandidates.includes(taste)),
  }
}

const normalizePreference = (value: unknown): UserPreference => {
  if (!value || typeof value !== 'object') return createEmptyPreference()

  const preference = value as Partial<UserPreference>
  const likedFoods = Array.isArray(preference.likedFoods)
    ? preference.likedFoods.filter(isPreferenceFood)
    : []
  const dislikedFoods = Array.isArray(preference.dislikedFoods)
    ? preference.dislikedFoods.filter(isPreferenceFood)
    : []
  const tastes = buildTastePreference(likedFoods, dislikedFoods)

  return {
    likedFoods,
    dislikedFoods,
    ...tastes,
  }
}

const toPreferenceFood = (food: Food): PreferenceFood => ({
  foodName: food.name,
  price: food.price,
  tags: [...food.tags],
})

export const getPreference = (): UserPreference => {
  const storedPreference: unknown = wx.getStorageSync(USER_PREFERENCE_KEY)
  return normalizePreference(storedPreference)
}

export const savePreference = (preference: UserPreference) => {
  const normalizedPreference = normalizePreference(preference)
  wx.setStorageSync(USER_PREFERENCE_KEY, normalizedPreference)
  return normalizedPreference
}

export const addLike = (food: Food): UserPreference => {
  const preference = getPreference()
  const likedFood = toPreferenceFood(food)
  const likedFoods = [
    ...preference.likedFoods.filter(item => item.foodName !== food.name),
    likedFood,
  ]
  const dislikedFoods = preference.dislikedFoods.filter(item => item.foodName !== food.name)

  return savePreference({
    ...preference,
    likedFoods,
    dislikedFoods,
  })
}

export const addDislike = (food: Food): UserPreference => {
  const preference = getPreference()
  const dislikedFood = toPreferenceFood(food)
  const likedFoods = preference.likedFoods.filter(item => item.foodName !== food.name)
  const dislikedFoods = [
    ...preference.dislikedFoods.filter(item => item.foodName !== food.name),
    dislikedFood,
  ]

  return savePreference({
    ...preference,
    likedFoods,
    dislikedFoods,
  })
}

export const clearPreference = () => {
  wx.setStorageSync(USER_PREFERENCE_KEY, createEmptyPreference())
}
