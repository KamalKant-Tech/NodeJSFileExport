var dbConfig = require('./db.json');
var headerJsonObj = require('./header.json');
var db = require('./dbInstance');
var eObj = require('./testExcel');
const env = require('dotenv').config({path: __dirname + '/.env'})
let database = new db(dbConfig);
let statusCode, message;
let totalRows;
let excelObj = new eObj(headerJsonObj);

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
	
	if(queryResponse.statusCode == 200 && queryResponse.result.length > 0) {
		statusCode =  queryResponse.statusCode;
		message =  queryResponse.message;
		await excelObj.writeFileToS3Bucket(queryResponse.result).then(async (res) => {
			if(res.status ==  200) {
				await sendMail(['yourmailaddress'],res.Location)
			}else {
				return { status: statusCode, message }  = res;
			}
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



async function sendMail(toAddress = [], uploadedFileLink = '') {
	/* The following example sends a formatted email: */
	var params = {
		Destination: {
			BccAddresses: [], 
		 	CcAddresses: [], 
			ToAddresses:toAddress
		}, 
		Message: {
		 	Body: {
				Html: {
					Charset: "UTF-8", 
					Data: "This message body contains HTML formatting. It can, for example, contain links like this one: <a class=\"ulink\" href='"+ uploadedFileLink +"' target=\"_blank\">Click to download File</a>."
				}, 
				Text: {
					Charset: "UTF-8", 
					Data: "This is the message body in text format."
				}
		 	}, 
			Subject: {
		  		Charset: "UTF-8", 
		  		Data: "Link to Downlaod"
			}
		}, 
		ReplyToAddresses: [], 
		//ReturnPath: "", 
		//ReturnPathArn: "", 
		Source: "*****@gmail.com", 
		//SourceArn: ""
	};
	/* excelObj.createSESClient().verifyEmailAddress({EmailAddress:'****@domain.com'}, function(err, data) {
		if (err) console.log(err, err.stack); // an error occurred
		else     console.log(data);           // successful response
	}); */
	await excelObj.createSESClient().sendEmail(params).promise().then((res) => {
		console.log(res)
	}).catch((err) => {
		console.log("Error:" , err.message)
	});
}

