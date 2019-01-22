require("dotenv").config();

const expect = require("chai").expect;
const url = require("url");

const app = require("../index");
const request = require("supertest");

const errorMessages = require("../lib/errors.json");

describe("API", function() {
  describe("/login", (done) => {
    it("should send a 302 status code for redirect", (done) => {
      request(app)
        .get("/login")
        .expect(302)
        .end(done);
    });

    it("Should redirect to Github to request token", (done) => {
      request(app)
        .get("/login")
        .expect(302)
        .then((res) => {
          //const testUrl = `https://`
        })
        .end(done);
    });
  });

  describe("/callback", () => {});
});
