
module.exports = {
  timeout: 1800000,
  timeoutRequest: 10000,
  baseOptions: {
    reporters: ['cli', 'htmlextra', 'json'],
    reporter: {
      htmlextra: {
        export: `${__dirname}/../results/htmlResults.html`,
        darkTheme: true,
      },
      json: {
        export: `${__dirname}/../results/jsonResults.html`
      }
    },
    color: 'on',
    timeout: 1800000, 
    timeoutRequest: 10000, 
  },
};