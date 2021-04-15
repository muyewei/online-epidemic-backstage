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
    console.log("newp", params)
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
        }
        console.log('user login success: ', rows.rowCount, rows.rows[ 0 ])
        let timestamp = Date.parse(new Date())
        let token = jwt.sign(
            { username: req.body.username, useraccount: rows.rows[ 0 ][ 'user_account' ], useridentify:rows.rows[ 0 ][ 'user_identify' ] },
            "postgres",
            { expiresIn: 60 }
        )
        console.log(token)
        jwt.verify(token, "postgres", (err, decode) => {
            if (err) {
                res.send({
                    err: 1,
                    msg: "当前登录失败，token失效了！"
                })
            }
            console.log("decode", decode)
            console.log(timestamp / 1000)
        })
        res.send({
            err: 0,
            msg: "登录成功",
            status: "200",
            user: rows.rows[ 0 ][ "user_account" ],
            identify: rows.rows[ 0 ][ 'user_identify' ],
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

module.exports = route