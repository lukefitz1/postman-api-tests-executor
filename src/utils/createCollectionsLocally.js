require('dotenv').config();
const Cloud = require('./cloudCollectionClient');
const instCloud = new Cloud();

(async() => {
  try {
    await instCloud.writeCloudCollectionToLocal();
    await instCloud.getEnvironments(true);
  } catch (error) {
    console.error(error);
  }
})();