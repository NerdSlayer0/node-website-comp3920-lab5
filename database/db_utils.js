const database = include('databaseConnection');

async function printMySQLVersion() {
	console.log("Successful SQL Connection!");
	// let sqlQuery = `
	// 	SHOW VARIABLES LIKE 'version';
	// `;
	
	// try {
	// 	const results = await database.query(sqlQuery);
	// 	console.log("Successfully connected to MySQL");
	// 	console.log(results[0]);
	// 	return true;
	// }
	// catch(err) {
	// 	console.log("Error getting version from MySQL");
    //     console.log(err);
	// 	return false;
	// }
}

async function getTasks(postData) {
	let sqlQuery = `
		SELECT task_id, description FROM tasks
		JOIN users USING (user_id)
		WHERE users.username = :username;
	`;

	let params = {
        username: postData.username
    }

	try {
		const results = await database.query(sqlQuery, params);
		console.log(results[0]);
		return results[0];
	} catch (err) {
		console.log("Error with query.");
		console.log(err);
		return false;
	}
}

async function addTask(postData) {
	let sqlQuery = `
	INSERT INTO tasks 
	(description, user_id) values (:description, :user_id)
	;
	`

	let params = {
		description: postData.description,
		user_id: postData.user_id
	}

	try {
		await database.query(sqlQuery, params);
		return true;
	} catch (err) {
		console.log("Error with query.");
		console.log(err);
		return false;
	}
}


module.exports = {printMySQLVersion, getTasks, addTask};