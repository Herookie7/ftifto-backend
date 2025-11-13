const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  failOnErrors: false,
  apis: [path.join(__dirname, './spec.yaml'), path.join(__dirname, '../routes/**/*.js')]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

