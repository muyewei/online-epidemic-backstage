const express = require("express");
const route = express.Router()
const postgresql = require("../../db/db")

route.use(express.json());

// route.get("/", function(req, res){
//     console.log(req.query)
//     res.send("123123")
// })

route.get("/getPaper", function(req, res){
    console.log(req.query)
    postgresql("select * from paper where paperno = $1",[req.query.paperno],function(err,rows){
        if(err){
            console.log("Get Paper Error: ", err)
        }else{
            console.log("Get Paper Success")
            res.send(rows.rows)
        }
    })
})

route.get("/getPaperList", function(req,res){
    console.log(req.query)
    postgresql("select * from paper where user_account = $1",[req.query.user],function(err,rows){
        if(err){
            console.log("Get PaperList Error: ", err)
        }else{
            console.log("Get PaperList Success")
            res.send(rows.rows)
        }
    })
})

route.post("/onloadPaper", function(req, res){
    let paperdate = new Date()
    let paper = req.body.paper
    let sqlvalue = []
    paper["paperdate"] = paperdate.toLocaleString().split("T")[0]
    // console.log(paper)
    for(let i in paper){
        sqlvalue.push(paper[i])
    }
    // console.log("sqlvalue", sqlvalue)
    postgresql("select max(paperno) from paper", "", function(err, rows){
        if(err){
            console.log("onloadPaper: ", err)
        }else{
            console.log("max(paperno) ", rows.rows)
            if(req.body.paperno === 0){
                let maxValue = rows.rows[0].max
                if(!rows.rows[0].max){
                    maxValue = 1
                }else{
                    maxValue++
                }
                sqlvalue.push(maxValue)
                // console.log("onload paper --> sqlvalue", sqlvalue)
                postgresql("insert into paper ( papername , paperbrief , paperstyle , papertime , paperpassword , papervalue , paperdate , user_account , paperno ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)", sqlvalue, function(err, rows){
                    if(err){
                        console.log("insert into paper fail: ", err)
                    }
                    console.log("insert into paper success")
                })
                postgresql("select max(behaviorno) from paperlog",[],function(err,paperlogrows){
                    if(err){
                        console.log("select max(behaviorno) from paperlog error: ", err)
                    }else{
                        let logvalue = []
                        console.log("select max(behaviorno) from paperlog sucess")
                        if(paperlogrows.rows[0].max){
                            logvalue[0] = ++paperlogrows.rows[0].max
                        }else{
                            logvalue[0] = 1
                        }
                        logvalue[1] = req.body.paper.user_account
                        logvalue[2] = req.body.paper.papername
                        logvalue[3] = req.body.paper.paperbrief
                        logvalue[4] = new Date().toLocaleString()
                        logvalue[5] = "上传"
                        postgresql("insert into paperlog (behaviorno,user_account,papername,paperbrief,behaviordate,behavior) values ($1,$2,$3,$4,$5,$6)",logvalue,function(err,r){
                            if(err){
                                console.log("insert into paperlog 上传 error: ", err)
                            }else{
                                console.log("insert into paperlog 上传 success")
                            }
                        })
                    }
                }) 
            }
            console.log("OKOKOK")
        }
    })
    
})

route.get("/deletepaper",function(req,res){
    console.log("deletepaper",req.query)
    postgresql("delete from paper where paperno = $1",[req.query.paperno],function(err,d){
        if(err){
            console.log("delete from paper error: ",err)
        }else{
            console.log("delete from paper success")
            postgresql("select max(behaviorno) from paperlog",[],function(err,paperlogrows){
                if(err){
                    console.log("select max(behaviorno) from paperlog(deletepaper) error: ", err)
                }else{
                    let logvalue = []
                    console.log("select max(behaviorno) from paperlog(deletepaper) sucess")
                    if(paperlogrows.rows[0].max){
                        logvalue[0] = ++paperlogrows.rows[0].max
                    }else{
                        logvalue[0] = 1
                    }
                    logvalue[1] = req.query.username
                    logvalue[2] = req.query.papername
                    logvalue[3] = ""
                    logvalue[4] = new Date().toLocaleString()
                    logvalue[5] = "删除"
                    postgresql("insert into paperlog (behaviorno,user_account,papername,paperbrief,behaviordate,behavior) values ($1,$2,$3,$4,$5,$6)",logvalue,function(err,r){
                        if(err){
                            console.log("insert into paperlog 删除 error: ", err)
                        }else{
                            console.log("insert into paperlog 删除 success")
                        }
                    })
                }
            }) 
        }
    })
})

route.get("/setpaperopen",function(req,res){
    postgresql("update paper set paperstate = $1 where paperno = $2",["开放",req.query.paperno],function(err,rows){
        if(err){
            console.log("setpaperopen Error: ", err)
        }else{
            console.log("setpaperopen Success")
            res.send("setpaperopen Success")
        }
    })
})

route.get("/getPaperOpenList", function(req,res){
    console.log(req.query)
    postgresql("select * from paper where user_account = $1 and paperstate = $2",[req.query.user,"开放"],function(err,rows){
        if(err){
            console.log("Get PaperOpenList Error: ", err)
        }else{
            console.log("Get PaperOpenList Success")
            res.send(rows.rows)
        }
    })
})

route.get("/setpaperclose",function(req,res){
    console.log("setpaperclosesetpaperclose")
    postgresql("update paper set paperstate = $1 where paperno = $2",["禁止",req.query.paperno],function(err,rows){
        if(err){
            console.log("setpaperclose Error: ", err)
            res.send("setpaperclose Error")
        }else{
            console.log("setpaperclose Success")
            res.send("setpaperclose Success")
        }
    })
})

module.exports = route