let Excel = require('exceljs')
const AWS = require('aws-sdk');
let Stream = require('stream');
const env = require('dotenv').config({path: __dirname + '/.env'})
const stream = new Stream.PassThrough();
const parser = require('fast-xml-parser')
var dateFormat = require('dateformat');
var headerArray = [];
const fileName = 'example.xlsx';

module.exports = class ExcelExport {

  constructor( headerObj ) {
    this.headerObj = headerObj;
  }

  //Create S3 Client Obj
  createS3Client() {
    return new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    });
  }

  writeFileToS3Bucket(snapData) {
    // create a workbook variable
    this.workbook = new Excel.Workbook();
    
    // read excel file from the path
    /* workbook.xlsx.readFile(excel_file_path)
      .then(function() {
      // access the excel sheet 
          var worksheet = workbook.getWorksheet('Sheet 1');
        // console.log(worksheet);
          addRowsToExcelSheet(snapData,workbook,worksheet);
    }); */

    this.worksheet = this.workbook.addWorksheet('My Sheet');
    this.worksheet = this.workbook.getWorksheet('My Sheet');
    return this.addRowsToExcelSheet(snapData,this.workbook,this.worksheet).then((result)=> {return result});
  }

  addColumnsToExcel() {
    for (const key in this.headerObj) {
      if (this.headerObj.hasOwnProperty(key)) {
        headerArray.push({header : this.headerObj[key],key: this.headerObj[key] , width : 10,outlineLevel: 1});
      }
    }
    return headerArray;
  }

  isDate(date) {
      return (isNaN(date) && new Date(date) !== "Invalid Date" && !isNaN(new Date(date)) ) ? true : false;
  }

  // code to write data into excel sheet
  addRowsToExcelSheet(snapData,workbook,worksheet){
      let parentThis = this;
      worksheet.columns = this.addColumnsToExcel();
      
      // for loop to read each record from query response
      snapData.forEach(function(val,index){
        var rowValues = [];
        Object.keys(parentThis.headerObj).forEach((headerVal) => {
          if(!val.hasOwnProperty(headerVal)) {
            let headerSplit = headerVal.split('-');
            val[headerVal] = (headerSplit.length > 1 && val[headerSplit[0]] != null ) ? parser.parse(val[headerSplit[0]])[headerSplit[1]] : ''
          }

          if(parentThis.isDate(val[headerVal])) {
            val[headerVal] = dateFormat(val[headerVal], "m/d/yyyy") ; 
          }

          rowValues.push(val[headerVal])
        })
      
        worksheet.addRow(rowValues);
      })

      //write file function to save all the data to the excel template file into S3 bucket.
      //workbook.xlsx.write(stream)
      return workbook.xlsx.write(stream).then(() => {
        return this.createS3Client().upload({
            Key: fileName,
            Bucket: process.env.BUCKET_NAME,
            Body: stream,
            ContentType: 'application/vnd.ms-excel'
        }).promise();
      })
      .then((res) => {
        return res;
      })
      .catch((err) => {
        return err;
      });

  }
}