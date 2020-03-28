const express = require('express');
const bcryptjs = require('bcryptjs');
const auth = require('basic-auth');

const router = express.Router();
const User = require('../models').models.User;

/* Handler function to wrap each route. */
function asyncHandler(cb)
{
  return async(req, res, next) => {
    try 
    {
      await cb(req, res, next)
    } 
    catch(error) // Catch error thrown
    {
      // send error to global error handler
      next(error);
    }
  }
}

const authenticateUser = async (req, res, next) => 
{
    let message = null;

    // Parse the user's credentials from the Authorization header.
    const credentials = auth(req);

    // If the user's credentials are available...
    if (credentials) 
    {
      // Attempt to retrieve the user from the database by their email.
    
        const user = await User.findOne({ 
        where : {emailAddress: credentials.name},
        attributes: {exclude: ['createdAt', 'updatedAt']}
        });
        
      
      // If a user was successfully retrieved from the database...
      if (user) 
      {
          // Use the bcryptjs npm package to compare the user's password
          // (from the Authorization header) to the user's password
          // that was retrieved from the database.
          const authenticated = bcryptjs.compareSync(credentials.pass, user.password);
    
          // If the passwords match...
          if (authenticated) 
          {

            // Remove password from object to not display to user
            delete user.dataValues.password;
            
            // Then store the retrieved user object on the request object
            // so any middleware functions that follow this middleware function
            // will have access to the user's information.
            req.currentUser = user;
          }
          else 
          {
            // Create message for a failed authentication for the user
            message = `Authentication failure for username: ${user.username}`;
          }
      }
      else 
      {
        // Create message for a user not found
        message = `User not found for username: ${credentials.name}`;
      }
    }
    else 
    {
      // Create message for a missing Auth header
      message = 'Auth header not found';
    }

    // If user authentication failed...
    if (message) 
    {
      console.warn(message);

      // Return a response with a 401 Unauthorized HTTP status code.
      res.status(401).json({ message: 'Access Denied' });
    } else 
    {
      // Or if user authentication succeeded...
      // Call the next() method.
      next();
    }
}

/* GET books route will show the list of books in the library route. */
router.get('/api/users', authenticateUser,  (req, res) => {

  // Code to get and return the current user...
  const user = req.currentUser;
  res.json(user);

});

// Route that creates a new user.
router.post('/api/users', asyncHandler( async (req, res) => {

  // Get the user from the request body.
  const userToCreate = req.body;

  try 
  {
    // Check if user exists if not create user and add the user to the user table.
    const [user, created] = await User.findOrCreate({
      where: { emailAddress: (userToCreate.emailAddress) ? userToCreate.emailAddress : ""},
      defaults: 
      {
        firstName: userToCreate.firstName,
        lastName: userToCreate.lastName,
        emailAddress: userToCreate.emailAddress,
        password: (!userToCreate.password) ? "" : bcryptjs.hashSync(userToCreate.password)
      }
    });

    // Check to see if the user was created
    if (created) 
    {
      // Set the location and status to 201 Created and end the response.
      res.setHeader('Location', `/`);
      res.status(201).end();
    } 
    else 
    {
      // create custom error for an already existent account
      let myError = new Error(`User not created, ${user.emailAddress} is already tied to an account.`);
      myError.status = 400;
      throw myError; 

    }
    
  } 
  catch (error) 
  {
    // Check to see if the error was a validation error
    if(error.name === "SequelizeValidationError") 
    {
      // If it is a validation error set the 400 status code
      error.status = 400;
    }

    // Send error to global error handler
    throw error;
  }
  
}));

// export router

module.exports = router;