import { foodData } from '../../utils/foodData'
import {
  isFavorite,
  toggleFavorite,
} from '../../utils/favoriteStorage'
import {
  FoodNeeds,
  parseFoodNeeds,
  recommendFood,
} from '../../utils/foodRecommend'
import type { FoodRecommendation } from '../../utils/foodRecommend'
import {
  buildChangeReply,
  buildDislikeReply,
  buildFavoriteReply,
  buildHistoryEmptyMessage,
  buildHistoryTitle,
  buildLikeReply,
  buildRecommendationReply,
  buildWelcomeMessage,
} from '../../utils/aiPersona'
import {
  getRecommendationHistory,
  RecommendationHistory,
  saveRecommendationHistory,
} from '../../utils/storage'
import {
  addDislike,
  addLike,
  getPreference,
} from '../../utils/userPreference'
import {
  getProfile,
  saveProfile,
  updateProfile,
} from '../../utils/userProfile'

let latestNeeds: FoodNeeds | null = null
let recentRecommendedFoods: string[] = []
let isProfileGuideShowing = false
let messageIdSeed = 0

type ChatRole = 'ai' | 'user'

interface RecommendationCard {
  price: number
  type: string
  tags: string[]
  reasons: string[]
}

interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  foodName: string
  canFeedback: boolean
  isFavorite: boolean
  requirement: string
  recommendationCard: RecommendationCard | null
}

const createMessage = (
  role: ChatRole,
  content: string,
  options: Partial<Pick<ChatMessage, 'foodName' | 'canFeedback' | 'isFavorite' | 'requirement' | 'recommendationCard'>> = {}
): ChatMessage => {
  messageIdSeed += 1
  return {
    id: `message-${Date.now()}-${messageIdSeed}`,
    role,
    content,
    foodName: options.foodName || '',
    canFeedback: options.canFeedback || false,
    isFavorite: options.isFavorite || false,
    requirement: options.requirement || '',
    recommendationCard: options.recommendationCard || null,
  }
}

const getPersonaOpening = (reply: string) => {
  return reply.split('\n\n')[0]
}

const createRecommendationCard = (
  recommendation: FoodRecommendation
): RecommendationCard => {
  return {
    price: recommendation.food.price,
    type: recommendation.food.type,
    tags: recommendation.food.tags
      .filter(tag => tag !== recommendation.food.type)
      .slice(0, 4),
    reasons: recommendation.reasons.length > 0
      ? recommendation.reasons.slice(0, 4)
      : [recommendation.food.reason],
  }
}

const PROFILE_TAGS = ['辣', '不辣', '清淡', '甜', '酸', '重口味', '正常']

const unique = (items: string[]) => Array.from(new Set(items))

const getProfileType = (foodType: string, tags: string[]) => {
  if (foodType.includes('米饭') || foodType.includes('盖饭')) return '米饭'
  if (foodType.includes('面')) return '面食'
  if (foodType.includes('汤')) return '汤类'
  if (foodType.includes('小吃')) return '小吃'
  if (tags.includes('热食') || foodType.includes('香锅')) return '热菜'
  return foodType
}

const learnFromRequirement = (needs: FoodNeeds) => {
  const profile = getProfile()
  if (!profile) return

  const eatingHabits = unique([
    ...profile.eatingHabits,
    ...(needs.fullness ? [needs.fullness] : []),
    ...needs.scenes,
  ])

  updateProfile({
    budgetPreference: needs.budget === undefined
      ? profile.budgetPreference
      : needs.budget,
    eatingHabits,
  })
}

const learnFromLikedFood = (foodName: string) => {
  const food = foodData.find(item => item.name === foodName)
  if (!food) return

  const preference = getPreference()
  const profile = getProfile()
  if (!profile) return

  const averagePrice = preference.likedFoods.length > 0
    ? Math.round(
      preference.likedFoods.reduce((total, item) => total + item.price, 0)
      / preference.likedFoods.length
    )
    : food.price
  const favoriteTags = unique([
    ...profile.favoriteTags,
    ...food.tags.filter(tag => PROFILE_TAGS.includes(tag)),
  ])

  updateProfile({
    budgetPreference: averagePrice,
    favoriteTypes: unique([
      ...profile.favoriteTypes,
      getProfileType(food.type, food.tags),
    ]),
    favoriteTags,
    dislikedTags: profile.dislikedTags.filter(tag => !favoriteTags.includes(tag)),
  })
}

