const {renderIndex, renderSearch} = require('./render');
const {requestArticle, search, buildQuery} = require('./api');
const urlutils = require('url');

// Max number of articles to make selection from.
const RANDOM_SAMPLE_SIZE = 20;

// Number of search results per page.
const SEARCH_BATCH_SIZE = 20;
const MAX_SEARCH_OFFSET = 4000 - 1;

// Helper to build an appropriate HTTP response, will return a function
// that will write the provided HTML document into the response.
function writer(req, res) {
  return function (html) {
    res.setHeader('Content-Type', 'text/html');
    res.write(html);
    res.end();
  };
}

/** Handles the index route and displays a "random" article summary */
exports.handleIndex = async function handleIndex(req, res) {
  const {results} = await search(buildQuery('', RANDOM_SAMPLE_SIZE));
  if (!results.length) {
    return Promise.reject(new Error('No articles found'));
  }

  const randomIdx = Math.floor(Math.random() * results.length);
  const result = results[randomIdx];

  return renderIndex({
    title: result.title.title,
    article: resultToArticle(result),
  }).then(writer(req, res));
};

/** Handles the search route and displays paginated search results for a query */
exports.handleSearch = async function handleSearch(req, res) {
  const {q: query, page = 1} = urlutils.parse(req.url, true).query;
  const offset = (page - 1) * SEARCH_BATCH_SIZE;
  const {results, pagination} = await search(buildQuery(query, SEARCH_BATCH_SIZE, offset));
  const isXHR = !!req.headers['xmlhttprequest'];
  const articles = results.map(resultToArticle);

  return renderSearch({
    title: `Search Results for “${query}”`,
    query: query,
    articles: articles,
    hasArticles: articles.length > 0,
    pagination: paginationData(pagination),
  }, {contentOnly: isXHR}).then(writer(req, res));
};

function resultToArticle(result) {
  const published = new Date(Date.parse(result.lifecycle.lastPublishDateTime));
  return {
    title: result.title.title,
    summary: result.summary.excerpt,
    permalink: result.location.uri,
    publishedTimestamp: published.toISOString(),
    published: published.toLocaleString(),
  };
}

/**
 * Calculate pagination items. We show the current page plus the next &
 * previous items if they are not the current page. If next/prev extend beyond
 * the first/last page of a query then we also show additional first/last
 * page buttons too.
 *
 * Examples (where * denotes the current page):
 *
 * [*1*] [2] [Last]
 * [1] [*2*] [3] [Last]
 * [First] [2] [*3*] [4] [Last]
 * [First] [33] [*34*] [35]
 * [First] [34] [*35*]
 *
 */
function paginationData({count, offset, total}) {
  const firstPage = 1;
  const currentPage = Math.floor(offset / count) + 1;
  const lastPage = Math.floor(Math.min(total, MAX_SEARCH_OFFSET) / count) + 1;
  const prevPage = Math.max(currentPage - 1, firstPage);
  const nextPage = Math.min(currentPage + 1, lastPage);
  const pages = [];

  if (currentPage !== firstPage && prevPage !== firstPage) {
    pages.push({label: 'First', page: firstPage, isSelected: false});
  }

  if (prevPage >= firstPage && prevPage !== currentPage) {
    pages.push({label: prevPage, page: prevPage, isSelected: false});
  }

  pages.push({label: currentPage, page: currentPage, isSelected: true});

  if (nextPage <= lastPage && nextPage !== currentPage) {
    pages.push({label: nextPage, page: nextPage, isSelected: false});
  }

  if (currentPage !== lastPage && nextPage !== lastPage) {
    pages.push({label: 'Last', page: lastPage, isSelected: false});
  }

  return {
    hasPagination: pages.length > 1,
    pages: pages,
  };
}

