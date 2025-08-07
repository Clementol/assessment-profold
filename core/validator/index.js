const parse = require('./parser');
const validateReqLineAndParsed = require('./reqline-parser-validator');
const validate = require('./validator');

module.exports = {
  parse,
  validate,
  validateReqLineAndParsed,
};
