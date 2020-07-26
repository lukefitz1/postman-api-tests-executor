const newmanRun = require('./newmanRun');

// Environments folder and objects need to be built out and properly referenced with each collection
// Just an example of how to run a directory of collections
module.exports = async function newmanDirectoryRun() {
  const files = fs.readdirSync(`${__dirname}/Collections`);
  const environments = fs.readdirSync(`${__dirname}/Environments`);

  const resultsArray = [];
  files.forEach(async (file, index) => {
    const options = {
      collection: `${__dirname}/Collections/${file}`,
      reporters: 'cli',
      environment: environments[index],
      timeout: 10000,
      color: 'on',
    };

    const results = await newmanRun(options);
    resultsArray.push(results);
  });

  return resultsArray;
}