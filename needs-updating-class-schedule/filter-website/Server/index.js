//Libraries
const express = require('express');
const multer = require('multer');
const mysql = require('mysql2/promise');
// const course = require('./Model/course');

//Setup defaults for script
const app = express();
app.use(express.static('public'))
const upload = multer()
const port = 80 //Default port to http server

let connection = null;

async function query(sql, params) {
    //Singleton DB connection
    if (null === connection) {
        console.log('Here');
        connection = await mysql.createConnection({
            host: "student-databases.cvode4s4cwrc.us-west-2.rds.amazonaws.com",
            user: "NATEOILAR",
            password: "5BHURKNOwGSYBdxaUecAI512rjEi2b3ieVf",
            database: 'NATEOILAR'
        });
    }

    const [results,] = await connection.execute(sql, params);
    return results;
}

//The * in app.* needs to match the method type of the request
// this method is responsable for a GET request for the path /noun/

// PA4 //
app.get(
    '/developer/', //this should be the noun for your API
    upload.none(),
    async (request, response) => {
        let result = {};
        try {
            let selectSql = `SELECT
                        d.id AS developer_id,
                        g.id AS game_id,
                        d.name,
                        d.country,
                        d.province,
                        g.game,
                        g.genre,
                        g.art_style
                    FROM games g
                    INNER JOIN developer d ON g.developer_id = d.id`;
            let whereStatements = [];
            let orderByStatements = [];
            let queryParameters = [];

            if (typeof request.query.studio !== 'undefined' && request.query.studio.length > 0) {
                whereStatements.push("d.name LIKE ?");
                queryParameters.push('%' + request.query.studio + '%');
            }

            if (typeof request.query.country !== 'undefined' && request.query.country.length > 0) {
                whereStatements.push("d.country LIKE ?");
                queryParameters.push('%' + request.query.country + '%');
            }

            if (typeof request.query.province !== 'undefined' && request.query.province.length > 0) {
                whereStatements.push("d.province LIKE ?");
                queryParameters.push('%' + request.query.province + '%');
            }

            if (typeof request.query.game !== 'undefined' && request.query.game.length > 0) {
                whereStatements.push("g.game LIKE ?");
                queryParameters.push('%' + request.query.game + '%');
            }

            if (typeof request.query.genre !== 'undefined' && request.query.genre.length > 0) {
                whereStatements.push("g.genre LIKE ?");
                queryParameters.push('%' + request.query.genre + '%');
            }

            if (typeof request.query.art_style !== 'undefined' && request.query.art_style.length > 0) {
                whereStatements.push("g.art_style LIKE ?");
                queryParameters.push('%' + request.query.art_style + '%');
            }

            //Dynamically add WHERE expressions to SELECT statements if needed
            if (whereStatements.length > 0) {
                selectSql = selectSql + ' WHERE ' + whereStatements.join(' AND ');
            }

            //Dynamically add ORDER BY expressions to SELECT statements if needed
            orderByStatements.push("d.name ASC");
            if (orderByStatements.length > 0) {
                selectSql = selectSql + ' ORDER BY ' + orderByStatements.join(', ');
            }

            //Dynamically add LIMIT expressions to SELECT statements if needed
            if (typeof request.query.limit !== 'undefined' && request.query.limit > 0 && request.query.limit < 6) {
                selectSql = selectSql + ' LIMIT ' + request.query.limit;
            }

            result = await query(selectSql, queryParameters);
        } catch (error) {
            console.log(error);
            return response.status(500) //Error code 
                .json({ message: 'Something went wrong with the server.' });
        }
        //Default response object
        response.json({ 'data': result });
    });

