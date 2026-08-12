import { getRecommendationHistory } from '../../utils/storage'
import { clearProfile, getProfile } from '../../utils/userProfile'

Page({
  data: {
    hasProfile: false,
    budgetPreference: '未设置',
    favoriteTypes: '未设置',
    favoriteTags: '未设置',
    recommendationCount: 0,
  },

  onShow() {
    this.loadProfile()
  },

  loadProfile() {
    const profile = getProfile()
    this.setData({
      hasProfile: Boolean(profile),
      budgetPreference: profile && profile.budgetPreference !== null
        ? `${profile.budgetPreference}元左右`
        : '未设置',
      favoriteTypes: profile && profile.favoriteTypes.length > 0
        ? profile.favoriteTypes.join('、')
        : '未设置',
      favoriteTags: profile && profile.favoriteTags.length > 0
        ? profile.favoriteTags.join('、')
        : '未设置',
      recommendationCount: getRecommendationHistory().length,
    })
  },

  clearDietProfile() {
    wx.showModal({
      title: '清除饮食画像',
      content: '清除后，AI推荐将恢复默认状态。',
      success: result => {
        if (!result.confirm) return

        clearProfile()
        this.loadProfile()
        wx.showToast({
          title: '画像已清除',
          icon: 'success',
        })
      },
    })
  },
})
