'use strict';
const Sequelize = require('sequelize');

// create book class for sequelize

module.exports = (sequelize) => 
{
    class User extends Sequelize.Model {}
    
    /*
    User has the following informaiton
        id (Integer, primary key, auto-generated)
        firstName (String)
        lastName (String)
        emailAddress (String)
        password (String)
    */
   
    User.init({
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          notEmpty: {msg: 'Please enter a first name.' },
          notNull: { msg: 'Please enter a first name.' }
        }
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          notEmpty: {msg: 'Please enter a last name.' },
          notNull: { msg: 'Please enter a last name.' }
        }
      },
      emailAddress: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: { 
          notEmpty: {msg: 'Please enter an email.' },
          notNull: { msg: 'Please enter an email.' },
          isEmail: { msg: 'Please enter a valid email format.' }
        }
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          notEmpty: {msg: 'Please enter a password.' },
          notNull: { msg: 'Please enter a password.' }
         },
         select: false,
      }
    }, { sequelize });

    User.sync();
  
    User.associate = (models) => {
        // TODO Add associations.
        User.hasMany(models.Course, {as: 'User' , foreignKey:{ fieldName: 'userId', allowNull: false }});
      };

    return User;
};