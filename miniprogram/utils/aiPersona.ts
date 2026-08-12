import type { FoodNeeds, FoodRecommendation } from './foodRecommend'

const getSceneOpening = (needs: FoodNeeds) => {
  if (needs.scenes.includes('考试累了')) {
    return '辛苦啦，先吃点热乎满足的缓一缓～'
  }
  if (needs.scenes.includes('心情不好')) {
    return '今天先别难为自己，吃点有满足感的吧。'
  }
  if (needs.scenes.includes('赶时间')) {
    return '时间紧，小饭给你挑个省事的。'
  }
  if (needs.scenes.includes('上课前')) {
    return '上课前先把肚子照顾好，小饭选了个合适的。'
  }
  return '小饭帮你挑好啦～'
}

const buildFoodDetails = (recommendation: FoodRecommendation) => {
  const { food, reasons } = recommendation
  const details = reasons.length > 0 ? reasons : [food.reason]
  return [`价格${food.price}元`, ...details]
    .map((detail, index, all) => `${detail}${index === all.length - 1 ? '。' : '，'}`)
    .join('\n')
}

export const buildWelcomeMessage = () => {
  return '嗨，我是小饭，你的校园吃饭搭子 🤖\n预算、口味、心情都可以告诉我，今天吃什么交给我吧～'
}

export const buildRecommendationReply = (
  recommendation: FoodRecommendation,
  needs: FoodNeeds
) => {
  return `${getSceneOpening(needs)}\n\n✨ 推荐给你：${recommendation.food.name}\n\n${buildFoodDetails(recommendation)}`
}

export const buildChangeReply = (
  recommendation: FoodRecommendation,
  needs: FoodNeeds
) => {
  const sceneOpening = needs.scenes.length > 0
    ? getSceneOpening(needs)
    : '这道不心动？小饭再给你换一个～'
  return `${sceneOpening}\n\n🔄 换成：${recommendation.food.name}\n\n${buildFoodDetails(recommendation)}`
}

export const buildLikeReply = (foodName: string) => {
  return `记住啦，你喜欢${foodName}，下次小饭会更懂你～`
}

export const buildDislikeReply = (foodName: string) => {
  return `收到，${foodName}先少出现，小饭继续学习你的口味。`
}

export const buildFavoriteReply = (foodName: string, favoriteState: boolean) => {
  return favoriteState
    ? `${foodName}已经帮你收好啦～`
    : `${foodName}已从收藏里移除。`
}

export const buildHistoryEmptyMessage = () => {
  return '小饭这里还没有推荐记录，先告诉我今天想吃什么吧～'
}

export const buildHistoryTitle = () => {
  return '📋 小饭最近给你推荐过：'
}
