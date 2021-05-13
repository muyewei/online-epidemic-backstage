const express = require("express");
const route = express.Router()
const path = require('path');
const formidable = require('formidable');
const postgresql = require("../../db/db");
const fs = require("fs");
const { query } = require("express");

route.get("/getallpaper", function (req, res) {
    postgresql("select * from paper", [], function (err, paper) {
        if (err) {
            console.log("select * from paper (getallpaper) err: ", err)
        } else {
            console.log("select * from paper (getallpaper) sucess")
            res.send(paper.rows)
        }
    })
})

route.get("/getallquestion", function (req, res) {
    postgresql("select * from question", [], function (err, question) {
        if (err) {
            console.log("select * from question (getallquestion) err: ", err)
        } else {
            console.log("select * from question (getallquestion) sucess")
            res.send(question.rows)
        }
    })
})

route.get("/getallusers", function (req, res) {
    // console.log(req.query)
    postgresql("select useraccount ,username,behaviordate from userlog where user_identify = $1 and behaviordate in (select max(behaviordate) from userlog group by useraccount) order by behaviordate desc offset $2 limit $3", [req.query.identify, req.query.page * 10 - 10, req.query.page * 10 - 1], function (err, users) {
        if (err) {
            console.log("select * from userlog (getallusers) err: ", err)
        } else {
            console.log("select * from userlog (getallusers) sucess")
            res.send(users.rows)
        }
    })
})

route.get("/getalllog", function (req, res) {
    console.log(req.query.logtype)
    postgresql("select * from " + req.query.logtype + " order by behaviordate desc", [], function (err, log) {
        if (err) {
            console.log("select * from .log (getalllog) err: ", err)
        } else {
            console.log("select * from .log (getalllog) success")
            res.send(log.rows)
        }
    })
})

route.get("/getallquestionlog", function (req, res) {

})

route.get("/getalluserslog", function (req, res) {

})

route.post("/uploadimg", express.json(), function (req, res) {
    let form = new formidable.IncomingForm();
    form.uploadDir = path.join(__dirname, '../../files/extension');
    form.parse(req, function (err, fileds, files) {
        if (err) next(err);
        let oldname = files.logo.path
        let newname = files.logo.path.split("upload_")[0] + files.logo.name.split(".")[0] + "@!aqz" + files.logo.path.split("upload_")[1] + "." + files.logo.name.split(".")[1]
        fs.rename(oldname, newname, function (err) {
            if (err) {
                console.log("fs img rename error: ", error)
            } else {
                console.log("fs img rename success")
            }
        })
        let picturepath = "http://localhost:1730/image/extension/" + files.logo.name.split(".")[0] + "@!aqz" + files.logo.path.split("upload_")[1] + "." + files.logo.name.split(".")[1]
        console.log("upload img success");
        res.send({ status: 200, data: '', msg: 'success', thumburl: picturepath});
    })
})

route.post("/uploadextension", express.json(), function (req, res) {
    const {picturepath,word,picturelink,username,useraccount} = req.body
    postgresql("select max(extensionno) from extension", "", function(err, rows){
        if(err){
            console.log("uploadextension: ", err)
        }else{
            let maxValue = rows.rows[0].max
            if(!rows.rows[0].max){
                maxValue = 1
            }else{
                maxValue++
            }
            postgresql("insert into extension (picturepath,word,picturelink,username,useraccount,extensionno) values ($1,$2,$3,$4,$5,$6)", [picturepath,word, picturelink, username, useraccount,maxValue], function (err, values) {
                if(err){
                    console.log("insert into extension pitcure error: ",err)
                    res.send({ status: 200, data: '', msg: 'error'});
                }else{
                    console.log("insert into extension pitcure success")
                    res.send({ status: 200, data: '', msg: 'success'});
                }
            })
        }
    })
})

route.get("/getextension",function(req,res){
    postgresql("select * from extension", [], function (err, values) {
        if(err){
            console.log("select * from extension error: ",err)
            res.send({ status: 200, data: '', msg: 'error'});
        }else{
            console.log("select * from extension success")
            res.send({ status: 200, data: values.rows, msg: 'success'});
        }
    })
})

route.post("/uploadnotice", express.json(), function (req, res) {
    const {username,useraccount,word} = req.body
    console.log("!23123")
    postgresql("select max(noticeno) from notice", "", function(err, rows){
        if(err){
            console.log("uploadnotice: ", err)
        }else{
            let maxValue = rows.rows[0].max
            if(!rows.rows[0].max){
                maxValue = 1
            }else{
                maxValue++
            }
            postgresql("insert into notice (username,useraccount,word,noticeno) values ($1,$2,$3,$4)", [username,useraccount,word,maxValue], function (err, values) {
                if(err){
                    console.log("insert into notice error: ",err)
                    res.send({status: 200, data: "", msg: "error"})
                }else{
                    console.log("insert into notice success")
                    res.send({status: 200, data: "", msg: "success"})
                }
            })
        }
    })
})

