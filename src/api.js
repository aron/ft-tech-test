const assert = require('assert');
const https = require('https');
const urlutils = require('url');
const get = require('lodash.get');

const FT_API_ROOT = 'https://api.ft.com';
const FT_API_KEY = process.env.FT_API_KEY;

assert(FT_API_KEY, `Expected environment variable FT_API_KEY ensure this is present in the environment running the server. e.g.
     FT_API_KEY=FOO123 node index.js`);

/** Makes a request against the search endpoint, and returns results and basic
  * pagination data.
  */
exports.search = async function search(query) {
  return request('/content/search/v1', 'POST', query).then(data => {
    return {
      pagination: {
        count: get(data, ['query', 'resultContext', 'maxResults'], 0),
        offset: get(data, ['query', 'resultContext', 'offset'], 0),
        total: get(data, ['results', 0, 'indexCount'], 0),
      },
      results: get(data, ['results', 0, 'results'], []),
    };
  });
}

/** Helper to construct a query object for the search endpoint */
exports.buildQuery = function buildQuery(query, maxResults, offset) {
  return {
    queryString: query,
    queryContext: {
      curations: [
        'ARTICLES',
      ],
    },
    resultContext: {
      maxResults: maxResults || 20,
      offset: offset || 0,
      aspects: ['title', 'summary', 'location', 'lifecycle'],
    }
  };
};

/** Promise wrapper around http.request */
function request(path, method, data) {
  method = method.toUpperCase();
  const parsed = urlutils.parse(FT_API_ROOT);
  const options = {
    ...parsed,
    path: path,
    method: method,
    headers: {
      'Accept': 'application/json',
      'X-Api-Key': FT_API_KEY,
    },
  };
  return new Promise(function (resolve, reject) {
    const req = https.request(options, function (res) {
      let body = '';
      res.on('data', chunk => body += chunk.toString('utf-8'));
      res.on('end', function () {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`Request for ${path} was unsuccessful: ${body}`));
        } else {
          resolve(JSON.parse(body));
        }
      });
    });

    if (method !== 'GET' && data) {
      req.write(JSON.stringify(data));
    }

    req.on('error', reject);
    req.end();
  });
}