const learnFromDislikedFood = (foodName: string) => {
  const food = foodData.find(item => item.name === foodName)
  const profile = getProfile()
  if (!food || !profile) return

  const dislikedTags = unique([
    ...profile.dislikedTags,
    ...food.tags.filter(tag => PROFILE_TAGS.includes(tag)),
  ])

  updateProfile({
    favoriteTags: profile.favoriteTags.filter(tag => !dislikedTags.includes(tag)),
    dislikedTags,
  })
}

const saveRecommendedFood = (foodName: string) => {
  recentRecommendedFoods = [
    ...recentRecommendedFoods.filter(name => name !== foodName),
    foodName,
  ].slice(-3)
}

const saveHistory = (foodName: string, price: number, needs: FoodNeeds) => {
  saveRecommendationHistory({
    foodName,
    price,
    recommendedAt: Date.now(),
    requirement: needs.rawText,
  })
}

const formatHistoryTime = (recommendedAt: number) => {
  const date = new Date(recommendedAt)
  const pad = (value: number) => value.toString().padStart(2, '0')
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const buildHistoryMessage = (histories: RecommendationHistory[]) => {
  if (histories.length === 0) {
    return buildHistoryEmptyMessage()
  }

  const historyLines = [...histories]
    .reverse()
    .map((history, index) => {
      const requirement = history.requirement || '未指定需求'
      return `${index + 1}. ${history.foodName} ${history.price}元\n${formatHistoryTime(history.recommendedAt)} · ${requirement}`
    })

  return `${buildHistoryTitle()}\n\n${historyLines.join('\n\n')}`
}

Page({
  data: {
    inputText: '',
    isLoading: false,
    scrollIntoView: '',
    quickPrompts: [
      '20元以内想吃辣',
      '想吃清淡',
      '赶时间',
      '不知道吃什么',
    ],
    messages: [
      createMessage('ai', buildWelcomeMessage()),
    ] as ChatMessage[],
  },

  onShow() {
    this.syncFavoriteStates()
    if (!getProfile() && !isProfileGuideShowing) {
      this.showProfileGuide()
    }
  },

  syncFavoriteStates() {
    const messages = this.data.messages.map(message => ({
      ...message,
      isFavorite: message.foodName ? isFavorite(message.foodName) : false,
    }))
    this.setData({ messages })
  },

  showProfileGuide() {
    isProfileGuideShowing = true
    wx.showModal({
      title: '小饭想更懂你～',
      content: '回答三个小问题，我会根据你的预算、类型和口味推荐。',
      confirmText: '开始设置',
      cancelText: '稍后再说',
      success: modalResult => {
        if (!modalResult.confirm) {
          isProfileGuideShowing = false
          return
        }

        wx.showActionSheet({
          itemList: ['10元以内', '15-20元', '20元以上'],
          success: budgetResult => {
            const budgets = [10, 20, 30]
            const budgetPreference = budgets[budgetResult.tapIndex]

            wx.showActionSheet({
              itemList: ['米饭', '面食', '汤类', '小吃'],
              success: typeResult => {
                const types = ['米饭', '面食', '汤类', '小吃']
                const favoriteType = types[typeResult.tapIndex]

                wx.showActionSheet({
                  itemList: ['辣', '清淡', '甜', '正常'],
                  success: tagResult => {
                    const tags = ['辣', '清淡', '甜', '正常']
                    saveProfile({
                      budgetPreference,
                      favoriteTypes: [favoriteType],
                      favoriteTags: [tags[tagResult.tapIndex]],
                      dislikedTags: [],
                      eatingHabits: [],
                      updatedAt: Date.now(),
                    })
                    isProfileGuideShowing = false
                    wx.showToast({
                      title: '饮食画像已保存',
                      icon: 'success',
                    })
                  },
                  fail: () => { isProfileGuideShowing = false },
                })
              },
              fail: () => { isProfileGuideShowing = false },
            })
          },
          fail: () => { isProfileGuideShowing = false },
        })
      },
      fail: () => { isProfileGuideShowing = false },
    })
  },

  inputChange(e: WechatMiniprogram.Input) {
    this.setData({
      inputText: e.detail.value,
    })
  },

  useQuickPrompt(e: WechatMiniprogram.BaseEvent) {
    if (this.data.isLoading) return

    const prompt = e.currentTarget.dataset.prompt as string
    this.setData({ inputText: prompt }, () => {
      this.sendMessage()
    })
  },

  sendMessage() {
    if (this.data.isLoading) return

    const userText = this.data.inputText.trim()
    if (!userText) {
      wx.showToast({
        title: '请先告诉我想吃什么',
        icon: 'none',
      })
      return
    }

    const currentNeeds = parseFoodNeeds(userText)
    latestNeeds = currentNeeds
    recentRecommendedFoods = []
    const userMessages = [
      ...this.data.messages,
      createMessage('user', userText),
    ]

    this.setData({
      inputText: '',
      isLoading: true,
      messages: userMessages,
    }, () => {
      this.setData({ scrollIntoView: 'loading-message' })
    })

    setTimeout(() => {
      const recommendation = recommendFood(
        foodData,
        currentNeeds,
        [],
        getPreference(),
        getProfile()
      )
      saveRecommendedFood(recommendation.food.name)
      saveHistory(recommendation.food.name, recommendation.food.price, currentNeeds)
      learnFromRequirement(currentNeeds)
      const messages = [
        ...this.data.messages,
        createMessage('ai', getPersonaOpening(buildRecommendationReply(recommendation, currentNeeds)), {
          foodName: recommendation.food.name,
          canFeedback: true,
          isFavorite: isFavorite(recommendation.food.name),
          requirement: currentNeeds.rawText,
          recommendationCard: createRecommendationCard(recommendation),
        }),
      ]

      this.setData({
        isLoading: false,
        messages,
      }, () => {
        this.setData({ scrollIntoView: messages[messages.length - 1].id })
      })
    }, 300)
  },

  changeFood() {
    if (this.data.isLoading) return

    const needs = latestNeeds || parseFoodNeeds('')
    this.setData({
      isLoading: true,
    }, () => {
      this.setData({ scrollIntoView: 'loading-message' })
    })

    setTimeout(() => {
      const recommendation = recommendFood(
        foodData,
        needs,
        recentRecommendedFoods,
        getPreference(),
        getProfile()
      )
      latestNeeds = needs
      saveRecommendedFood(recommendation.food.name)
      saveHistory(recommendation.food.name, recommendation.food.price, needs)
      const messages = [
        ...this.data.messages,
        createMessage('ai', getPersonaOpening(buildChangeReply(recommendation, needs)), {
          foodName: recommendation.food.name,
          canFeedback: true,
          isFavorite: isFavorite(recommendation.food.name),
          requirement: needs.rawText,
          recommendationCard: createRecommendationCard(recommendation),
        }),
      ]

      this.setData({
        isLoading: false,
        messages,
      }, () => {
        this.setData({ scrollIntoView: messages[messages.length - 1].id })
      })
    }, 300)
  },

  showRecentRecommendations() {
    const histories = getRecommendationHistory()
    const messages = [
      ...this.data.messages,
      createMessage('ai', buildHistoryMessage(histories)),
    ]

    this.setData({
      messages,
    }, () => {
      this.setData({ scrollIntoView: messages[messages.length - 1].id })
    })
  },

  likeRecommendation(e: WechatMiniprogram.BaseEvent) {
    const foodName = e.currentTarget.dataset.foodName as string
    const food = foodData.find(item => item.name === foodName)
    if (!food) return

    addLike(food)
    learnFromLikedFood(food.name)
    wx.showToast({
      title: buildLikeReply(food.name),
      icon: 'none',
    })
  },

  toggleFavoriteFood(e: WechatMiniprogram.BaseEvent) {
    const foodName = e.currentTarget.dataset.foodName as string
    const requirement = (e.currentTarget.dataset.requirement as string) || ''
    const food = foodData.find(item => item.name === foodName)
    if (!food) return

    const favoriteState = toggleFavorite(food, requirement)
    const messages = this.data.messages.map(message => {
      return message.foodName === foodName
        ? { ...message, isFavorite: favoriteState }
        : message
    })
    this.setData({ messages })
    wx.showToast({
      title: buildFavoriteReply(food.name, favoriteState),
      icon: 'none',
    })
  },

  dislikeRecommendation(e: WechatMiniprogram.BaseEvent) {
    const foodName = e.currentTarget.dataset.foodName as string
    const food = foodData.find(item => item.name === foodName)
    if (!food) return

    addDislike(food)
    learnFromDislikedFood(food.name)
    saveRecommendedFood(food.name)
    wx.showToast({
      title: buildDislikeReply(food.name),
      icon: 'none',
    })
  },
})
