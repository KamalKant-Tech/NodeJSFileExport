var dbConfig = require('./db.json');
var headerJsonObj = require('./header.json');
var db = require('./dbInstance');
var eObj = require('./testExcel');
const env = require('dotenv').config({path: __dirname + '/.env'})
let database = new db(dbConfig);
let statusCode, message;
let totalRows;

exports.handler = async (event, context) => {
	var queryResponse = await database.query(process.env.QUERY)
		.then(rows => {
			totalRows = rows;
			return database.close();
		})
		.then(async () => {
			// do something with someRows and otherRows
			return totalRows;
		}, async err => {
			return database.close().then(() => { throw err; })
		})
		.then((resultRows) => {
			return { statusCode: 200, result: resultRows, message: "Working as expected", };
		})
		.catch(err => {
			return { statusCode: 501, errorMessage: JSON.parse(JSON.stringify(err)).sqlMessage, message: "Query isn't executing." };
		});
	
	let excelObj = new eObj(headerJsonObj);

	if(queryResponse.statusCode == 200 && queryResponse.result.length > 0) {
		statusCode =  queryResponse.statusCode;
		message =  queryResponse.message;
		await excelObj.writeFileToS3Bucket(queryResponse.result).then((res) => {
			console.log(res);	
		})
	}else{
		statusCode =  queryResponse.statusCode;
		message =  queryResponse.message;
	}

	return {
		statusCode:statusCode,
		message:message
	}
}

