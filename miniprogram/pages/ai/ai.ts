import { foodData } from '../../utils/foodData'
import {
  buildRecommendationMessage,
  FoodNeeds,
  parseFoodNeeds,
  recommendFood,
} from '../../utils/foodRecommend'
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
    return '还没有推荐记录，先告诉我你想吃什么吧。'
  }

  const historyLines = [...histories]
    .reverse()
    .map((history, index) => {
      const requirement = history.requirement || '未指定需求'
      return `${index + 1}. ${history.foodName} ${history.price}元\n${formatHistoryTime(history.recommendedAt)} · ${requirement}`
    })

  return `📋 最近推荐记录：\n\n${historyLines.join('\n\n')}`
}

Page({
  data: {
    inputText: '',
    isLoading: false,
    scrollIntoView: '',
    messages: [
      {
        role: 'ai',
        content: '你好，我是小饭AI 🤖\n今天想吃什么？',
      },
    ],
  },

  onShow() {
    if (!getProfile() && !isProfileGuideShowing) {
      this.showProfileGuide()
    }
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
      {
        role: 'user',
        content: userText,
      },
    ]

    this.setData({
      inputText: '',
      isLoading: true,
      messages: userMessages,
      scrollIntoView: `message-${userMessages.length - 1}`,
    })
    wx.showLoading({
      title: '小饭思考中',
      mask: true,
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
        {
          role: 'ai',
          content: buildRecommendationMessage(recommendation),
          feedbackFoodName: recommendation.food.name,
        },
      ]

      wx.hideLoading()
      this.setData({
        isLoading: false,
        messages,
        scrollIntoView: `message-${messages.length - 1}`,
      })
    }, 300)
  },

  changeFood() {
    if (this.data.isLoading) return

    const needs = latestNeeds || parseFoodNeeds('')
    this.setData({ isLoading: true })
    wx.showLoading({
      title: '正在换一道',
      mask: true,
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
        {
          role: 'ai',
          content: buildRecommendationMessage(recommendation, true),
          feedbackFoodName: recommendation.food.name,
        },
      ]

      wx.hideLoading()
      this.setData({
        isLoading: false,
        messages,
        scrollIntoView: `message-${messages.length - 1}`,
      })
    }, 300)
  },

  showRecentRecommendations() {
    const histories = getRecommendationHistory()
    const messages = [
      ...this.data.messages,
      {
        role: 'ai',
        content: buildHistoryMessage(histories),
      },
    ]

    this.setData({
      messages,
      scrollIntoView: `message-${messages.length - 1}`,
    })
  },

  likeRecommendation(e: WechatMiniprogram.BaseEvent) {
    const foodName = e.currentTarget.dataset.foodName as string
    const food = foodData.find(item => item.name === foodName)
    if (!food) return

    addLike(food)
    learnFromLikedFood(food.name)
    wx.showToast({
      title: `已记住你喜欢${food.name}`,
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
      title: `已减少推荐${food.name}`,
      icon: 'none',
    })
  },
})
