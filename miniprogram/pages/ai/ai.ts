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
      {
        name:"麻辣香锅",
        price:18,
        tags:["辣","重口味","下饭"],
        reason:"符合你想吃辣的需求，而且价格适中"
      },
      {
        name:"黄焖鸡米饭",
        price:16,
        tags:["米饭","饱腹"],
        reason:"分量足，适合想吃饱的同学"
      },
      {
        name:"鸡排饭",
        price:15,
        tags:["米饭","便宜"],
        reason:"价格实惠，蛋白质丰富"
      },
      {
        name:"饺子套餐",
        price:12,
        tags:["便宜","快速"],
        reason:"价格低，适合赶时间"
      },
      {
        name:"麻辣烫",
        price:17,
        tags:["辣","汤类"],
        reason:"口味丰富，可以自由选择食材"
      }
    ]


    let userText=this.data.inputText


    let result=foods[0]
    
    
    if(userText.includes("辣")){
      
      result=foods.find(
        item=>item.tags.includes("辣")
      ) || foods[0]
    
    }else if(userText.includes("便宜")){
    
      result=foods.find(
        item=>item.price<=15
      ) || foods[0]
    
    }else{
    
      result=foods[
        Math.floor(Math.random()*foods.length)
      ]
    
    }


    let userMessage = {
      role:"user",
      content:this.data.inputText || "今天吃什么？"
    }


    let aiMessage = {
      role:"ai",
      content:
      "✨ 推荐给你：\n\n"
      +
      `✨ 推荐给你：
      ${result.name}
      
      💰价格：
      ${result.price}元左右
      
      原因：
      ${result.reason}`
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
       content:"🔄 换一个推荐：\n\n"
       +foods[index]
      }
    ]
   
    })
   
   }

})