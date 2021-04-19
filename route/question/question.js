const express = require("express");
const route = express.Router()
const postgresql = require("../../db/db")

route.use(express.json());

// route.get("/", function(req, res){
//     console.log(req.query)
//     res.send("question text")
// })

route.get("/getQuestionList", function(req,res){
    console.log("getQuestionList onloading ......")
    postgresql("select * from question where user_account = $1",[req.query.user_account],function(err,rows){
        if(err){
            console.log("getQuestionList error：", err)
        }else{
            console.log("getQuestionList success：", err)
            res.send(rows.rows)
        }
    })
})

route.post("/uploadQuestion", function(req, res){
    console.log(123)
    let questiondate = new Date()
    let question = req.body
    let sqlvalue = []
    question["questiondate"] = questiondate.toISOString().split("T")[0]
    // console.log(question)
    for(let i in question){
        sqlvalue.push(question[i])
    }
    // console.log("sqlvalue", sqlvalue)
    postgresql("select max(questionno) from question", "", function(err, rows){
        if(err){
            console.log("onloadQuestion: ", err)
        }else{
            console.log("max(questionno) ", rows.rows)
                let maxValue = rows.rows[0].max
                if(!rows.rows[0].max){
                    maxValue = 1
                }else{
                    maxValue++
                }
                sqlvalue.push(maxValue)
                console.log("onload question --> sqlvalue", sqlvalue)
                res.send("uploadqustion OK")
                postgresql("insert into question ( title, type, value, subject,user_account, questiondate, questionno ) values ($1,$2,$3,$4,$5,$6,$7)", sqlvalue, function(err, rows){
                    if(err){
                        console.log("insert into question fail: ", err)
                    }
                    console.log("insert into question success")
                    postgresql("select max(behaviorno) from questionlog",[],function(err,questionlogrows){
                        if(err){
                            console.log("select max(behaviorno) from questionlog(insertquestion) error: ", err)
                        }else{
                            let logvalue = []
                            console.log("select max(behaviorno) from questionlog(insertquestion) sucess")
                            if(questionlogrows.rows[0].max){
                                logvalue[0] = ++questionlogrows.rows[0].max
                            }else{
                                logvalue[0] = 1
                            }
                            logvalue[1] = req.post.user_account
                            logvalue[2] = req.post.title
                            logvalue[3] = new Date().toLocaleString()
                            logvalue[4] = "上传"
                            postgresql("insert into questionlog (behaviorno,user_account,questionname,behaviordate,behavior) values ($1,$2,$3,$4,$5)",logvalue,function(err,r){
                                if(err){
                                    console.log("insert into questionlog 上传 error: ", err)
                                }else{
                                    console.log("insert into questionlog 上传 success")
                                }
                            })
                        }
                    }) 
                }) 
            console.log("OKOKOK")
        }
    })
    
})

route.get("/deletequestion",function(req,res){
    console.log("deletequestion",req.query)
    postgresql("delete from question where questionno = $1",[req.query.questionno],function(err,d){
        if(err){
            console.log("delete from question error: ",err)
        }else{
            console.log("delete from question success")
            postgresql("select max(behaviorno) from questionlog",[],function(err,questionlogrows){
                if(err){
                    console.log("select max(behaviorno) from questionlog(deletequestion) error: ", err)
                }else{
                    let logvalue = []
                    console.log("select max(behaviorno) from questionlog(deletequestion) sucess")
                    if(questionlogrows.rows[0].max){
                        logvalue[0] = ++questionlogrows.rows[0].max
                    }else{
                        logvalue[0] = 1
                    }
                    logvalue[1] = req.query.username
                    logvalue[2] = req.query.questionname
                    logvalue[3] = new Date().toLocaleString()
                    logvalue[4] = "删除"
                    postgresql("insert into questionlog (behaviorno,user_account,questionname,behaviordate,behavior) values ($1,$2,$3,$4,$5)",logvalue,function(err,r){
                        if(err){
                            console.log("insert into questionlog 删除 error: ", err)
                        }else{
                            console.log("insert into questionlog 删除 success")
                        }
                    })
                }
            }) 
        }
    })
})

module.exports = route