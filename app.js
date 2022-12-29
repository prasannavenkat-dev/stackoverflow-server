const express = require("express");
const app = express();
require("dotenv").config();
const bodyParser = require("body-parser");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const { profileModel, questionModel } = require("./model")


require("./database").connect();


const PORT = process.env.PORT || 4000;

// parse application/json
app.use(bodyParser.json())
//cors
app.use(cors({ origin: "*"}))



app.post("/user/signup", async function (req, res) {
    try {


        let { name, email, password, joinedOn } = req.body;

        //Validation of

        if (!name && !email && !password) {
            return res.status(404).send("All params Missing");
        }

        if (!email && !password) {
            return res.status(404).send("Email and Password Required");
        }

        if (!name && !password) {
            return res.status(404).send("Name and Password Required");
        }
        if (!email) {
            return res.status(404).send("Email is Required");
        }
        if (!password) {
            return res.status(404).send("Password is Required");
        }

        if (!name) {
            return res.status(404).send("Name is Required");
        }

        //Check IF User Exist Already
        let isUserExist = await profileModel.exists({ email })


        if (isUserExist) {
            return res.status(404).send("User Already Existed")
        }

        //Hashing Password
        bcrypt.hash(password, saltRounds, async function (err, hash) {
            // Storing in DB
            let userId = Math.floor(Math.random() * 99999999)
            let Profile = new profileModel({ name, email, password: hash, userId, joinedOn });
            let newUser = await Profile.save();
            const token = jwt.sign({ email: newUser.email, id: newUser._id }, process.env.TOKEN_sECRET, { expiresIn: "1h" })
            res.status(200).json({ message: "signup success", data: { email, name }, token });
        })
    } catch (error) {
        res.status(500).json({ message: "Sign up Failed" });
    }

})


//Login Route

app.post("/user/signin", async function (req, res) {

    try {

        let { email, password } = req.body;
        if (!email && !password) {
            return res.status(404).send("Email and Password Required");
        }
        if (!email) {
            return res.status(404).send("Email is Required");
        }
        if (!password) {
            return res.status(404).send("Password is Required");
        }

        let userDetails = await profileModel.find({ email })

        if (userDetails.length === 0) {
            return res.status(404).send("User Not exist");
        }

        let hash = userDetails[0].password;
        let name = userDetails[0].name;
        let userId = userDetails[0].userId

        bcrypt.compare(password, hash, function (err, result) {
            if (result) {
                const token = jwt.sign({ email, id: userDetails._id }, process.env.TOKEN_sECRET, { expiresIn: "1h" })
                res.status(200).json({ message: "login success", data: { email, name, userId }, token });
            }
            else {
                res.status(404).send("Invalid Password");
            }
        });

    } catch (error) {
        res.status(500).json({ message: "Sign In Failed" });
    }
})


// post question

app.post("/postQuestion", async function (req, res) {

    try {


        const { _id, questionTitle, questionBody, questionTags, userPosted, userId, askedOn } = req.body;
      

        if (!questionTitle || !questionBody || (questionTags.length == 0)) {
            return res.status(404).send({ message: "Missing Required Field!" })
        }

        const question = new questionModel({
            _id,
            upVotes: [],
            downVotes: [],
            noOfAnswers: 0,
            questionTitle,
            questionBody,
            questionTags,
            userPosted,
            userId,
            askedOn,
            answers: []

        })
        const data = await question.save()
        res.status(200).send({ message: "Question Posted Successfully", data });

    } catch (error) {
        console.log(error)
        res.status(500).send({ message: "Error Posting Question" });
    }

})


//post answer

app.post("/postanswer", async function (req, res) {
    try {

        const { _id, upVotes, downVotes, answers } = req.body;
        const [questionDetail] = await questionModel.find({ _id })

        questionDetail.answers.push(answers[0]);
        let noOfAnswers = questionDetail.noOfAnswers + 1;

        console.log(req.body)

        if (questionDetail.length == 0) {
            return res.status(404).send({ message: "Question Not Found!" })
        }

        let data = await questionModel.findOneAndUpdate({ _id }, { ...questionDetail, upVotes, downVotes, noOfAnswers })

        res.status(200).send({ message: "Answer Posted Succesfully", data })

    } catch (error) {
        console.log(error)
        res.status(500).send({ message: "Error Posting Answer" });
    }
})


