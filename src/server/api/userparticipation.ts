module.exports = (app, current_race) => {
    const sqlDB = require('../db/sqlDB');

    const current_race_id = current_race.id;

    app.post('/api/getracepartcipation', (req, res) => {
        const query = `SELECT * FROM account_participation
        WHERE race_id = ${current_race_id} AND account_id = ${req.user.account_id}`;
        sqlDB.query(query, (err, results) => {
            if (err) {
                console.log("WRONG QUERY:", query);
                throw err;
            } else {
                res.send(results);
            }
        });
    });

    // app.post('/api/addparticipation',function(req,res){
    //     if(!req.user){
    //         res.send(false)
    //         res.redirect('/')
    //     }else{
    //         var account_id = req.user.account_id;
    //         var race_id = current_race_id;
    //         query = `INSERT INTO account_participation (account_id, race_id, budgetParticipation) 
    //         VALUES($1, $2, FALSE),($1, $2, TRUE)
    //         ON CONFLICT (account_id, race_id, budgetParticipation) DO NOTHING`
    //         var values = [account_id,race_id];

    //         sqlDB.query(query, values, (err) => {
    //             if (err) {console.log("WRONG QUERY:",query); throw err;}
    //             else{
    //                 res.send("added")
    //             }
    //         });
    //     }
    // })

    app.post('/api/getprofiledata', (req, res) => {
        console.log(req.body);
        let account_id;
        if (req.body.account_id) { // Als het geen nummer is, ga er vanuit dat het een username is
            account_id = req.body.account_id;
        }
        if (req.body.username) {
            account_id = `(SELECT account_id FROM account
                    WHERE username ILIKE '${req.body.username}')`;
        }
        const accountQuery = `SELECT * FROM account
                WHERE account_id = ${account_id};\n `;
        const participationsQuery = `SELECT * FROM account_participation
                WHERE account_id = ${account_id};\n `;
        const rankQuery = `(SELECT account_id, race_id, rank() over (PARTITION BY race_id ORDER BY finalscore DESC) FROM account_participation
                    INNER JOIN account USING (account_id)
                    WHERE budgetparticipation = false) sub`;
        const racePointsQuery = `SELECT  CONCAT('/',name,'-',year,'/stage/22') AS "Race_link", CONCAT(INITCAP(name),' ',year) AS race, finalscore, rank FROM
                (SELECT * FROM account_participation
                INNER JOIN race USING(race_id)
                INNER JOIN ${rankQuery} USING(race_id,account_id)
                WHERE account_id = ${account_id} AND budgetparticipation = false
                ORDER BY year, name) a`;
        const totalQuery = accountQuery + participationsQuery + racePointsQuery;
        sqlDB.query(totalQuery, (err, results) => {
            if (err) {
                console.log('WRONG QUERY:', totalQuery);
                throw err;
            } else {
                console.log(results[0].rows)
                if (results[0].rows.length === 0) {
                    res.status(404).send('User not found')
                } else {
                    const username = results[0].rows[0].username;
                    const scores = results[2].rows;
                    res.send({
                        userNotFound: false,
                        username,
                        scores,
                    });
                }
            }
        });
    });
};