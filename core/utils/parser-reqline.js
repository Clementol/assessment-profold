/**
 * Parses the reqline string into a structured request object.
 * Throws Error for syntax violations.
 * @param {string} reqline - The input string, e.g., "HTTP GET | URL https://..."
 * @returns {object } method: string; url: string; headers: {}; query: {}; body: {}
 * - The parsed request object.
 */
function parseReqline(reqline) {
  if (!reqline) {
    const err = new Error("Missing 'reqline' in request body");
    err.errorCode = 400;
    err.isApplicationError = true;
    throw err;
  }

  if (typeof reqline !== 'string') {
    const err = new Error('Reqline must be a string');
    err.errorCode = 400;
    err.isApplicationError = true;
    throw err;
  }

  const pipeCharacterCount = reqline.split('|').length - 1;
  const validDelimiterCount = reqline.split(' | ').length - 1;

  if (pipeCharacterCount === 0 || validDelimiterCount === 0) {
    const err = new Error('Missing Delimiter');
    err.errorCode = 400;
    err.isApplicationError = true;
    throw err;
  }

  if (pipeCharacterCount !== validDelimiterCount) {
    const err = new Error('Invalid spacing around pipe delimiter');
    err.errorCode = 400;
    err.isApplicationError = true;
    throw err;
  }

  const parts = reqline.split(' | ');

  const [httpPart, urlPart] = parts;
  const method = httpPart.substring(5).trim();
  const url = urlPart.substring(4).trim();

  if (method !== method.toUpperCase()) {
    const err = new Error('HTTP method must be uppercase');
    err.errorCode = 400;
    err.isApplicationError = true;
    throw err;
  }

  if (!httpPart.startsWith('HTTP ')) {
    const err = new Error('Missing required HTTP keyword');
    err.errorCode = 400;
    err.isApplicationError = true;
    throw err;
  }

  if (!urlPart.startsWith('URL ')) {
    const err = new Error('Missing required URL keyword');
    err.errorCode = 400;
    err.isApplicationError = true;
    throw err;
  }

  if (method !== 'GET' && method !== 'POST') {
    const err = new Error('Invalid HTTP method. Only GET and POST are supported');
    err.errorCode = 400;
    err.isApplicationError = true;
    throw err;
  }

  // Check for multiple spaces
  if (reqline.includes('  ')) {
    const err = new Error('Multiple spaces found where single space expected');
    err.errorCode = 400;
    err.isApplicationError = true;
    throw err;
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
      const err = new Error('Missing space after keyword');
      err.errorCode = 400;
      err.isApplicationError = true;
      throw err;
    }

    const keyword = part.substring(0, spaceIndex);
    const valueStr = part.substring(spaceIndex + 1).trim();

    if (seenKeywords.has(keyword)) {
      const err = new Error(`Duplicate keyword found: ${keyword}`);
      err.errorCode = 400;
      err.isApplicationError = true;
      throw err;
    }
    seenKeywords.add(keyword);

    // Strict uppercase check for all keywords
    if (keyword !== keyword.toUpperCase()) {
      const err = new Error('Keywords must be uppercase');
      err.errorCode = 400;
      err.isApplicationError = true;
      throw err;
    }

    // Validate only allowed keywords
    const validKeywords = ['HEADERS', 'QUERY', 'BODY'];
    if (!validKeywords.includes(keyword)) {
      const err = new Error(`Invalid keyword: ${keyword}. Only HEADERS, QUERY, BODY are allowed`);
      err.errorCode = 400;
      err.isApplicationError = true;
      throw err;
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
          // Should never reach here due to earlier validation
          break;
      }
    } catch (e) {
      const err = new Error(`Invalid JSON format in ${keyword} section`);
      err.errorCode = 400;
      err.isApplicationError = true;
      throw err;
    }
  }

  return parsed;
}

module.exports = parseReqline;
