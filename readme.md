
## Getting Started


### Prerequisites

things you need to install the software and how to install them:

`npm install -g aws-cli npm install -g typescript`

### Installing

1. Clone the repo:
   `git clone https://github.com/yourusername/projectname.git`

2. Install NPM packages:
   `cd projectname npm install`

3. Compile TypeScript to JavaScript (if applicable):
   `tsc`


### Configuration

1. Set AWS credentials:
   `export AWS_ACCESS_KEY_ID="your_access_key_id" export AWS_SECRET_ACCESS_KEY="your_secret_access_key"`


## Usage

Deploy to cloud:

`sh deploy_lambda.sh`

POST Request:

```bash
curl -X POST "https://98qrw8pgt2.execute-api.ap-southeast-2.amazonaws.com/get-name" \
-H "Content-Type: application/json" \
-H "Authorization: Bearer <Your_Auth_Token>" \
-d '{
"input_query": "小史"
}'
```

Response:
```json
{
"name": "David Smith 大卫 斯密斯",
   "reasons": [
   "The Chinese characters '小史' translate to 'little historian' or 'small history', where '史' can be associated with the surname 'Smith' in 'David Smith 大卫 斯密斯'.",
   "The nickname '小史' could imply a diminutive or affectionate form of the surname 'Smith'."
   ]
}

```
