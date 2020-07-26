// Api reference: https://www.npmjs.com/package/newman#api-reference
const run = require('./utils/newmanRun');
const envConfig = require('./utils/envConfig')
const PostmanCloud = require('./utils/cloudCollectionClient');
const localOptions = require('./utils/localCollectionOptions')
require('dotenv').config();
require('./utils/commandConfig').processArgs();

const local = process.env.LOCAL;

if (local) {
  (async () => {
    const { localEnvPath } = await envConfig();
    const collectionOptions = localOptions(localEnvPath);
    
    const promiseArray = [];
    for (const [key, value] of Object.entries(collectionOptions)) {
      promiseArray.push(run(value));
    }
    Promise.all(promiseArray);
  })();
} else {
  (async () => {
    const { env, cloudEnvPath } = await envConfig();
    const postmanCloud = new PostmanCloud(env);
    const collectionOptions = await postmanCloud.mapOptionsToObject(cloudEnvPath);
  
    const promiseArray = [];
    collectionOptions.forEach(option => promiseArray.push(run(option)));
    Promise.all(promiseArray);
  })();
}





