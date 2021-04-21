const express = require("express");
const route = express.Router()
const postgresql = require("../../db/db")

route.get("/getallpaper",function(req,res){
    postgresql("select * from paper",[],function(err,paper){
        if(err){
            console.log("select * from paper (getallpaper) err: ",err)
        }else{
            console.log("select * from paper (getallpaper) sucess")
            res.send(paper.rows)
        }
    })
})

route.get("/getallquestion",function(req,res){
    postgresql("select * from question",[],function(err,question){
        if(err){
            console.log("select * from question (getallquestion) err: ",err)
        }else{
            console.log("select * from question (getallquestion) sucess")
            res.send(question.rows)
        }
    })
})

route.get("/getallusers",function(req,res){
    // console.log(req.query)
    postgresql("select user_account ,username,behaviordate from userlog where user_identify = $1 and behaviordate in (select max(behaviordate) from userlog group by user_account) order by behaviordate desc offset $2 limit $3",[req.query.identify,req.query.page*10-10,req.query.page*10-1],function(err,users){
        if(err){
            console.log("select * from userlog (getallusers) err: ",err)
        }else{
            console.log("select * from userlog (getallusers) sucess")
            res.send(users.rows)
        }
    })
})

route.get("/getalllog",function(req,res){
    console.log(req.query.logtype)
    postgresql("select * from "+req.query.logtype+" order by behaviordate desc",[],function(err,log){
        if(err){
            console.log("select * from .log (getalllog) err: ",err)
        }else{
            console.log("select * from .log (getalllog) success")
            res.send(log.rows)
        }
    })
})

route.get("/getallquestionlog",function(req,res){
    
})

route.get("/getalluserslog",function(req,res){
    
})

module.exports = route