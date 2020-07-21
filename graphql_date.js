const {GraphQLScalarType} = require('graphql');
const {Kind} = require('graphql/language');

/**
 * A date type object that is convenient for us  and has  methods to convert back and forth.
 * @type {GraphQLScalarType}
 */
const GraphQLDate = new GraphQLScalarType({
  name: 'GraphQLDate',
  description: 'A Date() type in GraphQL as a scalar',
  serialize(value) {
    return value.toISOString();
  },
  parseValue(value) {
    const dateValue = new Date(value);
    return Number.isNaN(dateValue.getTime()) ? undefined : dateValue;
  },
  parseLiteral(ast) {
    // ast.kind  indicates the type of token the parser found (float, integer, or string).
    // We only support strings.
    if (ast.kind === Kind.STRING) {
      const value = new Date(ast.value);
      return Number.isNaN(value.getTime()) ? undefined : value;
    }
    return undefined;
  },
});

module.exports = GraphQLDate;
