const database = include('databaseConnection');

async function getUserTasks(postData) {
    var sqlQuery = `
        SELECT username, user_id, description, task_id
        FROM users
        JOIN tasks
        USING (user_id)
        WHERE user_id = :user_id;
    `
    var params = {
        user_id: postData.userId
    }

    try {
        const results = await database.query(sqlQuery, params);
        return results[0];
    } catch (err) {
        console.log("Error with userTasks query");
        console.log(err);
        return false;
    }
};

async function getUsers(postData) {
    let getUsersSQL = `
    SELECT username, user_id, email, type
    FROM users
    JOIN user_type ON users.user_type = user_type.user_type_id;
    `;

    try {
        const results = await database.query(getUsersSQL);
        console.log("Successfully retrieved users");
        console.log(results[0]);
        return results[0];
    }
    catch (err) {
        console.log("Error getting users");
        console.log(err);
        return false;
    }
}

module.exports = {getUsers, getUserTasks};
