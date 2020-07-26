const { baseOptions } = require('../utils/constants');

// Map out all local collections option objects here 
// TODO: write options object by pulling latest from cloud
let collections = (localEnvPath) => {
  return {
    EXH_API: Object.assign({
      name: 'SPIRE API',
      collection: `${process.cwd()}/src/Tests/SPIRE_API.postman_collection.json`,
      environment: localEnvPath,
    }, baseOptions),
  }
}

module.exports = collections;