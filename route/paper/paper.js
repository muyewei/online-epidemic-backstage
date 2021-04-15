const express = require("express");
const { connect } = require("nodejs-websocket");
const route = express.Router()
// const bodyParser = require( body-parser )
const postgresql = require("../../db/db")

route.use(express.json());

route.get("/", function(req, res){
    console.log(req.query)
    res.send("123123")
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
    paper["paperdate"] = paperdate.toISOString().split("T")[0]
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
            let maxValue = rows.rows[0].max
            if(!rows.rows[0].max){
                maxValue = 1
            }else{
                maxValue++
            }
            sqlvalue.push(maxValue)
            console.log("sqlvalue", sqlvalue)
            postgresql("insert into paper ( papername , paperbrief , paperstyle , papertime , paperpassword , papervalue , paperdate , user_account , paperno ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)", sqlvalue, function(err, rows){
                if(err){
                    console.log("insert into paper fail: ", err)
                }
                console.log("insert into paper success: ", rows)
            })
            console.log("OKOKOK")
        }
    })
    
})


module.exports = route