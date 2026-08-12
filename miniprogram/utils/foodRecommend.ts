import type { Food } from './foodData'

export type Taste = '辣' | '不辣' | '清淡' | '甜' | '酸'
export type Fullness = '饱腹' | '轻量' | '耐饿'
export type FoodType = '米饭' | '面' | '汤' | '小吃' | '肉' | '素食'
export type Scene = '考试累了' | '心情不好' | '赶时间' | '上课前'

export interface FoodNeeds {
  rawText: string
  budget?: number
  tastes: Taste[]
  fullness?: Fullness
  types: FoodType[]
  excludedTypes: FoodType[]
  scenes: Scene[]
}

export interface FoodRecommendation {
  food: Food
  score: number
  reasons: string[]
}

const chineseDigits: Record<string, number> = {
  零: 0,
  一: 1,
  二: 2,
  两: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
}

const parseChineseNumber = (text: string): number | undefined => {
  if (text.includes('十')) {
    const [tensText, unitsText] = text.split('十')
    const tens = tensText ? chineseDigits[tensText] : 1
    const units = unitsText ? chineseDigits[unitsText] : 0
    return tens === undefined || units === undefined ? undefined : tens * 10 + units
  }

  const digits = text.split('').map(char => chineseDigits[char])
  return digits.some(digit => digit === undefined)
    ? undefined
    : Number(digits.join(''))
}

const parseBudget = (text: string): number | undefined => {
  const arabicMatch = text.match(
    /(\d+(?:\.\d+)?)\s*(?:(?:元|块(?:钱)?)\s*(?:以内|以下|左右)?|(?:以内|以下|左右))/
  )
  if (arabicMatch) {
    return Number(arabicMatch[1])
  }

  const chineseMatch = text.match(
    /([零一二两三四五六七八九十]+)\s*(?:(?:元|块(?:钱)?)\s*(?:以内|以下|左右)?|(?:以内|以下|左右))/
  )
  if (chineseMatch) {
    return parseChineseNumber(chineseMatch[1])
  }

  return /便宜|省钱|实惠/.test(text) ? 15 : undefined
}

const includesAny = (text: string, keywords: string[]) => {
  return keywords.some(keyword => text.includes(keyword))
}

const unique = <T>(items: T[]): T[] => Array.from(new Set(items))

export const parseFoodNeeds = (rawText: string): FoodNeeds => {
  const text = rawText.replace(/\s+/g, '')
  const doesNotWantSpicy = /不想吃辣|不要辣|拒绝辣|不喜欢辣|别放辣|不辣/.test(text)

  const tastes: Taste[] = []
  if (doesNotWantSpicy) tastes.push('不辣')
  if (text.includes('辣') && !doesNotWantSpicy) tastes.push('辣')
  if (text.includes('清淡')) tastes.push('清淡')
  if (text.includes('甜')) tastes.push('甜')
  if (text.includes('酸')) tastes.push('酸')

  const typeRules: Array<{ type: FoodType; keywords: string[] }> = [
    { type: '米饭', keywords: ['米饭', '盖饭', '饭'] },
    { type: '面', keywords: ['面条', '吃面', '面食', '面'] },
    { type: '汤', keywords: ['喝汤', '汤'] },
    { type: '小吃', keywords: ['小吃', '零食'] },
    { type: '肉', keywords: ['吃肉', '肉'] },
    { type: '素食', keywords: ['素食', '吃素', '素菜'] },
  ]

  const negativeTypeText = text.match(/(?:不想吃|不吃|不要|别吃)(米饭|饭|面条|面食|面|汤|小吃|肉|素食|素菜)/)
  const negativeTypeKeyword = negativeTypeText ? negativeTypeText[1] : ''
  const excludedTypes = typeRules
    .filter(rule => negativeTypeKeyword && rule.keywords.some(keyword => keyword.includes(negativeTypeKeyword) || negativeTypeKeyword.includes(keyword)))
    .map(rule => rule.type)
  const types = typeRules
    .filter(rule => includesAny(text, rule.keywords) && !excludedTypes.includes(rule.type))
    .map(rule => rule.type)

  let fullness: Fullness | undefined
  if (/吃饱|饿/.test(text)) fullness = '饱腹'
  if (/随便吃点|简单吃点|少吃点/.test(text)) fullness = '轻量'
  if (/下午有课/.test(text)) fullness = '耐饿'

  const scenes: Scene[] = []
  if (/考试.*(?:累|疲惫)|(?:累|疲惫).*考试/.test(text)) scenes.push('考试累了')
  if (/心情不好|不开心|难过/.test(text)) scenes.push('心情不好')
  if (/赶时间|来不及|着急/.test(text)) scenes.push('赶时间')
  if (/上课前|马上上课/.test(text)) scenes.push('上课前')

  return {
    rawText,
    budget: parseBudget(text),
    tastes: unique(tastes),
    fullness,
    types: unique(types),
    excludedTypes: unique(excludedTypes),
    scenes: unique(scenes),
  }
}

