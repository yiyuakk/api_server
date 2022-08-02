// 导入数据库操作模块
const db = require('../db/index')
// 导入 bcryptjs 密码加密包
const bcrypt = require('bcryptjs')
// 导入 Token 包
const jwt = require('jsonwebtoken')
// 导入全局的配置文件
const config = require('../config')

// 注册新用户的处理函数
exports.regUser = (req, res) => {
    // 获取到客户端提交到服务器的用户信息
    const userinfo = req.body
    // 对表单中的数据进行合法性校验
    // if (!userinfo.username || !userinfo.password) {
    //     return res.send({status: 1, message: '用户名或密码不能为空！'})
    // }

    // 定义 SQL 语句，查询用户名是否被占用
    const sqlStr = 'select * from ev_users where username=?'
    db.query(sqlStr, [userinfo.username], function (err, results) {
        // 执行 SQL 语句失败
        if (err) {
            // return res.send({ status: 1, message: err.message })
            return res.cc(err)
        }
        // 用户名被占用
        if (results.length > 0) {
            // return res.send({ status: 1, message: '用户名被占用，请更换其他用户名！' })
            return res.cc('用户名被占用，请更换其他用户名！')
        }
        // 调用 bcrypt,hashSync() 对用户的密码进行加密
        userinfo.password = bcrypt.hashSync(userinfo.password, 10)
        // 定义插入新用户的 SQL 语句
        const sql = 'insert into ev_users set ?'
        // 调用 db.query() 执行 SQL 语句
        db.query(sql, {username: userinfo.username, password: userinfo.password}, (err, results) => {
            // 执行 SQL 语句失败
            // if (err) return res.send({status: 1, message: err.message})
            if (err) return res.cc(err)
            // SQL 语句执行成功，但影响行数不为 1
            // if (results.affectedRows !== 1) return res.send({status: 1, message: '注册用户失败，请稍后再试！'})
            if (results.affectedRows !== 1) return res.cc('注册用户失败，请稍后再试！')
            // 注册用户成功
            // return res.send({status: 0, message: '注册成功！'})
            res.cc('注册成功！', 0)
        }) 
    })
    
}


// 登录的处理函数
exports.login = (req, res) => {
    // 接收表单的数据
    const userinfo = req.body
    // 定义 SQL 语句
    const sql = `select * from ev_users where username=?`
    // 执行 SQL 语句，根据用户名查询用户的信息
    db.query(sql, userinfo.username, (err, results) => {
        // 执行 SQL 语句失败
        if(err) return res.cc(err)
        // 执行 SQL 语句成功，但是查询到数据条数不等于 1
        if(results.length !== 1) return res.send('登录失败！')

        // 拿着用户输入的密码，和数据库中存储的密码进行比较
        const compareResult = bcrypt.compareSync(userinfo.password, results[0].password)
        // 如果对比的结果等于 false，则证明用户输入的密码错误
        if (!compareResult) return res.cc('登录失败！')

        // 剔除密码和头像的值，剔除完毕之后，user 中只保留了用户的 id, username, nickname, email 这四个属性的值
        const user = { ...results[0], password: '', user_pic: '' }
        // 对用户的信息进行加密，生成 Token 字符串
        const tokenStr = jwt.sign(user, config.jwtSecretKey, { expiresIn: config.expiresIn })  // expiresIn: config.expiresIn 是 token 有效期
        // 调用 res.esnd() 将 Token 响应给客户端
        res.send({
            status: 0,
            message: '登陆成功！',
            token: 'Bearer ' + tokenStr,
        })
    })
    
}