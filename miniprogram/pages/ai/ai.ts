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

let latestNeeds: FoodNeeds | null = null
let recentRecommendedFoods: string[] = []

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
      const recommendation = recommendFood(foodData, currentNeeds, [], getPreference())
      saveRecommendedFood(recommendation.food.name)
      saveHistory(recommendation.food.name, recommendation.food.price, currentNeeds)
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
        getPreference()
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
    saveRecommendedFood(food.name)
    wx.showToast({
      title: `已减少推荐${food.name}`,
      icon: 'none',
    })
  },
})
