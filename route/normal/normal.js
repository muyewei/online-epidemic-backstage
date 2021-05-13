const express = require("express");
const route = express.Router()
const postgresql = require("../../db/db")

route.use(express.json());

route.get("/getlatestpaper",function(req,res){
    postgresql("select papername from paper where paperstate=$1 order by paperdate desc limit 10",["开放"],function(err,v){
        if(err){
            console.log("getlatestpaper error: ",err)
        }else{
            console.log("getlatestpaper success")
            res.send(v.rows)
        }
    })
})

route.get("/getlatesttimelimit",function(req,res){
    postgresql("select papername,papertime,paperbrief,user_account,paperno from paper where paperstate=$1 and papertime <> $2 and paperpassword = $3 order by paperdate desc limit 10",["开放","",""],function(err,v){
        if(err){
            console.log("getlatestpaper(timelimit) error: ",err)
        }else{
            console.log("getlatestpaper(timelimit) success")
            res.send(v.rows)
        }
    })
})

route.get("/getlatestpassword",function(req,res){
    postgresql("select papername,paperpassword,paperbrief,user_account,paperno,paperpassword,papertime from paper where paperstate=$1 and paperpassword <> $2 order by paperdate desc limit 10",["开放",""],function(err,v){
        if(err){
            console.log("getlatestpaper(password) error: ",err)
        }else{
            console.log("getlatestpaper(password) success")
            res.send(v.rows)
        }
    })
})

route.get("/getpaperlist",function(req,res){
    postgresql("select paperno,papername,paperpassword,paperbrief,papertime,user_account from paper where paperstate=$1 order by paperdate desc limit 10",["开放"],function(err,v){
        if(err){
            console.log("getlatestpaper(password) error: ",err)
        }else{
            console.log("getlatestpaper(password) success")
            res.send(v.rows)
        }
    })
})

route.get("/getpapertest", function(req,res){
    postgresql("select * from paper where paperno = $1",[req.query.paperno],function(err,v){
        if(err){
            console.log("getpapertest error: ",err)
        }else{
            postgresql("select visitnum from paper where paperno = $1",[req.query.paperno],function(err,num){
                if(err){
                    console.log("select visitnum from paper error: ",err)
                }else{
                    console.log(num.rows[0].visitnum)
                    postgresql("update paper set visitnum = $1 where paperno = $2",[num.rows[0].visitnum+1,req.query.paperno],function(err,v){
                        if(err){
                            console.log("update paper set visitnum error: ",err)
                        }else{
                            console.log("update paper set visitnum success")
                        }
                    })
                }
            })
            console.log("getpapertest success")
            res.send(v.rows[0])
        }
    })
})

route.post("/submitpapertest", function(req,res){
    console.log("submitpapertest",req.body)
    postgresql("select max(papertestno) from papertest",[],function(err,papertestrows){
        if(err){
            console.log("select max(papertestno) from papertest error: ", err)
        }else{
            let testvalue = []
            console.log("select max(papertestno) from papertest sucess")
            if(papertestrows.rows[0].max){
                testvalue[0] = ++papertestrows.rows[0].max
            }else{
                testvalue[0] = 1
            }
            testvalue[1] = req.body.answer
            testvalue[2] = req.body.paperno
            testvalue[3] = req.body.papername
            testvalue[4] = new Date().toLocaleString()
            testvalue[5] = req.body.timecosume
            testvalue[6] = req.body.useraccount
            testvalue[7] = req.body.username
            postgresql("insert into papertest (papertestno,answer,paperno,papername,submitdate,timecosume,useraccount,username) values ($1,$2,$3,$4,$5,$6,$7,$8)",testvalue,function(err,r){
                if(err){
                    console.log("insert into papertest 上传 error: ", err)
                }else{
                    console.log("insert into papertest 上传 success")
                }
            })
        }
    }) 
})



module.exports = route