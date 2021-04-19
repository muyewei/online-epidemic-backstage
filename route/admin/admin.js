const express = require("express");
const route = express.Router()
const postgresql = require("../../db/db")

route.get("/getallpaper",function(req,res){
    postgresql("select * from paper",[],function(err,paper){
        if(err){
            console.log("select * from paper (getallpaper) err: ",err)
        }else{
            console.log("select * from paper (getallpaper) sucess: ",success)
        }
    })
})

route.get("/getallquestion",function(req,res){
    
})

route.get("/getallusers",function(req,res){
    console.log(req.query)
    postgresql("select user_account ,username,behaviordate from userlog where user_identify = $1 and behaviordate in (select max(behaviordate) from userlog group by user_account) order by behaviordate desc offset $2 limit $3",[req.query.identify,req.query.page*10-10,req.query.page*10-1],function(err,users){
        if(err){
            console.log("select * from userlog (getallusers) err: ",err)
        }else{
            console.log("select * from userlog (getallusers) sucess: ",users.rows)
            res.send(users.rows)
        }
    })
})

route.get("/getalllog",function(req,res){
    console.log(req.query.logtype)
    postgresql("select * from "+req.query.logtype+" order by behaviordate desc offset $1 limit $2",[req.query.page*10-10,req.query.page*10-1],function(err,log){
        if(err){
            console.log("select * from .log (getalllog) err: ",err)
        }else{
            console.log("select * from .log (getalllog) success: ",log.rows)
            res.send(log.rows)
        }
    })
})

route.get("/getallquestionlog",function(req,res){
    
})

route.get("/getalluserslog",function(req,res){
    
})

module.exports = route