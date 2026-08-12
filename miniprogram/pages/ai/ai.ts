import { foodData } from '../../utils/foodData'
import {
  buildRecommendationMessage,
  FoodNeeds,
  parseFoodNeeds,
  recommendFood,
} from '../../utils/foodRecommend'

let latestNeeds: FoodNeeds | null = null
let recentRecommendedFoods: string[] = []

const saveRecommendedFood = (foodName: string) => {
  recentRecommendedFoods = [
    ...recentRecommendedFoods.filter(name => name !== foodName),
    foodName,
  ].slice(-3)
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

    latestNeeds = parseFoodNeeds(userText)
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
      const recommendation = recommendFood(foodData, latestNeeds as FoodNeeds)
      saveRecommendedFood(recommendation.food.name)
      const messages = [
        ...this.data.messages,
        {
          role: 'ai',
          content: buildRecommendationMessage(recommendation),
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
      const recommendation = recommendFood(foodData, needs, recentRecommendedFoods)
      latestNeeds = needs
      saveRecommendedFood(recommendation.food.name)
      const messages = [
        ...this.data.messages,
        {
          role: 'ai',
          content: buildRecommendationMessage(recommendation, true),
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
})
