const expect = require("chai").expect;

const GithubAuth = require("../lib/GithubAuth");
const errorMessages = require("../lib/errors.json");

describe("GithubAuth", function() {
  before(() => {
    this.req = {
      query: {
        scope: "",
        allow_signup: "",
        redirect_uri: "",
        login: "",
      },
    };

    this.res = {
      setHeader: () => {},
      end: () => {},
    };
  });

  /**
   * Constructor
   */
  describe("#constructor()", () => {
    it("Should throw a TypeError if no client ID is provided", () => {
      expect(() => {
        new GithubAuth();
      }).to.throw(TypeError, errorMessages["undefined-client-id"]);
    });

    it("Should supply a default Github URL if none is provided through the .env", () => {
      const clientId = "123456";
      const githubUrl = undefined;

      const instance = new GithubAuth(clientId, githubUrl);

      expect(instance.githubUrl).to.equal("github.com");
    });

    it("Should use a enterprise Github URL if provided through the .env", () => {
      const clientId = "123456";
      const githubUrl = "github.company.com";

      const instance = new GithubAuth(clientId, githubUrl);

      expect(instance.githubUrl).to.equal("github.company.com");
    });
  });

  /**
   * GithubAuth.login()
   */
  describe("#login()", () => {
    it("Should set this.clientState with a Unique ID", async () => {
      const instance = new GithubAuth("123456");

      await instance.login(this.req, this.res);

      expect(instance.clientState)
        .to.be.a("string")
        .and.to.have.a.lengthOf(20);
    });
  });

  /**
   * GithubAuth.callback()
   */
  describe.skip("#callback()", () => {});
});
