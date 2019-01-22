const { router, get } = require("microrouter");

// Get Github Routes
const GithubAuth = require("./lib/GithubAuth");

/**
 * Setup GH_CLIENT_ID and GH_CLIENT_SECRET.
 * For security only allow setting by environment variables.
 */
const githubClientId = process.env.GH_CLIENT_ID;
const githubClientSecret = process.env.GH_CLIENT_SECRET;

/**
 * Setup GH_HOST. Allow setting the domain for enterprise IDs.
 * For security only allow setting by environment variables.
 * If not set, default to github.com.
 */
const githubHost = process.env.GH_HOST;

// Initialize Github Auth with defaults
const app = new GithubAuth(githubClientId, githubClientSecret, {
  githubUrl: githubHost,
});

// Export routes
module.exports = router(
  get("/login", app.login),
  get("/callback", app.callback)
);
