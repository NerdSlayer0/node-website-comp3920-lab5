const database = include('databaseConnection');

async function createUser(postData) {
    let createUserSQL = `
    INSERT INTO users
    (username, email, password, user_type)
    VALUES
    (:user, :email, :passwordHash, 2);
    `;

    let params = {
        user: postData.user,
        email: postData.email,
        passwordHash: postData.passwordHash
    }
    console.log("Params: " + params.user + "\n" + params.email + "\n" + params.passwordHash);
    console.log("createUserSQL: " + createUserSQL);
    // var success = await db_users.createUser({ user: nameInput, email: emailInput, passwordHash: hashedPassword})

    try {
        const results = await database.query(createUserSQL, params);
        console.log("results: " + results);
        console.log("Successfully created user");
        console.log(results[0]);
        return true;
    } catch (err) {
        console.log("Error inserting user");
        console.log(err);
        return false;
    }
};

async function getUserById(postData) {
    let getUserSQL = `
    SELECT username
    FROM users
    WHERE user_id = :user_id;`

    let params = {
        user_id: postData
    }

    try {
        var results = await database.query(getUserSQL, params);
        console.log("Query results: " + results[0]);
        return results[0];
    } catch (err) {
        console.log(err);
        return false;
    }
}

async function getUser(postData) {
    let getUserSQL = `
    SELECT username, user_id, email, password, type
    FROM users
    JOIN user_type ON users.user_type = user_type.user_type_id
    WHERE email = :email;
    `
    let params = {
        email: postData.email
    }

    console.log("params email: " + params.email);
    try {
        const results = await database.query(getUserSQL, params);
        console.log("Successfully found user");
        console.log(results[0]);
        return results[0];
    } catch (err) {
        console.log("Error trying to find user");
        console.log(err);
        return false;
    }
}

module.exports = {createUser, getUserById, getUser};