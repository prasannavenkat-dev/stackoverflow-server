const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({
    name:{
    type:String,
    required:true
    },
   
    email:{
        type:String,
        required:true
        },
    password:{
        type:String,
        required:true
        },
        userId:{
            type:String,
            required:true
        },
        joinedOn:{
            type:String,
            required:true
        }
})


const questionSchema = new mongoose.Schema({

    _id:{
        type:Number,
        required:true
    },
    upVotes: [String],
    downVotes:[String],
 
    noOfAnswers:{
        type:Number,
        default:0
    },
    questionTitle:{
        type:String,
        required:true
    },
questionBody:{
    type:String,
    required:true
},

    questionTags:[String],
    userPosted:String,
    userId:String,

    askedOn :String,
    answers:[
      {
          answerBody:String,
          answeredBy:String,
          answeredOn:String,
          userId:String
      }
    ]
    
})





const profileModel = mongoose.model("Profile",profileSchema);
const questionModel = mongoose.model("Question",questionSchema)
module.exports = {profileModel,questionModel}