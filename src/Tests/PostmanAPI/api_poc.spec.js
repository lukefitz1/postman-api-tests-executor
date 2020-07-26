/*
   This is a proof of concept for pulling and running collections from the Postman API.
   It does a simple pricing call to Inner and validates the results against a Joi schema.
   NPM dependencies were not installed in package.json, in the event this isn't used and/or
   different tools are desired for use.

   Required variables/data:
   -- X_API_KEY (from Postman) in postmanClient.js
   -- Content['Authorization'] header - token from Inner
   -- environment and collection ids
 */

const { expect } = require('chai');
const Joi = require('joi');

const postmanClient = require('./postmanClient/postmanClient');

const environmentIdDev = '<<redacted>>';   // get dynamically from Postman
const innerCollectionId = '<<redacted>>';   // get dynamically from Postman


const priceResponseSchema = Joi.object().keys({
  accountId: Joi.string(),
  locationId: Joi.string(),
  productId: Joi.string(),
  uom: Joi.string().allow(null),
  price: Joi.number().precision(2),
  discountBumpPercentage: Joi.number().allow(null),
  netPrice: Joi.number().precision(2),
  type: Joi.string().allow(null),
  description: Joi.string()
});

// currently skipping this test to ensure it's not being run with other tests
describe.skip('Postman API Tests', () => {
  let envVars;
  let innerCollection;

  before(async () => {
    envVars = await postmanClient.getEnvironment(environmentIdDev);
    innerCollection = await postmanClient.getCollection(innerCollectionId);
  });

  describe('Inner API', () => {
    it('should return valid data for /v2/pricing', async () => {
      const pricingEndpoint = await postmanClient.getEndpointFromCollection(innerCollection, { folderName: 'Pricing', itemName: 'v2/pricing' });
      const result = await postmanClient.makeAxiosCall(pricingEndpoint.request, envVars.host);

      const pricingData = result.data.data;
      const joiValidate = Joi.validate(pricingData[0], priceResponseSchema);
      expect(joiValidate.error).to.equal(null);
    });
  });
});
