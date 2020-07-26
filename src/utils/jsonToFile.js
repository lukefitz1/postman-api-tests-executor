const path = require('path');
const fs = require('fs');

module.exports = (json, fileName) => {
  const filePath = path.join(process.cwd(), `${fileName}.json`);
  const dir = path.dirname(filePath);

  if (!fs.existsSync(dir)) fs.mkdirSync(dir); 
   
  const stringJson = `${JSON.stringify(json, null, 4)},\n`
  
  try {
    fs.appendFileSync(
      filePath,
      stringJson,
      'utf8',
      { flags: 'a+' },
    );
  } catch (err) {
    console.error('Error', err.stack);
  }
}