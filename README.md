# NodeJSFileExport
Export File Using Node JS &amp; Pushing to S3 Bucket

## Installation

Use the npm package manager to install.

```bash
npm install
```
Create .env file and add following details into it.

```bash 
AWS_ACCESS_KEY='**********'
AWS_SECRET_ACCESS_KEY='**********'
BUCKET_NAME='**********'
QUERY='**********'
```
You Should have one more file called db.json which contains your DB connection

```bash
{
    "host" : "*****",
    "user" :"*****",
    "password" :"*****",
    "database" : "*****"
}
```
## Usage

```bash
Checkout or Move to Project Directory & Run 

npm run locally
```

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.