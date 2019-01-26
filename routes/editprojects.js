var express = require('express');
var router = express.Router();
var userChecker = require('../helper/userChecker')

module.exports = function (pool) {

    router.get('/', function (req, res, next) {
        pool.query('select * from users ORDER BY userid', (err, data) => {
            if (err) return res.send(err)
            res.render('add', { users: data.rows });
        })
    });

    router.post('/', function (req, res, next) {
        // console.log(req.body);
        pool.query(`insert into projects (name) values ('${req.body.projectName}')`, (err, projectCreated) => {
            if (err) return res.send(err)
            if (req.body.users) {
                pool.query(`select max(projectid) from projects`, (err, latestId) => {
                    if (err) return res.send(err)

                    let values = [];
                    req.body.users.forEach((item) => {
                        values.push(`(${latestId.rows[0].max}, ${item.split("#")[0]}, '${item.split("#")[1]}')`);
                        console.log(values);
                    })

                    let sqlMembers = `insert into members (projectid, userid, role) values `
                    sqlMembers += values.join(',')
                    console.log(sqlMembers);

                    pool.query(sqlMembers, (err, memberCreated) => {
                        if (err) return res.send(err)
                        res.redirect('/projects');
                    });
                })
            } else {
                res.redirect('/projects');
            }

        });
    });











    return router;
}