/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/

import createApp, { appStart, appStop } from "../../../src/app";
import { expect } from "chai";
import { Express } from "express";
import mongoUnit from "mongo-unit";
import request from "supertest";
import {
  CognitoAuthFunc,
  CognitoUser,
  overrideCognitoAuthFunc,
  restoreCognitoAuthFunc,
} from "../../../src/schemas/mutation/login-amazon-cognito";

describe("login with amazon cognito", () => {
  let app: Express;
  let amazonAuthFunc: CognitoAuthFunc = (idToken: string) => {
    return Promise.reject("override me");
  };

  function amazonAuthFuncOverride(idToken: string): Promise<CognitoUser> {
    return amazonAuthFunc(idToken);
  }

  beforeEach(async () => {
    overrideCognitoAuthFunc(amazonAuthFuncOverride);
    await mongoUnit.load(require("test/fixtures/mongodb/data-default.js"));
    app = await createApp();
    await appStart();
  });

  afterEach(async () => {
    restoreCognitoAuthFunc();
    await appStop();
    await mongoUnit.drop();
  });

  it(`creates a new user for new amazon cognito login`, async () => {
    amazonAuthFunc = (idToken: string) =>
      Promise.resolve<CognitoUser>({
        sub: "someid",
        name: "somename",
        email: "x@y.com",
        given_name: "somegivenname",
      });

    const response = await request(app)
      .post("/graphql")
      .send({
        query: `mutation {
        loginAmazonCognito(idToken: "test-id-token") {
          user {
            name
            email
            loginService
          }
          accessToken
          expirationDate
        }
      }`,
      });

    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      "data.loginAmazonCognito.user.name",
      "somename"
    );
    expect(response.body).to.have.deep.nested.property(
      "data.loginAmazonCognito.user.email",
      "x@y.com"
    );
    expect(response.body).to.have.deep.nested.property(
      "data.loginAmazonCognito.user.loginService",
      "AMAZON_COGNITO"
    );
  });
});
