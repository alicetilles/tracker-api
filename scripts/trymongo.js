// Make a connection to the db  server
const {MongoClient} = require('mongodb');


// URL that identifies a database to connect to
// Always  starts with mongodb://, then the hostname or IPP address, then an optional port
const url = process.env.DB_URL || 'mongodb://localhost/issuetracker';


// Atlas URL - replace UUU with user, PPP with password, XXX with hostname
// const url = 'mongodb+srv://UUU:PPP@cluster0-XXX.mongodb.net/issuetracker?retryWrites=true';
// mLab URL - replace UUU with user, PPP with password, XXX with hostname
// const url = 'mongodb://UUU:PPP@XXX.mlab.com:33533/issuetracker';


function testWithCallbacks(callback) {
  console.log('\n--- testWithCallbacks ---');
  const client = new MongoClient(url, {useNewUrlParser: true});

  // Connect method is asynchronous. Needs callback to receive result of the connection.
  // Callback takes two arguments (error and result). Result is client object itself.
  client.connect((connErr) => {
    if (connErr) {
      callback(connErr);
      return;
    }
    console.log('Connected to MongoDB URL', url);

    const db = client.db();

    // Get  a handle to the connection called 'employees'.
    // We can do anything we did in the shell with this object.
    const collection = db.collection('employees');


    // Accessing the collection & insert  can only happen within the callback
    // Insert  a  new document and read it back
    const employee = {id: 1, name: 'A. Callback', age: 23};
    collection.insertOne(employee, (insertErr, result) => {
      if (insertErr) {
        client.close();
        callback(insertErr);
        return;
      }
      console.log('Result of insert:\n', result.insertedId);
      collection.find({_id: result.insertedId})
          .toArray((findErr, docs) => {
            if (findErr) {
              client.close();
              callback(findErr);
              return;
            }
            console.log('Result of find:\n', docs);
            client.close();
            callback();
          });
    });
  });
}

async function testWithAsync() {
  console.log('\n--- testWithAsync ---');
  const client = new MongoClient(url, {useNewUrlParser: true});
  try {
    await client.connect();
    console.log('Connected to MongoDB URL', url);
    const db = client.db();
    const collection = db.collection('employees');

    const employee = {id: 2, name: 'B. Async', age: 16};
    const result = await collection.insertOne(employee);
    console.log('Result of insert:\n', result.insertedId);

    const docs = await collection.find({_id: result.insertedId})
        .toArray();
    console.log('Result of find:\n', docs);
  } catch (err) {
    console.log(err);
  } finally {
    client.close();
  }
}

testWithCallbacks((err) => {
  if (err) {
    console.log(err);
  }
  testWithAsync();
});
