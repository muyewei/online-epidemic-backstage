const { USER,PASSWORD,HOST,PORT, DATABASE } = require('../constant/database/database')

const { Pool } = require('pg')

const pool = new Pool({
    user: USER,
    host: HOST,
    password: PASSWORD,
    port: PORT,
    database: DATABASE
})

/**
 * @param sql 数据库控制语句 type:STRING
 * @param params 语句传参 type:ARRAY
 * @param callback 回调函数 type:FUNCTION -- functiong(error, rows)
 */

module.exports = function (sql, params, callback) {
    pool.connect(function (err, connection, done) {
        if (err) {
            console.log('connect query: ' + err)
            return
        }
        connection.query(sql, params, function (err, rows) {
            done()
            callback(err, rows)
        })
    })
}
