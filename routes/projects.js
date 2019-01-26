var express = require('express');
var router = express.Router();
var userChecker = require('../helper/userChecker')

module.exports = function (pool) {

    router.get('/', function (req, res, next) {
        const url = req.url == '/' ? '/?page=1' : req.url;
        const page = req.query.page || 1;
        const limit = 3;
        const offset = (page - 1) * limit
        let searching = false;
        let params = [];

        if (req.query.cid && req.query.id) {
            params.push(`projects.projectid = ${req.query.id}`);
            searching = true;
        }

        if (req.query.cname && req.query.name) {
            params.push(`projects.name ilike '%${req.query.name}%'`);
            searching = true;
        }

        if (req.query.cmember && req.query.member) {
            params.push(`CONCAT (users.firstname,' ',users.lastname) = '${req.query.member}'`);
            searching = true;
        }

        let sql = `select count(id) as total from (select distinct projects.projectid as id from projects
        LEFT JOIN members ON projects.projectid = members.projectid
        LEFT JOIN users ON members.userid = users.userid`

        if (searching) {
            sql += ` where ${params.join(' AND ')}`
        }

        sql += `) as project_member`;


        pool.query(sql, (err, data) => {
            const totalPages = data.rows[0].total;
            const pages = Math.ceil(totalPages / limit)
            console.log(totalPages, pages);


            sql = `select distinct projects.projectid, projects.name from projects
        LEFT JOIN members ON projects.projectid = members.projectid
        LEFT JOIN users ON members.userid = users.userid`

            if (searching) {
                sql += ` where ${params.join(' AND ')}`
            }
            sql += ` ORDER BY projects.projectid LIMIT ${limit} OFFSET ${offset}`

            let subquery = `select projectid from projects`

            if (searching) {
                subquery += ` where ${params.join(' AND ')}`
            }

            subquery += ` ORDER BY projectid LIMIT ${limit} OFFSET ${offset}`

            let sqlMembers = `SELECT projects.projectid, CONCAT (users.firstname,' ',users.lastname) AS fullname
        FROM members
        INNER JOIN projects ON members.projectid = projects.projectid
        INNER JOIN users ON users.userid = members.userid WHERE projects.projectid IN
        (${subquery})`;
            // console.log(sqlMembers);

            pool.query(sql, (err, projectData) => {

                pool.query(sqlMembers, (err, memberData) => {
                    projectData.rows.map(project => {
                        project.members = memberData.rows.filter(member => {
                            return member.projectid == project.projectid
                        }).map(item => item.fullname)
                    })

                    pool.query(`select CONCAT(firstname,' ',lastname) AS fullname from users`, (err, usersData) => {
                        res.render('projects', {
                            data: projectData.rows,
                            users: usersData.rows,
                            pagination: {
                                pages,
                                page,
                                totalPages,
                                url
                            },
                            query: req.query
                        })
                    })
                })
            })
        })
    });


    router.get('/delete/:id', function (req, res, next) {
        let id = req.params.id;
        console.log(req.params.id);
        console.log(req.body.id);

        pool.query(`delete from members where projectid= ${id}`,
            req.body.id, (err) => {
                if (err) return res.send(err)
                pool.query(`delete from projects where projectid= ${id}`,
                    req.body.id, (err) => {
                        if (err) {
                            console.error(err.messsage);
                        }
                        console.log('delete success');
                        res.redirect('/projects');
                    })
            })
    });

    return router;
}