var express = require('express');
var router = express.Router();
var userChecker = require('../helper/userChecker')

module.exports = function (pool) {
    router.get('/', userChecker, (req, res) => {
        //console.log(req.session.user.userid);
        pool.query(`select members.*, users.* from members left join users on users.userid = members.userid where members.userid=${req.session.user.userid}`, (err, data) => {
            if (err) {
                console.error(err);
                res.send(err);
            }
            res.render('profile', {
                email: req.session.user.email,
                role: data.rows[0].role
            })
            //console.log(data.rows[0].email);
        })
    });

    router.post('/', userChecker, (req, res) => {
        let position = req.body.position;
        let pass = req.body.password;
        let fulltime = req.body.fulltime;
        console.log(fulltime);
        console.log(position);
        console.log(pass);
        let sql1 = `UPDATE members SET role='${position}' WHERE userid='${req.session.user.userid}'`;
        pool.query(sql1, (err) => {
            console.log("update position success");
            if (pass.length == 0) {
                res.redirect('/')
            } else {
                let sql2 = `UPDATE users SET password='${pass}',fulltime='${fulltime}' WHERE userid='${req.session.user.userid}'`;
                pool.query(sql2, (err) => {
                    res.redirect('/')
                    console.log("update password success");
                })
            }
        })
    });
    return router;
}