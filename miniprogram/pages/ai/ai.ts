Page({

  data:{

    inputText:"",

    messages:[
      {
        role:"ai",
        content:"👋 今天想吃什么？\n预算、口味、心情都可以告诉我"
      }
    ]

  },


  inputChange(e:any){

    this.setData({

      inputText:e.detail.value

    })

  },


  sendMessage(){


    let userText=this.data.inputText


    if(!userText){
      return
    }


    let aiText=""


    if(userText.includes("辣")){

      aiText=
      "🌶️ 推荐：辣味菜品\n\n💰 预算：15-20元\n\n⭐ 推荐原因：满足你想吃辣的需求"

    }

    else if(userText.includes("便宜") || userText.includes("20")){

      aiText=
      "🍚 推荐：经济套餐\n\n💰 预算：10-20元\n\n⭐ 推荐原因：性价比高，适合日常吃"

    }

    else{

      aiText=
      "🍜 推荐：热汤面类\n\n⭐ 推荐原因：简单快速，适合今天不知道吃什么"

    }


    let newMessages=[

      ...this.data.messages,

      {
        role:"user",
        content:userText
      },

      {
        role:"ai",
        content:aiText
      }

    ]


    this.setData({

      messages:newMessages,

      inputText:""

    })


  }


})