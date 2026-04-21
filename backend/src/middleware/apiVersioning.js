/**
 * API Versioning Middleware
 * Supports version negotiation via Accept header or URL path
 */

const apiVersioning = (req, res, next) => {
  // Default version
  let version = 'v1';

  // Check Accept header: Accept: application/vnd.api.v2+json
  const acceptHeader = req.get('Accept');
  if (acceptHeader) {
    const versionMatch = acceptHeader.match(/application\/vnd\.api\.v(\d+)\+json/);
    if (versionMatch) {
      version = `v${versionMatch[1]}`;
    }
  }

  // Check URL path: /api/v2/endpoint
  const urlVersionMatch = req.path.match(/^\/api\/v(\d+)\//);
  if (urlVersionMatch) {
    version = `v${urlVersionMatch[1]}`;
    // Remove version from path for route matching
    req.url = req.url.replace(/^\/api\/v\d+/, '/api');
  }

  req.apiVersion = version;
  res.set('X-API-Version', version);

  next();
};

module.exports = apiVersioning;