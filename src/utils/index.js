/**
 * Convert a page name to a URL-friendly slug.
 * @param {string} pageName - The page name to convert
 * @returns {string} URL-friendly slug starting with /
 */
export function createPageUrl(pageName) {
  return '/' + pageName.replace(/ /g, '-');
}