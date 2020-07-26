// Retrieving environment variable to build the proper environment config json file
const PostmanCloud = require('./cloudCollectionClient');

module.exports = async () =>  {
  const postmanCloud = new PostmanCloud();
  const env = process.env.NODE_ENV || process.env.ENV;
  const local = process.env.LOCAL;
  if (!env) {
    console.error('...Environment needs to be set to the ENV or NODE_ENV environment variable!...');
    console.log(process.pid);
    process.exit(0);
  }
  
  let localEnvPath;
  let cloudEnvPath;

  if (local) {
    switch (env.toLowerCase()) {
      case 'dev':
        if (local) {
          const devConfig = require('../Environments/dev_config');
          await devConfig();
        }
        localEnvPath = `${__dirname}/../Environments/SPIRE_API_STAGING.postman_environment.json`;
        cloudEnvPath;
        break;
      case 'sit':
        if (local) {
          const sitConfig = require('../Environments/sit_config');
          await sitConfig();
        }
        localEnvPath = `${__dirname}/../Environments/SPIRE_API_STAGING.postman_environment.json`;
        break;
      case 'pre':
        if (local) {
          const preConfig = require('../Environments/pre_config');
          await preConfig();
        }
        localEnvPath = `${__dirname}/../Environments/PRE_ENV.json`;
        break;
      default:
        console.log(`${env} is not a valid environment`);
    };

    return {
      env, 
      localEnvPath
    }
  }

  const { environments } = await postmanCloud.getEnvironments();
  console.log("FUCK")
  console.log(environments)
  console.log(env)
  const envUid = environments.find(item =>  item.name.toLowerCase() === env.toLowerCase()).uid;
  console.log(envUid)
  cloudEnvPath = postmanCloud.addApiKeyToUrl(envUid, postmanCloud.envUrl); //${url}/${uid}?apikey=${apiKey}

  return {
    env,
    cloudEnvPath,
  };
};

