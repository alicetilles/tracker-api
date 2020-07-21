// Import  the type definitions for the Apollo Server
const fs = require('fs');

// Handles environment variables
require('dotenv').config();

const {ApolloServer} = require('apollo-server-express');

const GraphQLDate = require('./graphql_date.js');
const about = require('./about.js');
const issue = require('./issue.js');
const auth = require('./auth.js');


/*
Handlers or functions that can be called when about API field is accessed.
Handlers are done in local language, not special Schema Language.
 */
const resolvers = {
  Query: {
    about: about.getMessage,
    user: auth.resolveUser,
    issueList: issue.list,
    issue: issue.get,
    issueCounts: issue.counts,
  },
  Mutation: {
    setAboutMessage: about.setMessage,
    issueAdd: issue.add,
    issueUpdate: issue.update,
    issueDelete: issue.delete,
    issueRestore: issue.restore,
  },
  GraphQLDate,
};


function getContext({req}) {
  const user = auth.getUser(req);
  return {user};
}

// Install Apollo server as a middleware in Express
// * Mount it at a single endpoint
// * applyMiddleware does this for us
const server = new ApolloServer({
  typeDefs: fs.readFileSync('schema.graphql', 'utf-8'),
  resolvers,
  context: getContext,
  formatError: (error) => {
    console.log(error);
    return error;
  },
  playground: true,
  introspection: true,
});

function installHandler(app) {
  const enableCors = (process.env.ENABLE_CORS || 'true') === 'true';
  console.log('CORS setting:', enableCors);
  let cors;
  if (enableCors) {
    const origin = process.env.UI_SERVER_ORIGIN || 'http://localhost:8000';
    const methods = 'POST';
    cors = {origin, methods, credentials: true};
  } else {
    cors = 'false';
  }
  server.applyMiddleware({app, path: '/graphql', cors});
}

module.exports = {installHandler};
