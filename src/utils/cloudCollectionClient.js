const axios = require("axios");
const fs = require("fs");
const collectionRunStatus = require("../collection.config");

module.exports = class CloudCollection {
  constructor() {
    this.collectionUrl = "https://api.getpostman.com/collections";
    this.envUrl = "https://api.getpostman.com/environments";
    this.apiKey = process.env.POSTMAN_API_KEY;
  }

  buildAxiosOptions(method, url, id, addApiKeyToUrl = false) {
    const fullUrl = id ? `${url}/${id}` : url;
    const options = {
      method,
      url: fullUrl,
      json: true,
      headers: { "X-Api-Key": this.apiKey }
    };

    if (addApiKeyToUrl) {
      options.url = `${fullUrl}?apikey=${this.apiKey}`;
    }

    return options;
  }

  addApiKeyToUrl(uid, url) {
    if (uid && !url) return `${this.baseUrl}/${uid}?apikey=${this.apiKey}`;
    if (url && !uid) return `${url}?apikey=${apiKey}`;
    if (url && uid) return `${url}/${uid}?apikey=${this.apiKey}`;
    return `${this.baseUrl}?apikey=${this.apiKey}`;
  }

  async getCloudCollectionJSON() {
    try {
      const options = this.buildAxiosOptions("GET", this.collectionUrl);
      const response = await axios(options);
      const collectionNames = response.data.collections.map(
        index => index.name
      );
      const collectionConfig = Object.keys(collectionRunStatus);
      const missingCollections = collectionNames.filter(
        (value, index) => value !== collectionConfig[index]
      );
      console.info("...Current Cloud Collections: \n", collectionNames);
      console.warn(
        "...MAY REQUIRE UPDATING\n Following Collections are not present in the collection config: \n",
        missingCollections
      );
      return response.data.collections;
    } catch (err) {
      console.error(err);
    }
  }

  async getEnvironments(writeToFile) {
    try {
      const options = this.buildAxiosOptions("GET", this.envUrl);
      const response = await axios(options);

      if (writeToFile) {
        for (const env of response.data.environments) {
          const id = env.uid;
          const envJson = await this.getEnvironmentJSON(id);
          const name = env.name;
          const path = "../cloudCollections/environments";
          this.writeJsonToFile(path, name, envJson);
        }
      }

      return response.data;
    } catch (err) {
      console.error(err);
    }
  }

  async getEnvironmentJSON(envId) {
    try {
      const options = this.buildAxiosOptions("GET", this.envUrl, envId);
      const response = await axios(options);
      return response.data;
    } catch (err) {
      console.error(err);
    }
  }

  writeJsonToFile(path, name, json) {
    const directory = `${__dirname}/${path}`;
    const filePath = `${directory}/${name}.json`;
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory);
    }

    if (typeof json === "object") json = JSON.stringify(json);

    fs.writeFileSync(filePath, json, { flag: "a+" });
  }

  async writeCloudCollectionJsonToFile(url, uid, name) {
    try {
      const options = this.buildAxiosOptions("GET", url, uid);
      const response = await axios(options);
      const directory = `${__dirname}/../cloudCollections`;
      const filePath = `${directory}/${name}.json`;
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory);
      }

      fs.writeFileSync(filePath, response.data, { flag: "a+" });
      return response.data;
    } catch (err) {
      console.error(err);
    }
  }

  async writeCloudCollectionToLocal() {
    const collections = await this.getCloudCollectionJSON();

    collections.forEach(item => {
      const { uid, name } = item;
      this.writeCloudCollectionJsonToFile(this.collectionUrl, uid, name);
    });
  }

  buildNewmanOptions(collectionId, envPath, name) {
    return Object.assign(
      {
        collection: `${this.collectionUrl}/${collectionId}?apikey=${this.apiKey}`,
        reporter: {
          htmlextra: {
            export: `${__dirname}/../results/${name}-${new Date()}.html`,
            darkTheme: true,
            title: `POSTMAN - ${name}`
          }
        },
        environment: envPath
      },
      {
        reporters: ["cli", "htmlextra"],
        reporter: {
          htmlextra: {
            export: `${__dirname}/../results/${name}-${new Date()}.html`,
            darkTheme: true
          }
        },
        color: "on",
        timeout: 1800000,
        timeoutRequest: 10000
      }
    );
  }

  async mapOptionsToObject(cloudEnvUrl) {
    if (!cloudEnvUrl) {
      console.error(
        "...Path to the cloud environment url required. Exiting process!..."
      );
      process.exit(0);
    }

    let newmanOptions;
    const collections = await this.getCloudCollectionJSON();
    const targetCollection = process.env.COLLECTION;

    if (targetCollection) {
      const collectionToRun = collections.find(
        option => option.name === targetCollection
      );

      if (!collectionToRun) {
        console.log(
          `...Collection: ${targetCollection} is not a valid collection name...`
        );
        process.exit(0);
      }

      const { uid, name } = collectionToRun;
      const option = this.buildNewmanOptions(uid, cloudEnvUrl, name);
      option.name = name;
      newmanOptions = [option];
    } else {
      const filteredCollections = collections.filter(
        option => collectionRunStatus[option.name] === true
      );

      if (filteredCollections.length === 0) {
        console.log(
          "...All collections are disabled or there are no collections found to run..."
        );
        process.exit(0);
      }

      newmanOptions = filteredCollections.map(collection => {
        const { uid, name } = collection;
        const option = this.buildNewmanOptions(uid, cloudEnvUrl, name);
        option.name = name;
        return option;
      });
    }

    return newmanOptions;
  }
};
