import { foodData } from '../../utils/foodData'

const getFoodByName = (name: string) => {
  return foodData.find(food => food.name === name) || foodData[0]
}

Page({

  data: {

    inputText:"",

    messages:[

      {
        role:"ai",
        content:"你好，我是小饭AI 🤖\n今天想吃什么？"
      }

    ]

  },


  // 输入框
  inputChange(e:any){

    this.setData({

      inputText:e.detail.value

    })

  },


  // AI推荐
  sendMessage(){


    let userText=this.data.inputText

    const recommendFoodNames = ["麻辣香锅", "鸡蛋盖饭", "黄焖鸡米饭", "饺子套餐"]

    const recommendFoods = recommendFoodNames.map(getFoodByName)


    let result=getFoodByName("麻辣香锅")


    // 判断用户需求

    if(userText.includes("辣")){

      result=getFoodByName("麻辣香锅")

    }

    else if(userText.includes("便宜")
      || userText.includes("省钱")){

      result=getFoodByName("饺子套餐")

    }

    else if(userText.includes("饱")
      || userText.includes("吃饱")){

      result=getFoodByName("鸡蛋盖饭")

    }

    else if(userText.includes("清淡")){

      result=getFoodByName("饺子套餐")

    }

    else{

      let index=Math.floor(
        Math.random()*recommendFoods.length
      )

      result=recommendFoods[index]

    }



    let newMessages=[

      ...this.data.messages,

      {
        role:"user",
        content:userText
      },

      {
        role:"ai",
        content:
        `✨ 推荐给你：${result.name}
💰价格：${result.price}元

原因：${result.reason}`
      }

    ]


    this.setData({

      messages:newMessages,

      inputText:""

    })


  },



  // 换一个
  changeFood(){


    const changeFoodNames = ["麻辣香锅", "黄焖鸡米饭", "鸡排饭", "饺子套餐"]

    const changeFoods = changeFoodNames.map(getFoodByName)

    let index = 0

let text = this.data.inputText

if(text.includes("辣")){
 index = 0
}

else if(text.includes("便宜") || text.includes("省钱")){
 index = 3
}

else if(text.includes("吃饱")){
 index = 2
}

else{
 index = Math.floor(Math.random()*changeFoods.length)
}


    this.setData({

      messages:[

        ...this.data.messages,

        {

          role:"ai",

          content:
          `🔄 换一个推荐：

${changeFoods[index].name} ${changeFoods[index].price}元`

        }

      ]

    })


  }


})
