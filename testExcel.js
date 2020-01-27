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

  writeFileToS3Bucket(data) {
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
    return this.addRowsToExcelSheet(data,this.workbook,this.worksheet).then((result)=> {return result});
  }

  addColumnsToExcel() {
    for (const key in this.headerObj) {
      if (this.headerObj.hasOwnProperty(key)) {
        if(typeof(this.headerObj[key]) !== 'object') {
          headerArray.push({header : this.headerObj[key],key: this.headerObj[key] , width : 10,outlineLevel: 1});
        } 
      }
    }
    return headerArray;
  }

  isDate(date) {
      return (isNaN(date) && new Date(date) !== "Invalid Date" && !isNaN(new Date(date)) ) ? true : false;
  }

  //Format Excel Phone Column
  formatPhone(phoneNumber) {
      // Split into phone number and extension. The system doesn't currently store extensions with the phone number (as of Jan 2018). This is for future usage.
      var phone,extension= '';
      let phone_parts = phoneNumber.split('x');

      if (typeof phone_parts[0] !== undefined) {
        phone = phone_parts[0].length != 0 ? phone_parts[0] : '';
      }
      
      if (typeof phone_parts[0] !== undefined) {
        extension = phone_parts[1] ? phone_parts[1] : '';
      }
      
      // Regular express [^0-9] looks for characters that are not a number.
      var phonetemp =  phone.replace("/[^0-9]/",'');
      if (phonetemp.length == 10 && phonetemp[0] != '0') {
        phone = '(' + phonetemp.substr(0, 3) + ') ' + phonetemp.substr(3, 3) + '-' + phonetemp.substr(6, 4);
      } else if (phonetemp.length == 10 && phonetemp[0] == '0') {
        // Australia
        if (phone.substr(0, 2) == '04') {
          // Mobile 04xx xxx xxx
          phone = phonetemp.substr(0, 4) + ' ' + phonetemp.substr(4, 3) + ' ' + phonetemp.substr(7, 3);
        } else {
          // Landline (0x) xxxx xxxx
          phone = '(' + phonetemp.substr(0, 2) + ') ' + phonetemp.substr(2, 4) + ' ' + phonetemp.substr(6, 4);
        }
      }
      //phone = htmlspecialchars(phone);
      // Add the extension back in
      if (extension.length != 0) {
        phone = ' x' + extension;
      }
    return phone;
  }

  // code to write data into excel sheet
  addRowsToExcelSheet(data,workbook,worksheet){
      worksheet.columns = this.addColumnsToExcel();
      // for loop to read each record from query response
      data.forEach(function(val,index){
        var rowValues = [];
        let customElementConfigurationStatus = this.headerObj.hasOwnProperty('customElementConfiguration');
        Object.keys(this.headerObj).forEach((headerVal) => {
          
          if(!val.hasOwnProperty(headerVal)) {
            let headerSplit = headerVal.split('-');
            val[headerVal] = (headerSplit.length > 1 && val[headerSplit[0]] != null ) ? parser.parse(val[headerSplit[0]])[headerSplit[1]] : ''
          }
          
          if(customElementConfigurationStatus && this.headerObj.customElementConfiguration.hasOwnProperty(headerVal)) {
            let eleType = this.headerObj.customElementConfiguration[headerVal];
            if(this.isDate(val[headerVal]) && eleType != 'phone') {
              val[headerVal] = dateFormat(val[headerVal],eleType) ;
            }else if(eleType == 'phone'){
              val[headerVal] = val[headerVal].length != 0 ? this.formatPhone(val[headerVal]) : '';
            }
          }
          rowValues.push(val[headerVal])
        },this)
      
        worksheet.addRow(rowValues);
      },this)

      //write file function to save all the data to the excel template file into S3 bucket.
      //workbook.xlsx.write(stream)
      return workbook.xlsx.writeFile('sample.xlsx').then(() => {
        /* return this.createS3Client().upload({
            Key: fileName,
            Bucket: process.env.BUCKET_NAME,
            Body: stream,
            ContentType: 'application/vnd.ms-excel'
        }).promise(); */
        return {
          Key: fileName,
          Bucket: process.env.BUCKET_NAME,
          ContentType: 'application/vnd.ms-excel'
        }
      })
      .then((res) => {
        return res;
      })
      .catch((err) => {
        return err;
      });

  }
}