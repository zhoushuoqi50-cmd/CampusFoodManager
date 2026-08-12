import {
  FavoriteFood,
  getFavorites,
  removeFavorite,
} from '../../utils/favoriteStorage'

interface FavoriteFoodView extends FavoriteFood {
  timeText: string
}

const formatFavoriteTime = (favoritedAt: number) => {
  const date = new Date(favoritedAt)
  const now = new Date()
  const pad = (value: number) => value.toString().padStart(2, '0')
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const targetStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  const dayDifference = Math.round((todayStart - targetStart) / (24 * 60 * 60 * 1000))

  if (dayDifference === 0) return `今天 ${time}`
  if (dayDifference === 1) return `昨天 ${time}`
  if (date.getFullYear() === now.getFullYear()) {
    return `${pad(date.getMonth() + 1)}月${pad(date.getDate())}日 ${time}`
  }
  return `${date.getFullYear()}年${pad(date.getMonth() + 1)}月${pad(date.getDate())}日 ${time}`
}

const toFavoriteView = (favorite: FavoriteFood): FavoriteFoodView => ({
  ...favorite,
  timeText: formatFavoriteTime(favorite.favoritedAt),
})

Page({
  data: {
    favorites: [] as FavoriteFoodView[],
  },

  onShow() {
    this.loadFavorites()
  },

  loadFavorites() {
    const favorites = [...getFavorites()]
      .reverse()
      .map(toFavoriteView)
    this.setData({ favorites })
  },

  removeFavoriteFood(e: WechatMiniprogram.BaseEvent) {
    const foodName = e.currentTarget.dataset.foodName as string
    wx.showModal({
      title: '取消收藏',
      content: `确定将“${foodName}”移出收藏吗？`,
      success: result => {
        if (!result.confirm) return

        removeFavorite(foodName)
        this.loadFavorites()
        wx.showToast({
          title: '已取消收藏',
          icon: 'none',
        })
      },
    })
  },

  goToAi() {
    wx.switchTab({
      url: '/pages/ai/ai',
    })
  },
})