// Update Vote 


app.post("/updateVote", async function (req, res) {
    try {


        const { _id, upVote, downVote ,userId } = req.body;
        const [questionDetail] = await questionModel.find({ _id })

        if (questionDetail.length == 0) {
            return res.status(404).send({ message: "Question Not Found!" })
        } 

        const isUserExist = await profileModel.find({userId});
        
        if(isUserExist.length==0){
            return res.status(404).send({ message: "User Not Found!" })
        }
        let isAlreadyVoted;
        if(upVote){
         isAlreadyVoted = questionDetail.downVotes.includes(userId)
            if(isAlreadyVoted){
                questionDetail.downVotes = questionDetail.downVotes?.filter(item => item!==userId);
            }
questionDetail.upVotes.push(userId)
        }
        else{

            isAlreadyVoted = questionDetail.upVotes.includes(userId)
            if(isAlreadyVoted){
                questionDetail.upVotes = questionDetail.upVotes?.filter(item => item!==userId);
            }
            questionDetail.downVotes.push(userId)

        }

        console.log("lp", { ...questionDetail })
        let data = await questionModel.findOneAndUpdate({ _id }, { ...questionDetail }, { new: true })
        res.status(200).send({ message: "Answer Posted Succesfully", data })



    } catch (error) {
        res.status(500).send({ message: "Error Updating Vote!" })
    }
})

//Get Question Detail 

app.post("/getQuestion", async function (req, res) {
    try {

        const { _id } = req.body;
        const [data] = await questionModel.find({ _id })
        console.log(data)

        if (!data) {
            return res.status(404).send({ message: "Question Not Found!!" });
        }

        res.status(200).send({ message: "Question Fetch Success", data })

    } catch (error) {
        res.status(500).send({ message: "Cannot Fetch Question!!" });
    }
})


//Get All Questions 


app.get("/getAllQuestions", async function (req, res) {
    try {

        let data = await questionModel.find();
        res.status(200).send({ message: "Questions Fetched Successfully", data })

    } catch (error) {
        res.status(500).send({ message: "Error Fetching Data" })
    }
})

//Get All User 

app.get("/getAllUsers", async function (req, res) {
    try {

        let data = await profileModel.find({}, { _id: 0, password: 0, __v: 0 });
        res.status(200).send({ message: "Users Fetched Successfully", data })


    } catch (error) {
        res.status(500).send({ message: "Error Fetching Data" })
    }
})

//Get User Info 

app.post("/getUser", async function (req, res) {
    try {
        let { userId } = req.body

        let [data] = await profileModel.find({ userId },{password:0,_id:0,__v:0});

        if (data) {

            return res.status(200).send({ message: "User Fetch success", data });

        }
        else {
            return res.status(404).send({ message: "User Not Found" });
        }

    } catch (error) {
        res.status(500).send({ message: "Error Fetching User" })
    }
})


//Edit User

app.post("/editUser",async function(req,res){
    try {

        let {userId,name} = req.body;
        console.log(req.body)

let [user] = await profileModel.find({userId})

if(user){
    let data = await profileModel.findOneAndUpdate({userId},{name}, {new: true})

    const token = jwt.sign({ email:data.email, id: data._id }, process.env.TOKEN_sECRET, { expiresIn: "1h" })



    return res.status(200).send({message:"Updated Successfully",data:{name:data.name,email:data.email,userId:data.userId},token});

}
else{
    return res.status(404).send({message:"User Not Found"});
}
        
    } catch (error) {
        console.log(error)

        res.status(500).send({message:"Error Updating User"})
    }
})

app.listen(PORT, () => {
    console.log(`App running on port ${PORT}`);
})








