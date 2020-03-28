const express = require('express');
const bcryptjs = require('bcryptjs');
const auth = require('basic-auth');
const { check, validationResult } = require('express-validator');

const router = express.Router();
const Course = require('../models').models.Course;
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
      // Attempt to retrieve the user from the data store
      // by their username (i.e. the user's "key" from the Authorization header).
      const user = await User.findOne({ where : {emailAddress: credentials.name} } );

      // If a user was successfully retrieved from the data store...
      if (user) 
      {
          // Use the bcryptjs npm package to compare the user's password
          // (from the Authorization header) to the user's password
          // that was retrieved from the data store.
          const authenticated = bcryptjs.compareSync(credentials.pass, user.password);
    
          // If the passwords match...
          if (authenticated) 
          {
              // Then store the retrieved user object on the request object
              // so any middleware functions that follow this middleware function
              // will have access to the user's information.
              req.currentUser = user;
            }
            else 
            {
              message = `Authentication failure for username: ${user.username}`;
            }
        }
        else 
        {
          message = `User not found for username: ${credentials.name}`;
        }
    }
    else 
    {
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

/* GET courses route will show the list of courses in the database. */
router.get('/api/courses', async (req, res) => {

  try 
  {
    // Code to get and return the courses...
    const courses = await Course.findAll({
      include: [ { model: User, as: 'User', attributes: {exclude: ['password', 'createdAt', 'updatedAt']}}],
      attributes: {exclude: ['createdAt', 'updatedAt']}
    });

    // Respond to user with JSON object with coursess
    res.json(courses);
    
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
  
});

/* GET courses/:id route will show the specific course in the database. */
router.get('/api/courses/:id', asyncHandler( async (req, res) => {

  try 
  {
    // Code to get and return the courses...
    const course = await Course.findOne({
      where: {id: req.params.id},
      include: [ { model: User, as: 'User', attributes: {exclude: ['password', 'createdAt', 'updatedAt']}}],
      attributes: {exclude: ['createdAt', 'updatedAt']}
    });

    if (course) 
    {
      // Respond to user with JSON object with coursess
      res.json(course);
    } 
    else 
    {
      // create custom error for an already existent account
      let myError = new Error(`Course not found, course: ${req.params.id}. Please search for another course.`);
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

/* POST api/courses route will attempt to create the specified course in the database. */
router.post('/api/courses', authenticateUser, asyncHandler( async (req, res) => {

  // Get the course from the request body.
  const courseToCreate = req.body;

  try 
  {
    // try to create the course and add the course to the course table.
    const course = await Course.create(
      {
        userId: req.currentUser.id,
        title: courseToCreate.title,
        description: courseToCreate.description,
        estimatedTime: (!courseToCreate.estimatedTime) ? courseToCreate.estimatedTime : null,
        materialsNeeded: (!courseToCreate.materialsNeeded) ? courseToCreate.materialsNeeded : null
      }
    );

    // Check to see if the course was created
    if (course) 
    {
      // Set the location and status to 201 Created and end the response.
      res.setHeader('Location', `courses/${course.id}`);
      res.status(201).end();
    } 
    else 
    {
      // create custom error for an error for course creation
      let myError = new Error(`Course not created.`);
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

// /* PUT api/courses/:id route will attempt to update the specified course in the database. */
router.put('/api/courses/:id', authenticateUser, [
  check('title')
    .exists()
    .withMessage('Please provide a value for "title"'),
  check('description')
    .exists()
    .withMessage('Please provide a value for "description"')
], asyncHandler( async (req, res) => {

  // Attempt to get the validation result from the Request object.
  const errors = validationResult(req);

  // If there are validation errors...
  if (!errors.isEmpty()) {
    // Use the Array `map()` method to get a list of error messages.
    const errorMessages = errors.array().map(error => error.msg);

    // Return the validation errors to the client.
    return res.status(400).json({ errors: errorMessages });
  }

  // Get the course from the request body.
  const courseToUpdate = req.body;

  try 
  {
    // Code to get and return the courses...
    let course = await Course.findOne({ where: {id: req.params.id} });
    
    if (course) 
    {
      //console.log(req.currentUser);
      //console.log('current user ID: ' + req.currentUser.dataValues.id );
      //console.log('course user ID: ' + course.dataValues.userId);
      
      
      if (req.currentUser.dataValues.id === course.dataValues.userId) 
      {
        // get the current values of the course
        let courseTitle = course.dataValues.title;
        let courseDesc = course.dataValues.description;
        let courseEstimatedTime = course.dataValues.estimatedTime;
        let courseMaterialsNeeded = course.dataValues.materialsNeeded;
        
        // update course
        course = await course.update(
        // set attribute values
        {
          title: (courseToUpdate.title) ? courseToUpdate.title : courseTitle,
          description: (courseToUpdate.description) ? courseToUpdate.description : courseDesc,
          estimatedTime: (courseToUpdate.estimatedTime) ? courseToUpdate.estimatedTime : courseEstimatedTime,
          materialsNeeded: (courseToUpdate.materialsNeeded) ? courseToUpdate.materialsNeeded : courseMaterialsNeeded
        });

        // Set the location and status to 201 Created and end the response.
        res.status(204).end();

      } 
      else 
      {
        // create custom error for an unauthorized update
        let myError = new Error(`You are not allowed to update the course: ${req.params.id}.`);
        myError.status = 403;
        throw myError; 
      }

    } 
    else 
    {
      // create custom error for a course not found
      let myError = new Error(`Course not found, course: ${req.params.id}. Please search for another course.`);
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

// /* DELETE api/courses/:id route will attempt to delete the specified course in the database. */
router.delete('/api/courses/:id', authenticateUser, asyncHandler( async (req, res) => {

    try 
    {
      // Code to get and return the courses...
      let course = await Course.findOne({ where: {id: req.params.id} });
      
      if (course) 
      {

        if (req.currentUser.dataValues.id === course.dataValues.userId) 
        {
          
          // destroy course
          await course.destroy();
  
          // Set the location and status to 204 Created and end the response.
          res.status(204).end();
  
        } 
        else 
        {
          // create custom error for unauthorized deletion
          let myError = new Error(`You are not allowed to delete the course: ${req.params.id}.`);
          myError.status = 403;
          throw myError; 
        }
  
      } 
      else 
      {
        // create custom error for a course not found
        let myError = new Error(`Course not found, course: ${req.params.id}. Please search for another course.`);
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