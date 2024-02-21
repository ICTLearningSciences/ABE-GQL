/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/

import createApp, { appStart, appStop } from "../../../src/app";
import { expect } from "chai";
import e, { Express } from "express";
import mongoUnit from "mongo-unit";
import request from "supertest";
import {
  GoogleAuthFunc,
  GoogleResponse,
  overrideGoogleAuthFunc,
  restoreGoogleAuthFunc,
} from "../../../src/schemas/mutation/login-google";

describe("refresh access token", () => {
  let app: Express;
  let googleAuthFunc: GoogleAuthFunc = (accessToken: string) => {
    return Promise.reject("override me");
  };

  function googleAuthFuncOverride(
    accessToken: string
  ): Promise<GoogleResponse> {
    return googleAuthFunc(accessToken);
  }

  beforeEach(async () => {
    overrideGoogleAuthFunc(googleAuthFuncOverride);
    await mongoUnit.load(require("test/fixtures/mongodb/data-default.js"));
    app = await createApp();
    await appStart();
  });

  afterEach(async () => {
    restoreGoogleAuthFunc();
    await appStop();
    await mongoUnit.drop();
  });

  it(`throws an error if no refreshToken`, async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `mutation {
        refreshAccessToken{
            user{
                name
                email
            }
            accessToken
            
        }
      }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body.errors[0].message).to.contain("no cookie header");
  });

  it(`throws an error if provided refreshToken does not exist`, async () => {
    const response = await request(app)
      .post("/graphql")
      .set("Cookie", ["mockRefreshToken=does_not_exist"])
      .send({
        query: `mutation {
        refreshAccessToken{
            user{
                name
                email
            }
            accessToken
            
        }
      }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body.errors[0].message).to.contain("invalid token");
  });

  it(`throws an error if provided refreshToken is expired`, async () => {
    const response = await request(app)
      .post("/graphql")
      .set("Cookie", ["mockRefreshToken=expired_refresh_token"])
      .send({
        query: `mutation {
        refreshAccessToken{
            user{
                name
                email
            }
            accessToken
            
        }
      }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body.errors[0].message).to.contain("invalid token");
  });

  it(`creates a new refreshToken`, async () => {
    const response = await request(app)
      .post("/graphql")
      .set("Cookie", ["mockRefreshToken=fake_refresh_token"])
      .send({
        query: `mutation {
        refreshAccessToken{
            user{
                name
                email
            }
            accessToken
            
        }
      }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.refreshAccessToken.accessToken).to.not.equal(
      "fake_access_token"
    );
    expect(response.body.data.refreshAccessToken.user.name).to.equal(
      "John Doe"
    );
    expect(response.body.data.refreshAccessToken.user.email).to.equal(
      "johndoe@gmail.com"
    );
  });
});
