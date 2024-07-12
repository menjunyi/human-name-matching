#!/bin/bash

# Clean up
rm -rf dist

# Constants
FUNCTION_NAME="human-name-matching"
ZIP_FILE="function.zip"
ROOT_DIR="./" # Directory containing your lambda function code and package.json
DIST_DIR="./dist" # Directory where the zip file will be placed


# Install dependencies and build the project if it's a Node.js project
if [ -f "$ROOT_DIR/package.json" ]; then
    echo "Building the project..."
    npm install --prefix $ROOT_DIR
    npm run build --prefix $ROOT_DIR
fi

# Create the dist directory if it doesn't exist
mkdir -p $DIST_DIR

# Copy necessary files to the dist directory
echo "Copying files to dist directory..."
cp -r $ROOT_DIR/src $DIST_DIR/
cp $ROOT_DIR/package.json $DIST_DIR/
cp $ROOT_DIR/tsconfig.json $DIST_DIR/

# Navigate to the dist directory
cd $DIST_DIR

# Install production dependencies
npm install --only=production

# Compile TypeScript to JavaScript
npx tsc

# Create the zip file
echo "Creating zip file..."
zip -r $ZIP_FILE . -x "*.idea*" "*git*"

# Check if the zip file was created
if [ ! -f "$ZIP_FILE" ]; then
    echo "Failed to create zip file."
    exit 1
fi

# Deploy the zip file to AWS Lambda
echo "Deploying to AWS Lambda..."
aws lambda update-function-code --function-name $FUNCTION_NAME --zip-file fileb://$ZIP_FILE

# Check if the deployment was successful
if [ $? -eq 0 ]; then
    echo "Deployment successful."
else
    echo "Deployment failed."
    exit 1
fi

