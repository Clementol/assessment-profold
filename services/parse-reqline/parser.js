const url = require('url');
const { throwAppError, ERROR_CODE } = require('@app-core/errors');
const validator = require('@app-core/validator');
const axios = require('axios');

async function parserService(reqline) {
  try {
    const requestStartTime = Date.now();

    const parsedRequest = validator.validateReqLineAndParsed(reqline);

    // Build URL with query parameters
    const fullUrl = new url.URL(parsedRequest.url);
    Object.entries(parsedRequest.query).forEach(([key, value]) => {
      fullUrl.searchParams.append(key, String(value));
    });
    const finalUrlString = fullUrl.toString();

    const axiosConfig = {
      method: parsedRequest.method,
      url: finalUrlString,
      headers: parsedRequest.headers,
      data: parsedRequest.body,
      timeout: 10000,
    };

    const externalResponse = await axios(axiosConfig);
    const requestStopTime = Date.now();

    const successResponse = {
      request: {
        query: parsedRequest.query,
        body: parsedRequest.body,
        headers: parsedRequest.headers,
        full_url: finalUrlString,
      },
      response: {
        http_status: externalResponse.status,
        duration: requestStopTime - requestStartTime,
        request_start_timestamp: requestStartTime,
        request_stop_timestamp: requestStopTime,
        response_data: externalResponse.data,
      },
    };

    return { successResponse };
  } catch (error) {
    if (error.errorCode === ERROR_CODE.VALIDATIONERR) {
      throwAppError(error.message, error.errorCode);
    }
    throwAppError('An Error occured', ERROR_CODE.INVLDREQ);
  }
}

module.exports = parserService;
