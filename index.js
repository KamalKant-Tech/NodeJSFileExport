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
	try {
		const result = await database.query(process.env.QUERY)
		await database.close()
		const excelCreateStatus = await excelObj.writeFileToS3Bucket(result)
		return await sendMail(['******.com'],excelCreateStatus.Location).then(() => {
			return { status: 200, message: 'Mail Has been sent to User email address !!!'}
		})
	} catch (e) {
		if(e.code == 'ETIMEDOUT') e.message = "Unable to make database connection"

		if(e.code == 'ER_BAD_FIELD_ERROR') await database.close();

		return { status: (!e.hasOwnProperty('statusCode') ? 501 : e.statusCode), message : e.message }
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
	return excelObj.createSESClient().sendEmail(params).promise()
}

