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
    tags: ['辣', '重口味', '下饭', '饱腹', '肉类', '热食'],
    type: '香锅',
    reason: '辣味十足，适合想吃刺激口味的时候',
  },
  {
    name: '麻辣烫',
    price: 17,
    tags: ['辣', '热食', '汤', '肉类'],
    type: '汤',
    reason: '热辣开胃，配菜也可以灵活选择',
  },
  {
    name: '鸡蛋盖饭',
    price: 15,
    tags: ['便宜', '饱腹', '清淡', '不辣', '素食', '快速'],
    type: '米饭',
    reason: '价格实惠，适合学生党',
  },
  {
    name: '黄焖鸡米饭',
    price: 16,
    tags: ['下饭', '肉类', '正常', '饱腹', '不辣', '热食'],
    type: '米饭',
    reason: '肉多饭足，适合想吃饱',
  },
  {
    name: '鸡排饭',
    price: 15,
    tags: ['便宜', '饱腹', '肉类', '不辣', '快速'],
    type: '米饭',
    reason: '价格实惠，鸡排配米饭也很饱腹',
  },
  {
    name: '饺子套餐',
    price: 12,
    tags: ['便宜', '清淡', '不辣', '快速'],
    type: '面食',
    reason: '价格低，不容易踩雷',
  },
  {
    name: '番茄鸡蛋面',
    price: 14,
    tags: ['酸', '清淡', '不辣', '饱腹', '素食', '热食'],
    type: '面',
    reason: '酸香清爽，热乎又饱腹',
  },
  {
    name: '紫菜蛋花汤',
    price: 8,
    tags: ['清淡', '不辣', '素食', '热食', '快速'],
    type: '汤',
    reason: '口味清淡，喝起来暖和又省时',
  },
  {
    name: '红糖糍粑',
    price: 10,
    tags: ['甜', '不辣', '素食'],
    type: '小吃',
    reason: '甜味能带来满足感，适合想吃点小食的时候',
  },
  {
    name: '凉拌素菜',
    price: 10,
    tags: ['酸', '清淡', '不辣', '素食', '快速'],
    type: '素食',
    reason: '清爽少负担，适合简单吃一点',
  },
]
