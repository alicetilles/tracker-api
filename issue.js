const {UserInputError} = require('apollo-server-express');
const {getDb, getNextSequence} = require('./db.js');
const {mustBeSignedIn} = require('./auth.js');

const PAGE_SIZE = 10;


/*
Retrieve  a  list of issues by using find on issues collection in mongo database.
Takes as an optional argument a simple filter based on  the status field
so that users can list only issues w/ that status.
 */
async function list(_, {
  status, effortMin, effortMax, search, page,
}) {
  const db = getDb();
  const filter = {};
  if (status) filter.status = status;

  // Support to filter on effort (a numerical value)
  if (effortMin !== undefined || effortMax !== undefined) {
    filter.effort = {};
    if (effortMin !== undefined) filter.effort.$gte = effortMin;
    if (effortMax !== undefined) filter.effort.$lte = effortMax;
  }

  if (search) filter.$text = {$search: search};

  const cursor = db.collection('issues').find(filter)
      .sort({id: 1})
      .skip(PAGE_SIZE * (page - 1))
      .limit(PAGE_SIZE);

  const totalCount = await cursor.count(false);
  const issues = cursor.toArray();
  const pages = Math.ceil(totalCount / PAGE_SIZE);
  return {issues, pages};
}

/**
 * Make sure issue input is correct before  saving  a new issue.
 * @param _
 * @param issue
 */
function validate(issue) {
  const errors = [];
  if (issue.title.length < 3) {
    errors.push('Field "title" must be at least 3 characters long.');
  }
  if (issue.status === 'Assigned' && !issue.owner) {
    errors.push('Field "owner" is required when status is "Assigned"');
  }
  if (errors.length > 0) {
    throw new UserInputError('Invalid input(s)', {errors});
  }
}


/**
 * Creates  an issue. If the status is undefined, then it is new.
 * @param _ Ignore the first argument
 * @param issue Use destructing assignment to access issue object
 * @returns {*} Return the issue object as is
 *
 *
 *     // generate  a new ID field and set  it  in the supplied issue object in the resolver
 //  Read back the newly created issue
 */
async function add(_, {issue}) {
  const db = getDb();
  validate(issue);

  const newIssue = Object.assign({}, issue);
  newIssue.created = new Date();
  newIssue.id = await getNextSequence('issues');

  const result = await db.collection('issues').insertOne(newIssue);
  const savedIssue = await db.collection('issues').findOne({_id: result.insertedId});
  return savedIssue;
}

/*
A way to get  a single issue from the API. The optional argument is the _id
in MongoDb.
 */
async function get(_, {id}) {
  const db = getDb();
  const issue = await db.collection('issues').findOne({id});
  return issue;
}

async function update(_, {id, changes}) {
  const db = getDb();
  if (changes.title || changes.status || changes.owner) {
    const issue = await db.collection('issues').findOne({id});
    Object.assign(issue, changes);
    validate(issue);
  }
  await db.collection('issues').updateOne({id}, {$set: changes});
  const savedIssue = await db.collection('issues').findOne({id});
  return savedIssue;
}

async function remove(_, {id}) {
  const db = getDb();
  const issue = await db.collection('issues').findOne({id});
  if (!issue) return false;
  issue.deleted = new Date();

  let result = await db.collection('deleted_issues').insertOne(issue);
  if (result.insertedId) {
    result = await db.collection('issues').removeOne({id});
    return result.deletedCount === 1;
  }
  return false;
}

/*
Transfers an issue from the deleted_issues collection to the issues collection
 */
async function restore(_, {id}) {
  const db = getDb();
  const issue = await db.collection('deleted_issues').findOne({id});
  if (!issue) return false;
  issue.deleted = new Date();

  let result = await db.collection('issues').insertOne(issue);
  if (result.insertedId) {
    result = await db.collection('deleted_issues').removeOne({id});
    return result.deletedCount === 1;
  }
  return false;
}

async function counts(_, {status, effortMin, effortMax}) {
  const db = getDb();
  const filter = {};

  if (status) filter.status = status;

  if (effortMin !== undefined || effortMax !== undefined) {
    filter.effort = {};
    if (effortMin !== undefined) filter.effort.$gte = effortMin;
    if (effortMax !== undefined) filter.effort.$lte = effortMax;
  }

  const results = await db.collection('issues').aggregate([
    {$match: filter},
    {
      $group: {
        _id: {owner: '$owner', status: '$status'},
        count: {$sum: 1},
      },
    },
  ]).toArray();

  const stats = {};
  results.forEach((result) => {
    // eslint-disable-next-line no-underscore-dangle
    const {owner, status: statusKey} = result._id;
    if (!stats[owner]) stats[owner] = {owner};
    stats[owner][statusKey] = result.count;
  });
  return Object.values(stats);
}

module.exports = {
  list,
  add: mustBeSignedIn(add),
  get,
  update: mustBeSignedIn(update),
  delete: mustBeSignedIn(remove),
  restore: mustBeSignedIn(restore),
  counts,
};