const matchesTaste = (food: Food, taste: Taste) => {
  return taste === '不辣' ? !food.tags.includes('辣') : food.tags.includes(taste)
}

const matchesType = (food: Food, type: FoodType) => {
  const typeAliases: Record<FoodType, string[]> = {
    米饭: ['米饭', '盖饭'],
    面: ['面', '面食'],
    汤: ['汤'],
    小吃: ['小吃'],
    肉: ['肉', '肉类'],
    素食: ['素食', '素菜'],
  }
  return typeAliases[type].some(alias => food.type.includes(alias) || food.tags.includes(alias))
}

const matchesFullness = (food: Food, fullness: Fullness) => {
  const fullnessTags: Record<Fullness, string[]> = {
    饱腹: ['饱腹', '下饭'],
    轻量: ['清淡', '小吃', '汤', '素食'],
    耐饿: ['饱腹', '下饭'],
  }
  return fullnessTags[fullness].some(tag => food.type.includes(tag) || food.tags.includes(tag))
}

const matchesScene = (food: Food, scene: Scene) => {
  const sceneTags: Record<Scene, string[]> = {
    考试累了: ['热食', '汤', '饱腹', '甜'],
    心情不好: ['甜', '热食', '辣'],
    赶时间: ['快速', '小吃', '面'],
    上课前: ['快速', '饱腹', '小吃'],
  }
  return sceneTags[scene].some(tag => food.type.includes(tag) || food.tags.includes(tag))
}

const scoreFood = (food: Food, needs: FoodNeeds): FoodRecommendation => {
  let score = 0
  const reasons: string[] = []

  const matchedTastes = needs.tastes.filter(taste => matchesTaste(food, taste))
  const hasTasteConflict = needs.tastes.some(taste => !matchesTaste(food, taste))
  if (matchedTastes.length > 0) {
    score += 3
    reasons.push(`满足${matchedTastes.join('、')}口味需求`)
  }
  if (hasTasteConflict) score -= 4

  const matchedTypes = needs.types.filter(type => matchesType(food, type))
  if (matchedTypes.length > 0) {
    score += 2
    reasons.push(`是你想吃的${matchedTypes.join('、')}类型`)
  }

  const hasExcludedType = needs.excludedTypes.some(type => matchesType(food, type))
  if (hasExcludedType) score -= 5

  if (needs.fullness && matchesFullness(food, needs.fullness)) {
    score += 2
    const fullnessReason: Record<Fullness, string> = {
      饱腹: '分量更适合吃饱',
      轻量: '适合随便简单吃点',
      耐饿: '比较饱腹，适合下午有课',
    }
    reasons.push(fullnessReason[needs.fullness])
  }

  const matchedScenes = needs.scenes.filter(scene => matchesScene(food, scene))
  if (matchedScenes.length > 0) {
    score += 1
    const sceneReason: Record<Scene, string> = {
      考试累了: '热乎满足，适合考试累的时候',
      心情不好: '能带来一些满足感',
      赶时间: '出餐方便，适合赶时间',
      上课前: '省时，适合上课前吃',
    }
    reasons.push(sceneReason[matchedScenes[0]])
  }

  if (needs.budget !== undefined) {
    if (food.price <= needs.budget) {
      score += 3
      reasons.push(`价格也符合${needs.budget}元预算`)
    } else {
      score -= 3
    }
  }

  return { food, score, reasons }
}

export const recommendFood = (
  foods: Food[],
  needs: FoodNeeds,
  excludedNames: string[] = []
): FoodRecommendation => {
  const availableFoods = foods.filter(food => !excludedNames.includes(food.name))
  const candidates = availableFoods.length > 0 ? availableFoods : foods
  const recommendations = candidates.map(food => scoreFood(food, needs))
  const sortedRecommendations = recommendations.sort((left, right) => {
    return right.score - left.score || left.food.price - right.food.price
  })

  if (sortedRecommendations[0].score <= 0) {
    const randomIndex = Math.floor(Math.random() * sortedRecommendations.length)
    return sortedRecommendations[randomIndex]
  }

  return sortedRecommendations[0]
}

export const buildRecommendationMessage = (
  recommendation: FoodRecommendation,
  isChange = false
): string => {
  const { food, reasons } = recommendation
  const details = reasons.length > 0 ? reasons : [food.reason]
  const detailLines = [`价格${food.price}元`, ...details]
    .map((detail, index, all) => `${detail}${index === all.length - 1 ? '。' : '，'}`)
    .join('\n')
  const title = isChange ? '🔄 换一个推荐：' : '✨ 推荐给你：'

  return `${title}\n${food.name}\n\n${detailLines}`
}
