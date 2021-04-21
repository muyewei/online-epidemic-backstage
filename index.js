const express = require("express")
const app = express()

const ws = require("nodejs-websocket")

const account = require("./route/account/account")
const paper = require("./route/paper/paper")
const question = require("./route/question/question")
const admin = require("./route/admin/admin")
const normal = require("./route/normal/normal")
const port = "1730"

app.use("/", function (req, res, next) {
    console.log("requst url: ", req.get("Host"))
    // res.send("hello world")
    next()
})

app.get("/123", function (req, res, next) {
    console.log("requst get: 123")
    res.send("hello('123')")
})

app.use("/account", account)
app.use("/paper", paper)
app.use("/question", question)
app.use("/admin", admin)
app.use("/normal", normal)


app.listen(port, function (err) {
    if (err) {
        console.log(err)
    } else {
        console.log("online listen on port: ", port)
    }
})

const server = ws.createServer(function (conn) {
    console.log("new connetion")
    conn.on("text", function (str) {
        boardcast(server,str)
    })
    conn.on("error", function (err) {
        console.log(err)  
    })
    conn.on("close", function () {
        console.log("close")
    })
    conn.sendText("from server")
}).listen(1704)

function boardcast(server,str) {
    server.connections.forEach(function (conn) {
        conn.sendText(str)
    })
}