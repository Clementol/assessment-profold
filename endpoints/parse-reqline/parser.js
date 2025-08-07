const { createHandler } = require('@app-core/server');
const parserService = require('../../services/parse-reqline/parser');

module.exports = createHandler({
  path: '',
  method: 'post',
  async handler(rc, helpers) {
    const { reqline } = rc.body;

    const response = await parserService(reqline);
    return {
      status: helpers.http_statuses.HTTP_200_OK,
      data: response,
    };
  },
});
