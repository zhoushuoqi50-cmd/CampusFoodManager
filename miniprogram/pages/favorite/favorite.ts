import {
  FavoriteFood,
  getFavorites,
  removeFavorite,
} from '../../utils/favoriteStorage'

interface FavoriteFoodView extends FavoriteFood {
  tagsText: string
  timeText: string
}

const formatFavoriteTime = (favoritedAt: number) => {
  const date = new Date(favoritedAt)
  const pad = (value: number) => value.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const toFavoriteView = (favorite: FavoriteFood): FavoriteFoodView => ({
  ...favorite,
  tagsText: favorite.tags.join(' · '),
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
      content: `确定不再收藏${foodName}吗？`,
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