app.get('/developer/:id/', upload.none(), async (request, response) => {
    try {
        const selectSql = `
            SELECT
                d.id AS developer_id,
                g.id AS game_id,
                d.name,
                d.country,
                d.province,
                g.game,
                g.genre,
                g.art_style
            FROM games g
            INNER JOIN developer d ON g.developer_id = d.id
            WHERE g.id = ?
        `;

        const result = await query(selectSql, [request.params.id]);

        response.json({ data: result[0] });
    } catch (error) {
        console.log(error);
        response.status(500).json({ message: 'Something went wrong with the server.' });
    }
});

// PA5 //

app.post('/developer/', upload.none(), async (request, response) => {

    let errors = [];

    if (!request.body.studio || request.body.studio.trim() === "") {
        errors.push({ path: "studio-error", message: "Studio is required" });
    }

    if (!request.body.country || request.body.country.trim() === "") {
        errors.push({ path: "country-error", message: "Country is required" });
    }

    if (!request.body.province || request.body.province.trim() === "") {
        errors.push({ path: "province-error", message: "Province is required" });
    }

    if (!request.body.game || request.body.game.trim() === "") {
        errors.push({ path: "game-error", message: "Game is required" });
    }

    if (!request.body.genre || request.body.genre === "") {
        errors.push({ path: "genre-error", message: "Genre is required" });
    }

    if (!request.body.art_style || request.body.art_style === "") {
        errors.push({ path: "art_style-error", message: "Art style is required" });
    }

    // if errors exist → send 400
    if (errors.length > 0) {
        return response.status(400).json({ errors: errors });
    }

    try {
        const insertDeveloperSql = `
            INSERT INTO developer (name, country, province)
            VALUES (?, ?, ?)
        `;

        const developerResult = await query(insertDeveloperSql, [
            request.body.studio,
            request.body.country,
            request.body.province
        ]);

        const insertGameSql = `
            INSERT INTO games (developer_id, game, genre, art_style)
            VALUES (?, ?, ?, ?)
        `;

        await query(insertGameSql, [
            developerResult.insertId,
            request.body.game,
            request.body.genre,
            request.body.art_style
        ]);

        response.json({ message: 'Form submission was successful!' });
    } catch (error) {
        console.log(error);
        response.status(500).json({ message: 'Something went wrong with the server.' });
    }
});

app.put('/developer/:id/', upload.none(), async (request, response) => {
    let errors = [];

    if (!request.body.studio || request.body.studio.trim() === "") {
        errors.push({ path: "studio-error", message: "Studio is required" });
    }

    if (!request.body.country || request.body.country.trim() === "") {
        errors.push({ path: "country-error", message: "Country is required" });
    }

    if (!request.body.province || request.body.province.trim() === "") {
        errors.push({ path: "province-error", message: "Province is required" });
    }

    if (!request.body.game || request.body.game.trim() === "") {
        errors.push({ path: "game-error", message: "Game is required" });
    }

    if (!request.body.genre || request.body.genre === "") {
        errors.push({ path: "genre-error", message: "Genre is required" });
    }

    if (!request.body.art_style || request.body.art_style === "") {
        errors.push({ path: "art_style-error", message: "Art style is required" });
    }

    if (errors.length > 0) {
        return response.status(400).json({ errors: errors });
    }

    try {
        const updateDeveloperSql = `
            UPDATE developer
            SET name = ?, country = ?, province = ?
            WHERE id = (
                SELECT developer_id
                FROM games
                WHERE id = ?
            )
        `;

        await query(updateDeveloperSql, [
            request.body.studio,
            request.body.country,
            request.body.province,
            request.params.id
        ]);

        const updateGameSql = `
            UPDATE games
            SET game = ?, genre = ?, art_style = ?
            WHERE id = ?
        `;

        await query(updateGameSql, [
            request.body.game,
            request.body.genre,
            request.body.art_style,
            request.params.id
        ]);

        response.json({ message: 'Entry updated successfully!' });
    } catch (error) {
        console.log(error);
        response.status(500).json({ message: 'Something went wrong with the server.' });
    }
});



app.listen(port, () => {
    console.log(`Application listening at http://localhost:${port}`);
})