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
  MicrosoftGraphUser,
  MicrosoftGraphUserFunc,
  overrideMicrosoftGraphUser,
  restoreMicrosoftGraphUser,
} from "../../../src/schemas/mutation/login-microsoft";

describe("login with microsoft", () => {
  let app: Express;
  let microsoftGraphUserFunc: MicrosoftGraphUserFunc;

  function microsoftGraphUserFuncOverride(
    accessToken: string
  ): Promise<MicrosoftGraphUser> {
    return microsoftGraphUserFunc(accessToken);
  }

  beforeEach(async () => {
    overrideMicrosoftGraphUser(microsoftGraphUserFuncOverride);
    await mongoUnit.load(require("test/fixtures/mongodb/data-default.js"));
    app = await createApp();
    await appStart();
  });

  afterEach(async () => {
    restoreMicrosoftGraphUser();
    await appStop();
    await mongoUnit.drop();
  });

  it(`Logs in with microsoft`, async () => {
    microsoftGraphUserFunc = (accessToken: string) =>
      Promise.resolve<MicrosoftGraphUser>({
        id: "someid",
        displayName: "somename",
        mail: "x@y.com",
      });
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `mutation LoginMicrosoft($accessToken: String) {
        loginMicrosoft(accessToken: $accessToken) {
          user {
            name
            email
            loginService
          }
          accessToken
          expirationDate
        }
      }`,
        variables: {
          accessToken: "123",
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property(
      "data.loginMicrosoft.user.name",
      "somename"
    );
    expect(response.body).to.have.deep.nested.property(
      "data.loginMicrosoft.user.email",
      "x@y.com"
    );
    expect(response.body).to.have.deep.nested.property(
      "data.loginMicrosoft.user.loginService",
      "MICROSOFT"
    );
  });
});
