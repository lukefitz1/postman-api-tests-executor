const { argv } = require('yargs');

class CommandLineArgs {
  get argKeys() {
    return Object.keys(argv).slice(2);
  }

  processArgs() {
    this.argKeys.forEach((key) => {
      const arg = argv[key];
      console.log(`Key: ${key}, Value: ${arg}`)
      switch (key.toLowerCase()) {
        case 'environment':
        case 'env':
          process.env.ENV = arg;
          process.env.NODE_ENV = arg;
          break;

        case 'local':
          process.env.LOCAL = true;
          break;
        case 'collection':
          process.env.COLLECTION = arg.toUpperCase();
        default:
          break;
      }
    });

    if (!process.env.ENV || !process.env.NODE_ENV) {
      console.log('*** No environment was specified, defaulting to dev ***');
      process.env.ENV = 'DEV';
      process.env.NODE_ENV = 'DEV';
    }
  }
}

module.exports = new CommandLineArgs();
