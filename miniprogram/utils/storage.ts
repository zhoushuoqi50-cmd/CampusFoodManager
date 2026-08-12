const RECOMMENDATION_HISTORY_KEY = 'recommendationHistory'
const MAX_HISTORY_COUNT = 20

export interface RecommendationHistory {
  foodName: string
  price: number
  recommendedAt: number
  requirement: string
}

const isRecommendationHistory = (value: unknown): value is RecommendationHistory => {
  if (!value || typeof value !== 'object') return false

  const history = value as RecommendationHistory
  return typeof history.foodName === 'string'
    && typeof history.price === 'number'
    && typeof history.recommendedAt === 'number'
    && typeof history.requirement === 'string'
}

export const getRecommendationHistory = (): RecommendationHistory[] => {
  const storedHistory: unknown = wx.getStorageSync(RECOMMENDATION_HISTORY_KEY)
  if (!Array.isArray(storedHistory)) return []

  return storedHistory.filter(isRecommendationHistory)
}

export const saveRecommendationHistory = (history: RecommendationHistory) => {
  const histories = [...getRecommendationHistory(), history].slice(-MAX_HISTORY_COUNT)
  wx.setStorageSync(RECOMMENDATION_HISTORY_KEY, histories)
}

export const clearRecommendationHistory = () => {
  wx.setStorageSync(RECOMMENDATION_HISTORY_KEY, [])
}
