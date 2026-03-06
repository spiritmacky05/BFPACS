/**
 * utils/index.js
 *
 * App-level utilities — used across pages.
 */

/**
 * createPageUrl("IncidentDetail?id=xxx") → "/IncidentDetail?id=xxx"
 * Used for react-router-dom navigation from page name to URL path.
 */
export function createPageUrl(pageName) {
  return `/${pageName}`;
}
