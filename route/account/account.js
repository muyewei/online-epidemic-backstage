const express = require('express')
const route = express.Router()
const path = require('path');
const formidable = require('formidable');
const fs = require("fs");
const crypto = require('crypto-js')
const jwt = require('jsonwebtoken')

const postgresql = require('../../db/db')

route.post('/login', express.json(), function (req, res, next) {
    let password = crypto.AES.decrypt(req.body.password, 'moran')
    let params = []
    password = crypto.enc.Utf8.stringify(password)
    params.push(req.body.useraccount)
    params.push(password)
    postgresql("select * from user_login where useraccount = $1 and user_password = $2", params, function (err, rows) {
        if (err) {
            console.log('user login err: ', err)
            return
        }
        if (rows.rowCount === 0) {
            res.send({
                err: 0,
                msg: "登录失败",
                status: "200"
            })
        }else{
            // console.log('user login success: ', rows.rowCount, rows.rows[ 0 ])
            let token = jwt.sign(
                { useraccount: req.body.useraccount, username: rows.rows[ 0 ][ 'username' ], useridentify:rows.rows[ 0 ][ 'user_identify' ] },
                "postgres",
                { expiresIn: 60 }
                )
            // let timestamp = Date.parse(new Date())
            // console.log(token)
            // jwt.verify(token, "postgres", (err, decode) => {
            //     if (err) {
            //         res.send({
            //             err: 1,
            //             msg: "当前登录失败，token失效了！"
            //         })
            //     }
            //     // console.log("decode", decode)
            //     console.log(timestamp / 1000)
            // })
            postgresql("select max(behaviorno) from userlog",[],function(err,userlogrows){
                if(err){
                    console.log("select max(behaviorno) error: ", err)
                }else{
                    let logvalue = []
                    console.log("select max(behaviorno) sucess: ", userlogrows.rows)
                    if(userlogrows.rows[0].max){
                        logvalue[0] = ++userlogrows.rows[0].max
                    }else{
                        logvalue[0] = 1
                    }
                    logvalue[1] = req.body.useraccount
                    logvalue[2] = rows.rows[ 0 ][ "user_identify" ]
                    logvalue[3] = rows.rows[ 0 ][ "username" ]
                    logvalue[4] = new Date().toLocaleString()
                    logvalue[5] = "登录"
                    postgresql("insert into userlog (behaviorno,useraccount,user_identify,username,behaviordate,behavior) values ($1,$2,$3,$4,$5,$6)",logvalue,function(err,r){
                        if(err){
                            console.log("insert into userlog 登录 error: ", err)
                        }else{
                            console.log("insert into userlog 登录 success")
                        }
                    })
                    console.log(logvalue)
                }
            })
            res.send({
                err: 0,
                msg: "登录成功",
                status: "200",
                useraccount: rows.rows[ 0 ][ "useraccount" ],
                identify: rows.rows[ 0 ][ 'user_identify' ],
                username: rows.rows[ 0 ][ "username" ],
                token
            })

        }
    })
})

route.post('/register', express.json(), function (req, response, next) {
    let password = crypto.AES.decrypt(req.body.password, 'weibiao')
    password = crypto.enc.Utf8.stringify(password)
    let checkAccount = new Promise(function (resolve, reject) {
        postgresql("select * from user_login where useraccount = $1", [ req.body.useraccount ], function (err, rows) {
            if (err) {
                console.log("checkAccount err: ", err)
                return
            }
            resolve({ useraccount: rows.rows })
        })
    })
    Promise.allSettled([ checkAccount ])
        .then((res) => {
            console.log("checkAccount res: ", res[0].value)
            let checkuser = {
                useraccount: false
            }
            for (let i in res) {
                if (res[ i ].value.useraccount) {
                    checkuser.useraccount = true
                }
            }
            if (checkuser.useraccount) {
                response.send({
                    err: 0,
                    msg: "fail",
                    status: "200",
                    checkuser
                })
            } else {
                let data = req.body
                postgresql(
                    "insert into user_login  (useraccount,username,user_password,user_identify,studentclass) values ($1, $2, $3, 'normal',$4)",
                    [ data.useraccount, data.username, password,data.studentclass ],
                    function (err, rows) {
                        if (err) {
                            console.log('user register err: ', err)
                            return
                        }
                        let token = jwt.sign(
                            { username: data.username, useraccount: data.useraccount, useridentify: 'normal' },
                            "postgres",
                            { expiresIn: 60 }
                        )
                        postgresql("select max(behaviorno) from userlog",[],function(err,userlogrows){
                            if(err){
                                console.log("select max(behaviorno) cancel error: ", err)
                            }else{
                                let logvalue = []
                                console.log("select max(behaviorno) cancel sucess: ", userlogrows.rows)
                                if(userlogrows.rows[0].max){
                                    logvalue[0] = ++userlogrows.rows[0].max
                                }else{
                                    logvalue[0] = 1
                                }
                                logvalue[1] = data.useraccount
                                logvalue[2] = "normal"
                                logvalue[3] = data.username
                                logvalue[4] = new Date().toLocaleString()
                                logvalue[5] = "注册"
                                postgresql("insert into userlog (behaviorno,useraccount,user_identify,username,behaviordate,behavior) values ($1,$2,$3,$4,$5,$6)",logvalue,function(err,r){
                                    if(err){
                                        console.log("insert into userlog 注册 error: ", err)
                                    }else{
                                        console.log("insert into userlog 注册 success")
                                    }
                                })
                            }
                        })
                        response.send({
                            err: 0,
                            msg: "success",
                            status: "200",
                            checkuser,
                            token
                        })
                    })
            }
        })
})

