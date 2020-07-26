# POSTMAN Collection run via newman and node.js
Wrapper around postman collections to enable them to run in an AWS build project via node and the newman package.



## Setup
 - Run following command: ```npm install```
 - Resolve following environment variables in .env for local run. 
 - If run is in AWS make sure variables are mapped out correctly inside the parameter store of the postman_buildspec.yml

## Test Data : Use to map out data tests are dependent on
 - Refer to tests-postman/Environments/testData.js
 - If you have parameters inside your postman collection {{ param }} resolve them within this file
 - This object becomes merged with each environment object that is built out

 ## Environments: 
 - Each environment has it's own file to generate the associated json file for running a postman collection.
 - To generate the file simply require the dev/sit/pre _config.js file and it will create it.
 - Map out all api keys stored in the .env or parameter store within each of these config files.
 - Referencing the env variables is done by ```const example = process.env.EXAMPLE_PARAM;``` 

## Running via command line:
  - Run the index.js file via node: ```node src/index.js``` 
    - All parameters should be mapped out via the .env or inside the buildspec
    - Run the collections locally via ```node src/index.js --local```
    - Set the desired environment via ```node src/index.js --env=desiredEnv```
    - Run specified collection via ```node src/index.js --env=desiredEnv --collection="CXH-API"```

### To run all collections or just one:
Simply do not specify a collection in the command line and all set to true in the collection.config.js will run.
  - ```node src/index.js --env=desiredEnv```
If you want to target and run only one collection add --collection="Desired Collection Name". 
  - ```node src/index.js --env=desiredEnv --collection="Collection Name"```

## Create the cloud collections and environment files locally:
  - Run the following command and a cloudCollections folder will be generated: ```npm run cloudToLocal```



