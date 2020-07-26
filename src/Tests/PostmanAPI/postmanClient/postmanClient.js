const qs = require('qs');
const axios = require('axios');

/* SETUP/CONFIG */
const X_API_KEY = '<<redacted>>';  // get this from Postman (generate API key)
const BASE_URL = 'https://api.getpostman.com';

const options = {
  headers: {
    'X-Api-Key': X_API_KEY
  }
};

/* POSTMAN UTILITIES */
const getEnvironment = async envId => {
  const url = `${BASE_URL}/environments/${envId}`;
  const response = await axios.get(url, options);

  const envValues = response.data.environment.values;
  const innerApiHost = envValues.find(envVar => envVar.key === 'inner-api-host');
  const innerApiToken = envValues.find(envVar => envVar.key === 'inner-api-token');
  return { host: innerApiHost.value, innerApiToken: innerApiToken.value }
};

const getCollection = async collectionId => {
  const url = `${BASE_URL}/collections/${collectionId}`;
  return axios.get(url, options);
};

const getEndpointFromCollection = (collection, opts = {}) => {
  let folder;

  if (opts.folderName && opts.itemName) {
    folder = collection.data.collection.item.find(item => item.name === opts.folderName);
    return folder.item.find(item => item.name === opts.itemName);
  } else if (opts.itemName) {
    return collection.data.collection.item.find(item => item.name === opts.itemName);
  }
};

/* AXIOS UTILITIES */
const mapHeaders = postmanHeaders => {
  const headers = {};
  postmanHeaders.forEach(header => {
    headers[`${header.key}`] = `${header.value}`
  });
  headers['Authorization'] = '<<redacted>>';  // get this authorization key from Inner Postman call
  return headers;
};

const mapBody = postmanBody => {
  const body = {};
  postmanBody.urlencoded.forEach(item => {
    body[`${item.key}`] = `${item.value}`
  });
  return qs.stringify(body);
};

const makeAxiosCall = (request, envHost) => {
  return axios({
    method: request.method,
    url: request.url.raw.replace('{{host}}', envHost),
    headers: mapHeaders(request.header),
    data: mapBody(request.body)
  });
};

module.exports = {
  getCollection,
  getEnvironment,
  getEndpointFromCollection,
  makeAxiosCall
};
