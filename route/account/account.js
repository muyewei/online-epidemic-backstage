const express = require('express')
const route = express.Router()
const bodyParser = require('body-parser')
// const bodyParser = express.bodyParser()
const crypto = require('crypto-js')
const jwt = require('jsonwebtoken')

const postgresql = require('../../db/db')

route.post('/login', bodyParser.json(), function (req, res, next) {
    let password = crypto.AES.decrypt(req.body.password, 'moran')
    let params = []
    password = crypto.enc.Utf8.stringify(password)
    params.push(req.body.username)
    params.push(password)
    // console.log("newp", params)
    postgresql("select * from user_login where username = $1 and user_password = $2", params, function (err, rows) {
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
            return
        }
        // console.log('user login success: ', rows.rowCount, rows.rows[ 0 ])
        let timestamp = Date.parse(new Date())
        let token = jwt.sign(
            { username: req.body.username, useraccount: rows.rows[ 0 ][ 'user_account' ], useridentify:rows.rows[ 0 ][ 'user_identify' ] },
            "postgres",
            { expiresIn: 60 }
        )
        // console.log(token)
        jwt.verify(token, "postgres", (err, decode) => {
            if (err) {
                res.send({
                    err: 1,
                    msg: "当前登录失败，token失效了！"
                })
            }
            // console.log("decode", decode)
            console.log(timestamp / 1000)
        })
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
                logvalue[1] = rows.rows[ 0 ][ "user_account" ]
                logvalue[2] = rows.rows[ 0 ][ 'user_identify' ]
                logvalue[3] = req.body.username
                logvalue[4] = new Date().toLocaleString()
                logvalue[5] = "登录"
                postgresql("insert into userlog (behaviorno,user_account,user_identify,username,behaviordate,behavior) values ($1,$2,$3,$4,$5,$6)",logvalue,function(err,r){
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
            user: rows.rows[ 0 ][ "user_account" ],
            identify: rows.rows[ 0 ][ 'user_identify' ],
            account: req.body.username,
            token
        })
    })
})

route.post('/register', bodyParser.json(), function (req, response, next) {
    let password = crypto.AES.decrypt(req.body.password, 'weibiao')
    password = crypto.enc.Utf8.stringify(password)
    let checkUsername = new Promise(function (resolve, reject) {
        postgresql("select * from user_login where username = $1", [ req.body.username ], function (err, rows) {
            if (err) {
                console.log("checkUsername err: ", err)
                return
            }
            resolve({ username: rows.rows })
        })
    })
    let checkAccount = new Promise(function (resolve, reject) {
        postgresql("select * from user_login where user_account = $1", [ req.body.useraccount ], function (err, rows) {
            if (err) {
                console.log("checkAccount err: ", err)
                return
            }
            resolve({ account: rows.rows })
        })
    })
    Promise.allSettled([ checkUsername, checkAccount ])
        .then((res) => {
            let checkuser = {
                username: false,
                account: false
            }
            for (let i in res) {
                if (res[ i ].value.username && res[ i ].value.username.length != 0) {
                    checkuser.username = true
                }
                if (res[ i ].value.account && res[ i ].value.account.length != 0) {
                    checkuser.account = true
                }
            }
            if (checkuser.username || checkuser.account) {
                response.send({
                    err: 0,
                    msg: "fail",
                    status: "200",
                    checkuser
                })
            } else {
                let data = req.body
                data.useraccount = data.useraccount.replace(/(^\s*)|(\s*$)/g, "");
                data.username = data.username.replace(/(^\s*)|(\s*$)/g, "");
                postgresql(
                    "insert into user_login  (user_account,username,user_password,user_identify) values ($1, $2, $3, 'normal')",
                    [ data.useraccount, data.username, password.replace(/(^\s*)|(\s*$)/g, "") ],
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
                                postgresql("insert into userlog (behaviorno,user_account,user_identify,username,behaviordate,behavior) values ($1,$2,$3,$4,$5,$6)",logvalue,function(err,r){
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
            logvalue[1] = req.query.user
            logvalue[2] = req.query.identify
            logvalue[3] = req.query.account
            logvalue[4] = new Date().toLocaleString()
            logvalue[5] = "注销"
            postgresql("insert into userlog (behaviorno,user_account,user_identify,username,behaviordate,behavior) values ($1,$2,$3,$4,$5,$6)",logvalue,function(err,r){
                if(err){
                    console.log("insert into userlog 注销 error: ", err)
                }else{
                    console.log("insert into userlog 注销 success")
                }
            })
        }
    })
})

module.exports = route