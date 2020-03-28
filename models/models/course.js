'use strict';
const Sequelize = require('sequelize');

// create book class for sequelize

module.exports = (sequelize) => 
{
    class Course extends Sequelize.Model {}
    /*
    Course has the following information
        id (Integer, primary key, auto-generated)
        userId (id from the Users table)
        title (String)
        description (Text)
        estimatedTime (String, nullable)
        materialsNeeded (String, nullable)
    */
   
    Course.init({
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          notEmpty: {msg: 'Please enter a user ID.' },
          notNull: { msg: 'Please enter a user ID.' }
        }
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          notEmpty: {msg: 'Please enter a title.' },
          notNull: { msg: 'Please enter a title.' }
        }
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
        validate: { 
          notEmpty: {msg: 'Please enter a description.' },
          notNull: { msg: 'Please enter a description.' }
        }
      },
      estimatedTime:
      {
        type: Sequelize.STRING,
        allowNull: true
      },
      materialsNeeded:
      {
        type: Sequelize.STRING,
        allowNull: true
      }
    }, { sequelize });
  
    Course.sync();

    Course.associate = (models) => {
      // TODO Add associations.
      Course.belongsTo(models.User, {as: 'User' , foreignKey:{ fieldName: 'userId', allowNull: false }});
    };

    return Course;
};