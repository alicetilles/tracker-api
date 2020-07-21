require('dotenv').config();

// Initialize the GraphQL server
const express = require('express');
const cookieParser = require('cookie-parser');
const {connectToDb} = require('./db.js');
const {installHandler} = require('./api_handler.js');
const auth = require('./auth.js');

const app = express();


app.use(cookieParser());
app.use('/auth', auth.routes);

installHandler(app);

// For the server port - prefer  the environment variable if possible
const port = process.env.port || 3000;


/**
 * Server setup. First connect to the DB, then start Express application.
 */
(async function start() {
  try {
    await connectToDb();
    app.listen(port, () => {
      console.log(`API server started on port ${port}`);
    });
  } catch (err) {
    console.log('ERROR:', err);
  }
}());
