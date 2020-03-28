'use strict';

const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const config = require('../config/config.json');

// setup sequelize configuraiton

let sequelize;

if (process.env.NODE_ENV === 'development') 
{
  sequelize = new Sequelize(config.development);
}
else
{
  sequelize = new Sequelize(config.production);
}

const models = {};

// Import all of the models.
fs
  .readdirSync(path.join(__dirname, 'models'))
  .forEach((file) => {
    console.info(`Importing database model from file: ${file}`);
    const model = sequelize.import(path.join(__dirname, 'models', file));
    models[model.name] = model;
  });

// If available, call method to create associations.
Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    console.info(`Configuring the associations for the ${modelName} model...`);
    models[modelName].associate(models);
  }
});

sequelize.authenticate()
  .then(function (error) { console.log('Connection has been established successfully.'); })
  .catch(function (error) { console.log('Unable to connect to the database:', err); });

module.exports = {sequelize, models};
