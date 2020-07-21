require('dotenv').config();
const {MongoClient} = require('mongodb');

// Global database connection variable
let db;


/*
Atlas URL - replace UUU with user, PPP with password, XXX with hostname
const url = 'mongodb+srv://UUU:PPP@cluster0-XXX.mongodb.net/issuetracker?retryWrites=true';

mLab URL - replace UUU with user, PPP with password, XXX with hostname
const url = 'mongodb://UUU:PPP@XXX.mlab.com:33533/issuetracker';
 */


// Try to connect to the database, initializing the global variable
//  To read issues from Mongo DB (use env package if possible)
async function connectToDb() {
  const url = process.env.MONGODB_URI || 'mongodb://localhost/issuetracker';
  const client = new MongoClient(url, {useNewUrlParser: true});
  await client.connect();
  console.log('Connected to MongoDB at', url);
  db = client.db();
}

// Increments  the current field in a generic manner.
// Identify  the  counter to increment using ID uspplied.
// Return the new incremented value.
async function getNextSequence(name) {
  const result = await db.collection('counters').findOneAndUpdate(
      {_id: name},
      {$inc: {current: 1}},
      {returnOriginal: false},
  );
  return result.value.current;
}

function getDb() {
  return db;
}

module.exports = {connectToDb, getNextSequence, getDb};
