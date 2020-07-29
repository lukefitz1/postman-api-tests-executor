const fs = require("fs");
const newman = require("newman");
const envConfig = require("../utils/envConfig");
const jsonToFile = require("../utils/jsonToFile");
const axios = require("axios");
const util = require('util');

module.exports = async options => {
  var tests = []
  var test = {}
  var timestamp = ""

  const api = options.name;
  const {
    env
  } = await envConfig();
  const enableReporting = process.env.SCHEMA_VALIDATION_FLAG === "true";

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
      // if (enableReporting) await schemaReporting.schemaReporting(data);
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
      const testResultsApiClient = axios.create({
        baseURL:`${process.env.TEST_RESULTS_API_BASE_URL}/api/collections/create_collection`,
        headers: {
          "x-api-key": `${process.env.TEST_RESULTS_API_KEY}`
        }
      });

      collection = {
        "collection": {
          "description": `${process.env.COLLECTION}`,
          "date": `${timestamp}`,
          "requests": tests
        }
      }

      if (process.env.ENV_STAGE === 'staging') {
        testResultsApiClient.post("/", collection)
          .then(function (response) {
            console.log(response.status);
            if (process.env.ERROR == "1") {
              process.exit(1);
              // process.env.CODEBUILD_BUILD_SUCCEEDING = 0
            }
          })
          .catch(function (error) {
            console.log(error);
          });
      }
    }
  return results;
};