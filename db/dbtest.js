const postgre = require('./db')
let database = ''
let sql = ''
let params = []
/**
 * @param database 数据库 type:STRING
 * @param sql 数据库控制语句 type:STRING
 * @param params 语句传参 type:ARRAY
 * @param callback 回调函数 type:FUNCTION -- functiong(error, rows)
 */
postgre(database, sql, params, function () {
    
})