export interface Food {
  name: string
  price: number
  tags: string[]
  type: string
  reason: string
}

export const foodData: Food[] = [
  {
    name: '麻辣香锅',
    price: 18,
    tags: ['辣', '重口味', '下饭'],
    type: '香锅',
    reason: '辣味十足，适合想吃刺激口味的时候',
  },
  {
    name: '鸡蛋盖饭',
    price: 15,
    tags: ['便宜', '饱腹', '清淡'],
    type: '米饭',
    reason: '价格实惠，适合学生党',
  },
  {
    name: '黄焖鸡米饭',
    price: 16,
    tags: ['下饭', '肉类', '正常'],
    type: '米饭',
    reason: '肉多饭足，适合想吃饱',
  },
  {
    name: '鸡排饭',
    price: 15,
    tags: ['便宜', '饱腹', '肉类'],
    type: '米饭',
    reason: '价格实惠，鸡排配米饭也很饱腹',
  },
  {
    name: '饺子套餐',
    price: 12,
    tags: ['便宜', '清淡'],
    type: '面食',
    reason: '价格低，不容易踩雷',
  },
]
