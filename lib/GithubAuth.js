const querystring = require("querystring");
const redirect = require("micro-redirect");
const axios = require("axios");
const uid = require("uid-promise");
const errorMessages = require("./static/errors.json");

module.exports = class GithubAuth {
  /**
   * Constructor
   *
   * @param clientId {String} - The Github Client ID to use
   * @param [githubUrl] {String} - Enterprise Github URL if needed
   */
  constructor(clientId, clientSecret, options) {
    // Fail if no clientId is found
    if (!clientId) {
      throw new TypeError(errorMessages["undefined-client-id"]);
    }

    // Fail if no clientSecret is found
    if (!clientSecret) {
      throw new TypeError(errorMessages["undefined-client-secret"]);
    }

    // Set required defaults
    this.clientId = clientId;
    this.clientSecret = clientSecret;

    // Set optional defaults
    this.githubUrl = options.githubUrl || "github.com";

    // The universal IDs to prevent CSRF attacks on our response callback.
    this.clientStates = new Set();

    // Setup known routes
    this.urlAuthorize = `https://${this.githubUrl}/login/oauth/authorize`;
    this.urlAccessToken = `https://${this.githubUrl}/login/oauth/access_token`;

    // Bind functions
    this.clientRedirect = this.clientRedirect.bind(this);
    this.getAccessToken = this.getAccessToken.bind(this);
    this.login = this.login.bind(this);
    this.callback = this.callback.bind(this);
  }

  /**
   * Redirect the reponse to the user after success or error.
   *
   * @param res {Object} - The response.
   * @param params {Object} - The data to parse for the client.
   * @param [params.error] {String} - Error message if it exists.
   * @param [params.access_token] {String} - The access token from Github for the client.
   */
  clientRedirect(res, params) {
    console.log("params: ", params);

    const location = `${params.redirect_uri}?${querystring.stringify(params)}`;

    redirect(res, 302, location);
  }

  /**
   * Get the access token from Github using the temporary code given to us
   * by Github.
   *
   * @async
   * @param code {string} - The code received from Github.
   * @param state {string} - The state received from Github.
   * @returns {}
   * @see {@link https://developer.github.com/apps/building-oauth-apps/authorizing-oauth-apps/#3-use-the-access-token-to-access-the-api}
   */
  async getAccessToken(code, state, redirect_uri) {
    if (!code) throw new Error(errorMessages["undefined-code"]);
    if (!state) throw new Error(errorMessages["undefined-state"]);

    // Determine if state is defined and matches the UID we created.
    // If not, the request may have come from a third party source.
    if (!this.clientStates.has(state)) {
      throw new Error(errorMessages["mismatched-state"]);
    }

    const body = {
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code: code,
      state: state,
    };

    if (redirect_uri) body["redirect_uri"] = redirect_uri;

    const { status, data } = await axios({
      method: "POST",
      url: this.urlAccessToken,
      responseType: "json",
      data: body,
    });

    // Parse the data returned from Github (errors, access_token)
    const qs = querystring.parse(data);

    if (qs.error) {
      throw new Error(qs.error);
    }

    // TODO: match up with Github on error management
    if (!qs.error && status >= 400) {
      throw new Error(errorMessages["unknown-error"]);
    }

    return qs.access_token;
  }

  /**
   * Handles routing of /login and redirects to Github for authorization.
   *
   * @async
   * @param req {Object} - The request.
   * @param res {Object} - The response.
   * @param req.query.scope {String} - A space-delimited list of scopes. If not provided, scope defaults to an empty list for users that have not authorized any scopes for the application.
   * @param req.query.allow_signup {String} - Whether or not unauthenticated users will be offered an option to sign up for GitHub during the OAuth flow. The default is true. Use false in the case that a policy prohibits signups.
   * @param req.query.redirect_uri {String} - The URL in your application where users will be sent after authorization.
   * @see {@link https://developer.github.com/apps/building-oauth-apps/authorizing-oauth-apps/#1-request-a-users-github-identity}
   */
  async login(req, res) {
    // Get values from req.query if available
    const { scope, allow_signup, redirect_uri } = req.query;

    // Create URL friendly universal ID to verify auth callback (Required by GH).
    const state = await uid(20);
    this.clientStates.add(state);

    // Setup query parameters
    const query = {
      client_id: this.clientId,
      state: state,
    };

    // Determine additional query parameters to be sent.
    if (scope) query.scope = scope;
    if (allow_signup == true) query.allow_signup = allow_signup;
    if (redirect_uri) query.redirect_uri = redirect_uri;

    console.log(
      "query: ",
      `${this.urlAuthorize}?${querystring.stringify(query)}`
    );

    // Redirect to Github
    redirect(res, 302, `${this.urlAuthorize}?${querystring.stringify(query)}`);
  }

  /**
   * Handles the authorization callback from github. Redirects to set redirect_uri with token.
   *
   * @async
   * @param req {Object} - The request.
   * @param res {Object} - The response.
   * @param req.query.scope {String} - Comma-seperated values representing the github scope.
   * @param req.query.allow_signup {Boolean} - Allow users to signup during authentication.
   * @see {@link https://developer.github.com/apps/building-oauth-apps/authorizing-oauth-apps/#2-users-are-redirected-back-to-your-site-by-github}
   */
  async callback(req, res) {
    res.setHeader("Content-Type", "application/json");

    // Get values from req.query.
    const { code, state, redirect_uri } = req.query;

    console.log("callback code: ", req.query.code);

    console.log("callback redirect: ", redirect_uri);

    // Use the Github code to request the authorization token for the client
    try {
      const accessToken = await this.getAccessToken(code, state, redirect_uri);
      this.clientRedirect(res, { access_token: accessToken });
      this.clientStates.delete(state);
    } catch (err) {
      //eslint-disable-next-line no-console
      console.error("Error fetching access token: ", err);

      this.clientRedirect(res, {
        error: err,
      });
    }
  }
};