route.get("/getnotice",function(req,res){
    postgresql("select * from notice", [], function (err, values) {
        if(err){
            console.log("select * from notice error: ",err)
            res.send({ status: 200, data: '', msg: 'error'});
        }else{
            console.log("select * from notice success")
            res.send({ status: 200, data: values.rows, msg: 'success'});
        }
    })
})

route.get("/getnoticeandextension",function(req,res){
    let getnotice = new Promise((resolve,reject)=>{
        postgresql("select * from notice",[],function(error,values){
            if(error){
                console.log("getnoticeandextension select * from notice error: ",error)
            }else{
                console.log("getnoticeandextension select * from notice success")
                resolve({noticelist:values.rows})
            }
        })
    })
    let getextension = new Promise((resolve,reject)=>{
        postgresql("select * from extension",[],function(error,values){
            if(error){
                console.log("getnoticeandextension select * from extension error: ",error)
            }else{
                console.log("getnoticeandextension select * from extension success")
                resolve({extensionlist: values.rows})
            }
        })
    })
    Promise.all([getnotice,getextension])
    .then((result)=>{
        console.log("getnoticeandextension success")
        res.send(result)
    })
    .catch((err)=>{
        console.log("getnoticeandextension error: ",err)
    })
})

route.post("/addfile",express.json(),function(req,res){
    let form = new formidable.IncomingForm();
    form.uploadDir = path.join(__dirname, '../../files/filedownload');
    form.parse(req, function (err, fileds, files) {
        if (err) next(err);
        let oldname = files.logo.path
        let newname = files.logo.path.split("upload_")[0] + files.logo.name.split(".")[0] + "." + files.logo.name.split(".")[1]
        fs.rename(oldname, newname, function (err) {
            if (err) {
                console.log("fs file rename error: ", error)
            } else {
                console.log("fs file rename success")
            }
        })
        let filepath = "http://localhost:1730/files/filedownload/" + files.logo.name.split(".")[0] + "." + files.logo.name.split(".")[1]
        postgresql("insert into files (filesname,fileslink) values ($1,$2)",[files.logo.name.split(".")[0],filepath],function(err,values){
            if(err){
                console.log("insert into files err: ",err)
            }else{
                console.log("insert into files success")
            }
        })
        console.log("upload file success");
        res.send({ status: 200, data: '', msg: 'success', thumburl: filepath});
    })
})

route.get("/getfiles",function(req,res){
    postgresql("select * from files",[],function(err,values){
        if(err){
            console.log("select * from files error: ",err)
        }else{
            console.log("select * from files success")
            res.send(values.rows)
        }
    })
})

route.get("/deletefiles",function(req,res){
    postgresql("delete from files where filesname = $1",[req.query.filesname],function(err,values){
        if(err){
            console.log("delete from files error: ",err)
        }else{
            console.log("delete from files success")
            res.send(values.rows)
        }
    })
})

route.get("/addrelatedlinks",function(req,res){
    postgresql("insert into relatedlinks (linkname,linkpath) values ($1,$2)",[req.query.linkname,req.query.linkpath],function(err,values){
        if(err){
            console.log("insert into relatedlinks error: ",err)
        }else{
            res.send(values.rows)
        }
    })
})

route.get("/getrelatedlinks",function(req,res){
    postgresql("select * from relatedlinks",[],function(err,values){
        if(err){
            console.log("select * from relatedlinks error: ",err)
        }else{
            res.send(values.rows)
        }
    })
})

route.get("/deleterelatedlinks",function(req,res){
    postgresql("delete from relatedlinks  where linkname = $1",[req.query.linkname],function(err,values){
        if(err){
            console.log("delete from relatedlinks error: ",err)
        }else{
            res.send(values.rows)
        }
    })
})
route.get("/getfeedback",function(req,res){
    postgresql("select * from feedback",[],function(err,values){
        if(err){
            console.log("select * from feedback error: ",err)
            res.send({msg: "", state: "fail"})
        }else{
            console.log("select * from feedback success")
            res.send({msg: values.rows, state: "success"})
        }
    })
})

route.get("/deleteuser",function(req,res){
    postgresql("delete from user_login where useraccount=$1",[req.query.useraccount],function(err,values){
        if(err){
            console.log("delete from user_login error: ",err)
        }else{
            console.log("delete from user_login success")
        }
    })
})

route.get("/changeIdentify",function(req,res){
    postgresql("update user_login set identify = $1 where useraccount=$2",[req.query.identify,req.query.useraccount],function(err,values){
        if(err){
            console.log("update user_login set identify error: ",err)
        }else{
            console.log("update user_login set identify success")
        }
    })
})

module.exports = route