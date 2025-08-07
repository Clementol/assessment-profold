const axios = require('axios');
const url = require('url');
const { parseReqline } = require('../../core/utils');

async function handleReqlineRequest(req) {
  const { reqline } = req.body;

  const requestStartTime = Date.now();
  const parsedRequest = parseReqline(reqline);
  try {
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

    return { status: 200, data: successResponse };
  } catch (error) {
    const err = new Error('An unexpected error occurred.');
    err.errorCode = 400;
    err.isApplicationError = true;
    throw err;
  }
}

module.exports = {
  method: 'post',
  path: '',
  middlewares: [],
  handler: handleReqlineRequest,
};
