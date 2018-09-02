const Mustache = require('mustache');
const assert = require('assert');
const escape = require('lodash.escape');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '../templates');

// Build map of template name => html (mustache) content.
const TEMPLATES = ['base', 'header', 'index', 'search'].reduce((map, filename) => {
  map[filename] = fs.readFileSync(path.join(ROOT_DIR, `${filename}.mustache`)).toString('utf-8');
  return map;
}, {});

// Pre-parse all templates.
Object.values(TEMPLATES).forEach(t => Mustache.parse(t));

/**
 * Renders the index template, expects the following variables:
 * title: The page title
 * article:
 *   title: The title of the article
 *   summary: The summary text
 *   permalink: The FT permalink
 *   publishedTimestamp: The ISO formatted timestamp
 *   published: The human readable version of the published date
 */
exports.renderIndex = async function renderIndex(params) {
  return Promise.resolve(renderBase(TEMPLATES.index, params));
}

/**
 * Renders the index template, expects the following variables:
 * title: The page title
 * query: The query string
 * articles[]:
 *   title: The title of the article
 *   summary: The summary text
 *   permalink: The FT permalink
 *   publishedTimestamp: The ISO formatted timestamp
 *   published: The human readable version of the published date
 *  hasArticles: True if there are any articles
 *  pagination:
 *    hasPagination: True if there is any pagination
 *    pages[]: An array of {label, page, isSelected} objects.
 */
exports.renderSearch = async function renderSerarch(params, opts={}) {
  const {contentOnly=false} = opts;
  const rendered = contentOnly ?
      Mustache.render(TEMPLATES.search, params) :
      renderBase(TEMPLATES.search, params);
  return Promise.resolve(rendered);
}

/** Renders the base template with content partial provided. */
function renderBase(contentTemplate, params) {
  return Mustache.render(TEMPLATES.base, params, {
    head: TEMPLATES.head,
    header: TEMPLATES.header,
    content: contentTemplate,
  });
}
