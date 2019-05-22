//In dit bestand staan alle calls die betrekking hebben tot de resultaten van een stage

module.exports = function (app) {
    const sqlDB = require('../db/sqlDB');
    const functies = require('../functies');
    const jwt = require('jsonwebtoken');
    const fs = require('fs');
    const async = require('async');

    function getSecret() {
        if (fs.existsSync('./server/jwtsecret.js')) {
            return secret = require('../jwtsecret');
        } else {
            return secret = process.env.JWT_SECRET;
        }
    }

    app.post('/api/getstagevictories', function (req, response) {
        jwt.verify(req.body.token, getSecret(), function (err, user) {
            if (err) {
                res.redirect('/')
                throw err;
            } else {
                var race_id = req.body.race_id;
                var poule_id = req.body.poule_id;
                var subquery = `(SELECT username, stagescore, stagenr, rank() over (PARTITION BY stagenr ORDER BY stagescore DESC) FROM stage_selection
            INNER JOIN account_participation USING (account_participation_id)
            INNER JOIN account USING (account_id)
            INNER JOIN stage USING (stage_id)
            WHERE stage.race_id = ${race_id} AND NOT username = 'tester' AND budgetparticipation = ${req.body.budgetparticipation} AND stage.finished) AS subquery`
                var query1 = `SELECT ARRAY_AGG(username ORDER BY stagescore DESC) as usernames, ARRAY_AGG(stagescore ORDER BY stagescore DESC) as scores, stagenr FROM ${subquery} GROUP BY stagenr; `;//ranking per stage
                var query2 = `SELECT username, ARRAY_AGG(rank) as ranks, ARRAY_AGG(count) as rankcounts FROM 
            (SELECT username, rank, COUNT(rank) FROM ${subquery} GROUP BY username,rank) b
            GROUP BY username`//aantal keer per ranking
                var query = query1 + query2;
                sqlDB.query(query, (err, res) => {
                    if (err) { console.log("WRONG QUERY:", query); throw err; }
                    else {
                        var headersRank = ["Stage"];
                        var headersCount = ["User"];
                        var rowsRank = [];
                        var rowsCount = [];

                        var userCount = res[1].rows.length
                        for (var i in res[0].rows) {//ranking per stage
                            var row = [parseInt(i) + 1];
                            for (var j in res[0].rows[i].usernames) {
                                row.push(res[0].rows[i].usernames[j] + " (" + res[0].rows[i].scores[j] + ")");
                            }
                            rowsRank.push(row);
                        }


                        for (var i in res[1].rows) {//aantal keer per ranking
                            var user = res[1].rows[i];
                            var row = new Array(userCount + 1).fill(0)
                            row[0] = user.username;
                            for (var j in user.ranks) {
                                row[user.ranks[j]] = user.rankcounts[j];
                            }
                            rowsCount.push(row);
                        }

                        //make headers
                        for (var i = 1; i < userCount + 1; i++) {
                            headersRank.push(i + "e");
                            headersCount.push(i + "e");
                        }

                        //sort rowsCount
                        rowsCount.sort(function (a, b) {
                            for (var i = 1; i < userCount + 1; i++) {
                                if (a[i] > b[i]) return false;
                                if (a[i] < b[i]) return true;
                            }
                            return false;
                        })

                        response.send({ rankTable: { header: headersRank, rows: rowsRank }, countTable: { header: headersCount, rows: rowsCount } })
                    }
                })
            }
        })
    })


    app.post('/api/getriderpointsall', function (req, res) {
        jwt.verify(req.body.token, getSecret(), function (err, user) {
            if (err) {
                res.redirect('/')
                throw err;
            } else {
                var race_id = req.body.race_id;
                var query = `SELECT  concat(firstname, ' ', lastname) AS "Name", team AS "Team ", price AS "Price", SUM(stagescore) AS "Etappe",
            SUM(gcscore) AS "AK", SUM(pointsscore) AS "Punten", SUM(komscore) AS "Berg", SUM(yocscore) AS "Jong", 
            SUM(teamscore) AS "Team", SUM(totalscore) AS "Total", ROUND(SUM(totalscore)*1e6/price,0) AS "Points per Million" FROM rider_participation  
            INNER JOIN results_points USING (rider_participation_id)
            INNER JOIN rider USING(rider_id)
            WHERE rider_participation.race_id = ${race_id}
            GROUP BY "Name", "Team ", "Price"
            ORDER BY "Total" DESC`
                //0 for string 1 for number
                var coltype = { "Name": 0, "Team ": 0, "Price": 1, "Etappe": 1, "AK": 1, "Punten": 1, "Berg": 1, "Jong": 1, "Team": 1, "Total": 1, "Points per Million": 1 };
                sqlDB.query(query, (err, results) => {
                    if (err) { console.log("WRONG QUERY:", query); throw err; }
                    res.send({
                        tableData: results.rows,
                        coltype: coltype,
                        title: "Alle Renners"
                    })
                })
            }
        })
    })

    app.post('/api/getriderpointsselected', function (req, res) {
        jwt.verify(req.body.token, getSecret(), function (err, user) {
            if (err) {
                res.redirect('/')
                throw err;
            } else {
                var race_id = req.body.race_id;
                var query = `SELECT  concat(firstname, ' ', lastname) AS "Name", team AS "Team ",price AS "Price", SUM(stagescore)/GREATEST(count(DISTINCT username),1) AS "Etappe",  
            SUM(gcscore)/GREATEST(count(DISTINCT username),1) AS "AK", SUM(pointsscore)/GREATEST(count(DISTINCT username),1) AS "Punten", SUM(komscore)/GREATEST(count(DISTINCT username),1) AS "Berg", SUM(yocscore)/GREATEST(count(DISTINCT username),1) AS "Jong", SUM(teamscore)/GREATEST(count(DISTINCT username),1) AS "Team", SUM(totalscore)/GREATEST(count(DISTINCT username),1) AS "Total", 
            ROUND(SUM(totalscore)/GREATEST(count(DISTINCT username),1)*1e6/price,0) AS "Points per Million",  
            count(DISTINCT username) AS "Usercount", string_agg(DISTINCT username, ', ') AS "Users" FROM results_points
            INNER JOIN rider_participation USING (rider_participation_id)
            INNER JOIN rider USING(rider_id)
            LEFT JOIN team_selection_rider on results_points.rider_participation_id = team_selection_rider.rider_participation_id
            LEFT JOIN account_participation USING(account_participation_id)
            LEFT JOIN account USING (account_id)
            WHERE rider_participation.race_id = ${race_id} AND rider_participation.rider_participation_id in (select rider_participation_id from team_selection_rider) AND NOT username = 'tester' AND budgetparticipation = ${req.body.budgetparticipation}
            GROUP BY "Name", "Team ", "Price"
            ORDER BY "Points per Million" DESC`
                //0 for string 1 for number
                var coltype = { "Name": 0, "Team ": 0, "Price": 1, "Etappe": 1, "AK": 1, "Punten": 1, "Berg": 1, "Jong": 1, "Team": 1, "Total": 1, "Points per Million": 1, "Usercount": 1 };
                sqlDB.query(query, (err, results) => {
                    if (err) { console.log("WRONG QUERY:", query); throw err; }
                    res.send({
                        tableData: results.rows,
                        coltype: coltype,
                        title: "Alle Geselecteerde Renners"
                    })
                })
            }
        })
    })

    app.post('/api/getriderresults', function (req, res) {
        jwt.verify(req.body.token, getSecret(), function (err, user) {
            if (err) {
                res.redirect('/')
                throw err;
            } else {
                var query = `SELECT stagenr, stagepos, stagescore, teamscore, totalscore FROM results_points
            INNER JOIN rider_participation USING(rider_participation_id)
            INNER JOIN rider USING(rider_id)
            INNER JOIN stage USING(stage_id)
            WHERE rider_participation_id = ${req.body.rider_participation_id}
            ORDER BY stagenr; 
            SELECT name, year, firstname, lastname FROM rider_participation
            INNER JOIN race USING(race_id)
            INNER JOIN rider USING(rider_id)
            WHERE rider_participation_id = ${req.body.rider_participation_id};
            SELECT 0 AS stagenr,  0 AS stagepos, SUM(stagescore) AS Stagescore, sum(teamscore) AS Teamscore, SUM(totalscore) AS Totalscore FROM results_points
            WHERE rider_participation_id = ${req.body.rider_participation_id}`
                //0 for string 1 for number
                var coltype = {};
                sqlDB.query(query, (err, results) => {
                    if (err) { console.log("WRONG QUERY:", query); throw err; }
                    var total = results[2].rows[0];
                    total.stagenr = "Total";
                    total.stagepos = "";
                    results[0].rows.push(total)
                    var headerinfo = results[1].rows[0];
                    var title = headerinfo.firstname + " " + headerinfo.lastname + " - " + headerinfo.name + " " + headerinfo.year;
                    res.send({
                        tableData: results[0].rows,
                        coltype: coltype,
                        title: title
                    })
                })
            }
        })
    })


    app.post('/api/missedpoints', function (req, res) {
        jwt.verify(req.body.token, getSecret(), function (err, user) {
            if (err) {
                res.redirect('/')
                throw err;
            } else {
                missedPoints(user.account_id,req.body.race_id,req.body.budgetparticipation,function(err,outputArray){
                    if(err) throw err;
                    res.send({
                        tableData: outputArray,
                        title: "Gemiste Punten"
                    })
                })    
            }
        })
    })

    app.post('/api/missedpointsall', function (req, res) {
        jwt.verify(req.body.token, getSecret(), function (err, user) {
            if (err) {
                res.redirect('/')
                throw err;
            } else {
                async.auto({
                    bierfietsen: function(callback){
                        missedPoints(1,req.body.race_id,req.body.budgetparticipation,callback)
                    },
                    rens: function(callback){
                        missedPoints(2,req.body.race_id,req.body.budgetparticipation,callback)
                    },
                    sam: function(callback){
                        missedPoints(4,req.body.race_id,req.body.budgetparticipation,callback)
                    },
                    yannick: function(callback){
                        missedPoints(5,req.body.race_id,req.body.budgetparticipation,callback)
                    }
                }, function (err,results){
                    if(err) throw err;
                    var users = []
                    users.push({tableData: results.bierfietsen, title: "Bierfietsen"});
                    users.push({tableData: results.rens, title: "Rens"});
                    users.push({tableData: results.sam, title: "Sam"});
                    users.push({tableData: results.yannick, title: "Yannick"});
                    res.send({users})
            })
            }
        })

    })

    missedPoints = function (account_id, race_id, budgetparticipation, callback) {
        var teamselection = `SELECT rider_participation_id FROM team_selection_rider
                INNER JOIN account_participation USING(account_participation_id)
                WHERE race_id = ${race_id} AND account_id = ${account_id} AND budgetparticipation = ${budgetparticipation}\n `
        var totalscore = 'totalscore';
        if(budgetparticipation) totalscore = 'totalscore - teamscore';
        var ridersQuery = `SELECT stagenr, ARRAY_AGG(JSON_BUILD_OBJECT('id',rider_participation_id,'stage', stagescore,'total',${totalscore}) ORDER BY ${totalscore} DESC) AS points FROM results_points 
                INNER JOIN stage USING(stage_id)
                WHERE rider_participation_id IN (${teamselection})
                GROUP BY stagenr;\n `;
        var resultsQuery = `SELECT stagescore FROM stage_selection 
                INNER JOIN stage USING(stage_id) WHERE account_participation_id = 
                (SELECT account_participation_id FROM account_participation WHERE account_id = ${account_id} AND budgetparticipation = ${budgetparticipation} AND race_id = ${race_id})
                ORDER BY stagenr;\n `
        var totalQuery = ridersQuery + resultsQuery;
        sqlDB.query(totalQuery, (err, results) => {
            if (err) { console.log("WRONG QUERY:", totalQuery); throw err; }
            var outputArray = [];
            var actualPoints = results[1].rows.map(a => a.stagescore);
            var optimalTotal = 0;
            var actualTotal = 0;
            var missedTotal = 0;
            for (var i = 0; i < results[0].rows.length; i++) {
                optimalPoints = 0;
                var totalscores = results[0].rows[i].points.map(scores => ({ score: scores.total, id: scores.id }));
                var stagescores = results[0].rows[i].points.map(scores => ({ score: scores.stage, id: scores.id }));
                stagescores.sort(function(a,b){return b.score - a.score})
                var bestId = stagescores[0].id;
                var pos = functies.attrIndex(totalscores, 'index', bestId)
                var forRenners = 9;
                if (pos > 8) forRenners = 8;

                for (var j = 0; j < forRenners; j++) {
                    optimalPoints += totalscores[j].score;
                    if (totalscores[j].id === bestId) {
                        optimalPoints += stagescores[0].score * .5;
                    }
                }
                if (forRenners === 8) {
                    outputArray.push({ Behaald: "Zeg tegen Rens", Optimaal: "dat er iets", Gemist: "speciaals gebeurt is" })
                } else {

                    outputArray.push({ Etappe: i + 1, Behaald: actualPoints[i], Optimaal: optimalPoints, Gemist: optimalPoints - actualPoints[i] })
                    optimalTotal += optimalPoints;
                    actualTotal += actualPoints[i];
                    missedTotal += optimalPoints - actualPoints[i];
                }
            }
            outputArray.push({ Etappe: "Totaal", Behaald: actualTotal, Optimaal: optimalTotal, Gemist: missedTotal })
            callback(err,outputArray);
        })
    }

    app.post('/api/teamoverzicht', function (req, res) {
        jwt.verify(req.body.token, getSecret(), function (err, user) {
            if (err) {
                res.redirect('/')
                throw err;
            } else {
                teamoverzicht(user.account_id,req.body.race_id,req.body.budgetparticipation,function(err,results){
                    if(err) throw err;
                    res.send({
                        tableData: results.tableData,
                        title: "",
                        coltype: results.coltype
                    })
                })    
            }
        })
    })

    app.post('/api/teamoverzichtall', function (req, res) {
        jwt.verify(req.body.token, getSecret(), function (err, user) {
            if (err) {
                res.redirect('/')
                throw err;
            } else {
                async.auto({
                    bierfietsen: function(callback){
                        teamoverzicht(1,req.body.race_id,req.body.budgetparticipation,callback)
                    },
                    rens: function(callback){
                        teamoverzicht(2,req.body.race_id,req.body.budgetparticipation,callback)
                    },
                    sam: function(callback){
                        teamoverzicht(4,req.body.race_id,req.body.budgetparticipation,callback)
                    },
                    yannick: function(callback){
                        teamoverzicht(5,req.body.race_id,req.body.budgetparticipation,callback)
                    }
                }, function (err,results){
                    if(err) throw err;
                    var users = []
                    users.push({tableData: results.bierfietsen.tableData, title: "Bierfietsen", coltype: results.bierfietsen.coltype});
                    users.push({tableData: results.rens.tableData, title: "Rens", coltype: results.bierfietsen.coltype});
                    users.push({tableData: results.sam.tableData, title: "Sam", coltype: results.bierfietsen.coltype});
                    users.push({tableData: results.yannick.tableData, title: "Yannick", coltype: results.bierfietsen.coltype});
                    res.send({users})
            })   
            }
        })
    })

    teamoverzicht = function (account_id, race_id, budgetparticipation, callback){
        var account_participation_id = `(SELECT account_participation_id FROM account_participation WHERE account_id = ${account_id} AND race_id = ${race_id} AND budgetparticipation = ${budgetparticipation})`
        var selected_riders_stages = `(SELECT rider_participation_id, kopman_id, stage_id FROM stage_selection_rider
            INNER JOIN stage_selection USING(stage_selection_id)
            WHERE account_participation_id = ${account_participation_id}
            ORDER BY stage_id) a`
        var totalscore = `CASE WHEN a.kopman_id = a.rider_participation_id THEN totalscore + stagescore * .5 ELSE totalscore END`
        var stagescore = `CASE WHEN a.kopman_id = a.rider_participation_id THEN stagescore * 1.5 ELSE stagescore END`
        var teamscore = `,  SUM(teamscore) AS "Team"`;
        if(budgetparticipation){
            totalscore = `CASE WHEN a.kopman_id = a.rider_participation_id THEN totalscore + stagescore * .5 - teamscore ELSE totalscore - teamscore END`
            teamscore = '';
        }
        var query = `SELECT CONCAT(firstname, ' ', lastname) as "Name", SUM(${stagescore}) AS "Stage", SUM(gcscore) AS "AK", SUM(pointsscore) AS "Punten", SUM(komscore) AS "Berg", SUM(yocscore) AS "Jong" ${teamscore}, SUM(${totalscore}) "Total", COUNT(rider_participation_id) "Selected", ROUND(SUM(${totalscore})/COUNT(rider_participation_id),0) AS "Per Etappe"  from rider
                    INNER JOIN rider_participation USING(rider_id)
                    RIGHT JOIN ${selected_riders_stages} USING (rider_participation_id)
                    INNER JOIN results_points USING(stage_id,rider_participation_id)
                    GROUP BY "Name"
                    ORDER BY "Total" DESC`
        var coltype = { "Name": 0, "Stage": 1, "AK": 1, "Punten": 1, "Berg": 1, "Jong": 1, "Team": 1, "Total": 1, "Selected": 1, "Per Etappe": 1 };

        sqlDB.query(query,(err,results) => {
            if (err) { console.log("WRONG QUERY:", query); throw err; }
            callback(err,{tableData:results.rows, coltype})
        })
    }


    //CHARTS
    //CHARTS misschien nieuwe file
    app.post('/api/chartuserstagescores', function (req, res) {
        jwt.verify(req.body.token, getSecret(), function (err, user) {
            if (err) {
                res.redirect('/')
                throw err;
            } else {
                var query = `SELECT username, stagenr, totalscore FROM stage_selection
            INNER JOIN account_participation USING (account_participation_id)
            INNER JOIN account USING (account_id)
            INNER JOIN stage USING (stage_id)
            WHERE stage.race_id = ${req.body.race_id} AND stage.finished AND budgetparticipation = ${req.body.budgetparticipation} AND NOT username = 'tester'
            ORDER BY username, stagenr`
                sqlDB.query(query, (err, results) => {
                    if (err) { console.log("WRONG QUERY:", query); throw err; }
                    var username = results.rows[0].username;
                    var userObj = {
                        type: "line",
                        name: username,
                        showInLegend: true,
                        dataPoints: []
                    }
                    var data = [];
                    userObj.dataPoints.push({ x: 0, y: 0 })

                    for (var i in results.rows) {
                        if (userObj.name == results.rows[i].username) {
                            userObj.dataPoints.push({ x: results.rows[i].stagenr, y: results.rows[i].totalscore })
                        } else {
                            data.push(userObj);
                            username = results.rows[i].username;
                            userObj = {
                                type: "line",
                                name: username,
                                showInLegend: true,
                                dataPoints: []
                            }
                            userObj.dataPoints.push({ x: 0, y: 0 })
                            userObj.dataPoints.push({ x: results.rows[i].stagenr, y: results.rows[i].totalscore })
                        }

                    }
                    data.push(userObj)
                    for (i in userObj.dataPoints) {
                        var total = 0;
                        for (user in data) {
                            total += data[user].dataPoints[i].y;
                        }
                        var avg = total / data.length;
                        for (user in data) {
                            data[user].dataPoints[i].y -= avg;
                        }
                    }
                    data.sort(function (a, b) { return b.dataPoints[b.dataPoints.length - 1].y - a.dataPoints[a.dataPoints.length - 1].y })
                    res.send(data);
                })
            }
        })
    })

    app.post('/api/chartuserranking', function (req, res) {
        jwt.verify(req.body.token, getSecret(), function (err, user) {
            if (err) {
                res.redirect('/')
                throw err;
            } else {

                var query = `SELECT username, stagenr, rank() over (PARTITION BY stagenr ORDER BY totalscore desc) FROM stage_selection
            INNER JOIN account_participation USING (account_participation_id)
            INNER JOIN account USING (account_id)
            INNER JOIN stage USING (stage_id)
            WHERE stage.race_id = ${req.body.race_id} AND budgetparticipation = ${req.body.budgetparticipation} AND stage.finished AND NOT username = 'tester'
            ORDER BY username, stagenr`
                sqlDB.query(query, (err, results) => {
                    if (err) { console.log("WRONG QUERY:", query); throw err; }
                    var username = results.rows[0].username;
                    var userObj = {
                        type: "line",
                        name: username,
                        showInLegend: true,
                        dataPoints: []
                    }
                    var data = [];

                    for (var i in results.rows) {
                        if (userObj.name == results.rows[i].username) {
                            userObj.dataPoints.push({ x: results.rows[i].stagenr, y: parseInt(results.rows[i].rank) })
                        } else {
                            data.push(userObj);
                            username = results.rows[i].username;
                            userObj = {
                                type: "line",
                                name: username,
                                showInLegend: true,
                                dataPoints: []
                            }
                            userObj.dataPoints.push({ x: results.rows[i].stagenr, y: parseInt(results.rows[i].rank) })
                        }

                    }
                    data.push(userObj)

                    data.sort(function (a, b) { return b.dataPoints[b.dataPoints.length - 1].y - a.dataPoints[a.dataPoints.length - 1].y })
                    res.send(data);
                })
            }
        })
    })

    app.post('/api/chartriderpercentage', function (req, res) {
        jwt.verify(req.body.token, getSecret(), function (err, user) {
            if (err) {
                res.redirect('/')
                throw err;
            } else {
                var account_participation_id = `(SELECT account_participation_id FROM account_participation WHERE account_id = ${user.account_id} AND race_id = 5 AND budgetparticipation = ${req.body.budgetparticipation})`
                var query = `SELECT totalscore, lastname, stagenr FROM results_points
            INNER JOIN rider_participation USING (rider_participation_id)
            INNER JOIN rider USING (rider_id)
            INNER JOIN stage USING (stage_id)
            WHERE rider_participation_id IN (SELECT rider_participation_id FROM team_selection_rider WHERE account_participation_id = ${account_participation_id}) AND totalscore > 0 AND stage.finished
            ORDER by lastname, stagenr`
                sqlDB.query(query, (err, results) => {
                    if (err) { console.log("WRONG QUERY:", query); throw err; }
                    var lastname = results.rows[0].lastname;
                    var riderObj = {
                        type: "stackedColumn",
                        name: lastname,
                        showInLegend: true,
                        dataPoints: []
                    }
                    var data = [];

                    for (var i in results.rows) {
                        if (riderObj.name == results.rows[i].lastname) {
                            riderObj.dataPoints.push({ x: results.rows[i].stagenr, y: results.rows[i].totalscore })
                        } else {
                            data.push(riderObj);
                            lastname = results.rows[i].lastname;
                            riderObj = {
                                type: "stackedColumn",
                                name: lastname,
                                showInLegend: true,
                                dataPoints: []
                            }
                            riderObj.dataPoints.push({ x: results.rows[i].stagenr, y: results.rows[i].totalscore })
                        }

                    }
                    data.push(riderObj)
                    res.send(data);
                })
            }
        })
    })

    app.post('/api/chartriderpercentagetotal', function (req, res) {
        jwt.verify(req.body.token, getSecret(), function (err, user) {
            if (err) {
                res.redirect('/')
                throw err;
            } else {
                var currentStageNum = functies.stageNumKlassieker();//TODO change to Grote ronde
                var account_participation_id = `(SELECT account_participation_id FROM account_participation WHERE account_id = ${user.account_id} AND race_id = 5 AND budgetparticipation = ${req.body.budgetparticipation})`
                var query = `SELECT totalscore, lastname, stagenr FROM results_points
            INNER JOIN rider_participation USING (rider_participation_id)
            INNER JOIN rider USING (rider_id)
            INNER JOIN stage USING (stage_id)
            WHERE rider_participation_id IN (SELECT rider_participation_id FROM team_selection_rider WHERE account_participation_id = ${account_participation_id})
            ORDER by lastname, stagenr`
                var query2 = `select array_agg(stagenr) as stages, array_agg(totalscore) as scores, lastname from team_selection_rider
            left join results_points using(rider_participation_id)
            left join rider_participation using(rider_participation_id)
            left join rider using(rider_id)
            left join stage using(stage_id)
            where account_participation_id = ${account_participation_id} AND stage.finished
            group by lastname`

                sqlDB.query(query2, (err, results) => {
                    if (err) { console.log("WRONG QUERY:", query2); throw err; }
                    var data = [];

                    for (var i in results.rows) {
                        var lastname = results.rows[i].lastname;
                        var riderObj = {
                            type: "line",
                            name: lastname,
                            showInLegend: true,
                            dataPoints: []
                        }
                        var rider = results.rows[i]
                        var total = 0;
                        for (var j = 0; j < currentStageNum + 1; j++) {
                            var index = rider.stages.indexOf(j);
                            if (index + 1) {// index not -1
                                total += rider.scores[index];
                            }
                            riderObj.dataPoints.push({ x: j, y: total })


                        }
                        data.push(riderObj)
                    }


                    res.send(data);
                })
            }
        })
    })

}