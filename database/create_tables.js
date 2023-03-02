const database = include('databaseConnection');

async function createTables() {
    let createUserSQL = `
        CREATE TABLE IF NOT EXISTS users (
            user_id INT NOT NULL AUTO_INCREMENT,
            username VARCHAR(25) NOT NULL,
            password VARCHAR(100) NOT NULL,
            email VARCHAR(100) NOT NULL,
            PRIMARY KEY (user_id),
            UNIQUE INDEX username_unique (username ASC)
    );`;

    try {
        const results = await database.query(createUserSQL);
        console.log("Successfully created tables");
        console.log(results[0]);
        return true;
    } catch(err) {
        console.log("error creating tables");
        console.log(err);
        return false;
    }
}

module.exports = {createTables};