route.get('/cancel',function(req,res){
    postgresql("select max(behaviorno) from userlog",[],function(err,userlogrows){
        if(err){
            console.log("select max(behaviorno) cancel error: ", err)
        }else{
            let logvalue = []
            console.log("select max(behaviorno) cancel sucess: ", userlogrows.rows)
            if(userlogrows.rows[0].max){
                logvalue[0] = ++userlogrows.rows[0].max
            }else{
                logvalue[0] = 1
            }
            logvalue[1] = req.query.username
            logvalue[2] = req.query.identify
            logvalue[3] = req.query.useraccount
            logvalue[4] = new Date().toLocaleString()
            logvalue[5] = "注销"
            postgresql("insert into userlog (behaviorno,useraccount,user_identify,username,behaviordate,behavior) values ($1,$2,$3,$4,$5,$6)",logvalue,function(err,r){
                if(err){
                    console.log("insert into userlog 注销 error: ", err)
                }else{
                    console.log("insert into userlog 注销 success")
                }
            })
        }
    })
})

route.post('/headportrait',express.json(),function(req,res){
    let form = new formidable.IncomingForm();
    form.uploadDir = path.join(__dirname, '../../files/headportrait');
    form.parse(req, function (err, fileds, files) {
        if (err) next(err);
        let picture = files.file
        let oldname = picture.path
        let newname = picture.path.split("upload_")[0] + fileds.identify + "_" + fileds.useraccount + "." + picture.name.split(".")[1]
        fs.rename(oldname, newname, function (err) {
            if (err) {
                console.log("fs img head rename error: ", error)
            } else {
                console.log("fs img head rename success")
            }
        })
        let picturepath = "http://localhost:1730/image/headportrait/" + fileds.identify + "_" + fileds.useraccount + "." + picture.name.split(".")[1]
        postgresql("update user_login set headportrait = $1 where useraccount = $2",[picturepath,fileds.useraccount],function(err,values){
            if(err){
                console.log("update user_login set headportrait error:",err)
            }else{
                console.log("update user_login set headportrait success")
            }
        })
        res.send({ status: 200, data: '', msg: 'success', thumburl: picturepath});
    })
})

route.get("/getheadportrait",function(req,res){
    postgresql("select headportrait from user_login where useraccount = $1",[req.query.useraccount],function(err,values){
        if(err){
            console.log("select headprotrait from user_login error:",err)
        }else{
            console.log("select headprotrait from user_login success")
            res.send({data: values.rows[0]})
        }
    })
})

route.get("/changeusername",function(req,res){
    postgresql("update user_login set username = $1 where useraccount = $2",[req.query.username,req.query.useraccount],function(err,values){
        if(err){
            console.log("update user_login set username error: ",err)
            res.send({msg:"error"})
        }else{
            console.log("update user_login set username success")
            res.send({username: req.query.username,msg:"success"})
        }
    })
})

route.post("/changepassword",express.json(),function(req,res){
    let newpassword = crypto.AES.decrypt(req.body.newpassword, 'genggai')
    newpassword = crypto.enc.Utf8.stringify(newpassword)
    let oldpassword = crypto.AES.decrypt(req.body.oldpassword, 'genggai')
    oldpassword = crypto.enc.Utf8.stringify(oldpassword)
    postgresql("update user_login set user_password = $1 where useraccount = $2 and user_password = $3",[newpassword,req.body.useraccount,oldpassword],function(err,values){
        if(err){
            console.log("update user_login set user_password error: ",err)
            res.send({msg:"error"})
        }else{
            console.log("update user_login set user_password success")
            res.send({msg:"success"})
        }
    })
})

route.get("/uploadfeedback",function(req,res){
    const {feedback} = req.query
    const fdate = new Date().toLocaleString()
    postgresql("insert into feedback (feedbackdate,feedbackword) values ($1,$2)",[fdate,feedback],function(err,values){
        if(err){
            console.log("insert into feedback error: ",err)
            res.send({msg: "", state: "fail"})
        }else{
            console.log("insert into feedback success")
            res.send({msg: "", state: "success"})
        }
    })
})

module.exports = route