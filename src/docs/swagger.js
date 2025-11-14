const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Tifto API',
      version: '1.0.0'
    },
    servers: [
      {
        url: '/api/v1'
      }
    ]
  },
  apis: ['./src/routes/**/*.js', './src/models/**/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

