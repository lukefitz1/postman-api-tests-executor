const fs = require("fs");
const newman = require("newman");
// const EndpointSchemaValidator = require("nutrien-schema-validator");
const envConfig = require("../utils/envConfig");
const jsonToFile = require("../utils/jsonToFile");
const axios = require("axios");
const util = require('util')

const RESOLVED_SOURCE_VERSION =
  process.env.CODEBUILD_RESOLVED_SOURCE_VERSION || "Unknown";
const CODEBUILD_INITIATOR = process.env.CODEBUILD_INITIATOR || "Unknown";
// const matchArray = CODEBUILD_INITIATOR.match(/GitHub-Hookshot/g)
// console.log(" ------------ DEBUGGING /CODEBUILD VALUES ----------------")
// console.log(`RESOLVED_SOURCE_VERSION: ${RESOLVED_SOURCE_VERSION}`)
// console.log(`CODEBUILD_INITIATOR: ${CODEBUILD_INITIATOR}`)
// console.log(" ------------ END DEBUGGING NEW RELIC VALUES ----------------");

const testResultsApiClient = axios.create({
  baseURL: 'http://localhost:3001/api/requests/create_requests',
  headers: {
    "x-api-key": "lWFT5mlfKVJt0pWulR42SyByQSneKAbE1p1aOxjuLtgHT"
  }
});

// Generic function that sets up listeners and runs the specified collection via the options object
module.exports = async options => {
  var tests = []
  var test = {}
  var timestamp = ""

  const api = options.name;
  const {
    env
  } = await envConfig();
  const lambdaPath = process.env.ENDPOINT_SCHEMA_LAMBDA;
  const enableReporting = process.env.SCHEMA_VALIDATION_FLAG === "true";
  // const {
  //   schemaReporting
  // } = new EndpointSchemaValidator(
  //   api,
  //   env,
  //   lambdaPath,
  //   enableReporting
  // );

  let results;
  let assertion;
  let response;

  await newman
    .run(options, err => {
      if (err) console.error(err);
    })
    .on("start", (err, args) => {
      console.log("Running collections");
      timestamp = Math.floor(Date.now() / 1000)
    })
    .on("request", async (err, data) => {
      test = { 
        "timestamp": timestamp,
        "id": data.item.id, 
        "request": data.item.name,
        "assertions": []
      }

      if (err) {
        console.log("ERROR", err);
      }
      if (data.response) response = data.response;
    })
    .on("assertion", async (err, data) => {
      var result = ""
      if (data.error == null) {
        result = "passed"
      } else {
        process.env.ERROR = "1"
        process.env.TEST_FAILURES = "1"
        process.env.CODEBUILD_BUILD_SUCCEEDING = 0
        result = "failed"
      }

      test["assertions"].push({
        "name": data.assertion,
        "result": result
      })

      if (err) {
        console.log("ASSERTION ERROR", err);
      }
      assertion = data;
    })
    .on("item", async (err, data) => {
      tests.push(test)

      if (err) {
        console.log("ERROR", err);
      }

      data.response = response;
      data.assertion = assertion;
      if (enableReporting) await schemaReporting.schemaReporting(data);
    })
    .on("done", async (err, summary) => {
      sendTestData(tests)

      if (err || summary.error) {
        console.error(`Collection ran and encountered error: ${err}`);
      } else {
        results = summary;
        jsonToFile(results, "Postman_Summary");
      }
    });

    function sendTestData(tests) {
      console.log(`FUCK ERROR: ${process.env.ERROR}`)
      console.log(`TEST_FAILURES: ${process.env.TEST_FAILURES}`)
      console.log(`CODEBUILD_BUILD_SUCCEEDING: ${process.env.CODEBUILD_BUILD_SUCCEEDING}`)
      console.log(`Time_stamp: ${timestamp}`)
      // testResultsApiClient.post("/", tests)
      // .then(function (response) {
      //   console.log(response.status);
      // })
      // .catch(function (error) {
      //   console.log(error);
      // });
    }
  return results;
};