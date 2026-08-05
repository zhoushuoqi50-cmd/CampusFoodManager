Page({

  data: {
    inputText: "",
    messages: [
      {
        role: "ai",
        content: "你好，我是小饭AI 🤖\n今天想吃什么？"
      }
    ]
  },


  // 输入框
  inputChange(e:any){

    this.setData({
      inputText:e.detail.value
    })

  },


  // AI推荐按钮
  sendMessage(){

    let foods = [
      "🍜 麻辣烫 💰15-20元\n推荐理由：适合想吃辣又想快速解决午饭的同学",
      "🍚 黄焖鸡米饭 💰16元左右\n推荐理由：份量足，适合下午有课",
      "🥟 饺子套餐 💰12-18元\n推荐理由：清淡耐吃，不容易踩雷",
      "🍗 鸡排饭 💰15元左右\n推荐理由：蛋白质丰富，吃完比较有满足感",
      "🍲 牛肉粉 💰18元左右\n推荐理由：天气冷的时候很舒服"
    ]


    let index = Math.floor(
      Math.random() * foods.length
    )


    let userMessage = {
      role:"user",
      content:this.data.inputText || "今天吃什么？"
    }


    let aiMessage = {
      role:"ai",
      content:
      "✨ 推荐给你：\n\n"
      +
      foods[index]
    }


    let newMessages = [
      ...this.data.messages,
      userMessage,
      aiMessage
    ]


    this.setData({

      messages:newMessages,

      inputText:""

    })

  },
  changeFood(){

    let foods=[
    "🍜 麻辣烫",
    "🍚 黄焖鸡米饭",
    "🍗 鸡排饭",
    "🥟 饺子套餐"
    ]
   
    let index=Math.floor(
      Math.random()*foods.length
    )
   
   
    this.setData({
   
    messages:[
      ...this.data.messages,
      {
       role:"ai",
       content:"🔄 换一个推荐：\n\n"+foods[index]
      }
    ]
   
    })
   
   }

})