const { throwAppError, ERROR_CODE } = require('@app-core/errors');

function validateReqLineAndParsed(reqline) {
  if (!reqline) {
    throwAppError("Missing 'reqline' in request body", ERROR_CODE.VALIDATIONERR);
  }

  if (typeof reqline !== 'string') {
    throwAppError('Reqline must be a string', ERROR_CODE.VALIDATIONERR);
  }

  const pipeCharacterCount = reqline.split('|').length - 1;
  const validDelimiterCount = reqline.split(' | ').length - 1;

  if (pipeCharacterCount === 0 || validDelimiterCount === 0) {
    throwAppError('Missing Delimiter', ERROR_CODE.VALIDATIONERR);
  }

  if (pipeCharacterCount !== validDelimiterCount) {
    throwAppError('Invalid spacing around pipe delimiter', ERROR_CODE.VALIDATIONERR);
  }

  const parts = reqline.split(' | ');

  const [httpPart, urlPart] = parts;
  const method = httpPart.substring(5).trim();
  const url = urlPart.substring(4).trim();

  if (method !== method.toUpperCase()) {
    throwAppError('HTTP method must be uppercase', ERROR_CODE.VALIDATIONERR);
  }

  if (!httpPart.startsWith('HTTP ')) {
    throwAppError('Missing required HTTP keyword', ERROR_CODE.VALIDATIONERR);
  }

  if (!urlPart.startsWith('URL ')) {
    throwAppError('Missing required URL keyword', ERROR_CODE.VALIDATIONERR);
  }

  if (method !== 'GET' && method !== 'POST') {
    throwAppError('Invalid HTTP method. Only GET and POST are supported', ERROR_CODE.VALIDATIONERR);
  }

  // Check for multiple spaces
  if (reqline.includes('  ')) {
    throwAppError('Multiple spaces found where single space expected', ERROR_CODE.VALIDATIONERR);
  }

  const parsed = {
    method,
    url,
    headers: {},
    query: {},
    body: {},
  };

  const seenKeywords = new Set();
  for (let i = 2; i < parts.length; i++) {
    const part = parts[i];
    const spaceIndex = part.indexOf(' ');

    if (spaceIndex === -1) {
      throwAppError('Missing space after keyword', ERROR_CODE.VALIDATIONERR);
    }

    const keyword = part.substring(0, spaceIndex);
    const valueStr = part.substring(spaceIndex + 1).trim();

    if (seenKeywords.has(keyword)) {
      throwAppError(`Duplicate keyword found: ${keyword}`, ERROR_CODE.VALIDATIONERR);
    }
    seenKeywords.add(keyword);

    // Strict uppercase check for all keywords
    if (keyword !== keyword.toUpperCase()) {
      throwAppError('Keywords must be uppercase', ERROR_CODE.VALIDATIONERR);
    }

    // Validate only allowed keywords
    const validKeywords = ['HEADERS', 'QUERY', 'BODY'];
    if (!validKeywords.includes(keyword)) {
      throwAppError(
        `Invalid keyword: ${keyword}. Only HEADERS, QUERY, BODY are allowed`,
        ERROR_CODE.VALIDATIONERR
      );
    }

    try {
      const parsedValue = JSON.parse(valueStr);

      switch (keyword) {
        case 'HEADERS':
          parsed.headers = parsedValue;
          break;
        case 'QUERY':
          parsed.query = parsedValue;
          break;
        case 'BODY':
          parsed.body = parsedValue;
          break;
        default:
          break;
      }
    } catch (e) {
      throwAppError(`Invalid JSON format in ${keyword} section`, ERROR_CODE.VALIDATIONERR);
    }
  }

  return parsed;
}

module.exports = validateReqLineAndParsed;
