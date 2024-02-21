/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/

import createApp, { appStart, appStop } from "../../../src/app";
import { expect } from "chai";
import { Express } from "express";
import { describe } from "mocha";
import mongoUnit from "mongo-unit";
import request from "supertest";

describe("update user activity state", () => {
  let app: Express;

  beforeEach(async () => {
    await mongoUnit.load(require("../../fixtures/mongodb/data-default.js"));
    app = await createApp();
    await appStart();
  });

  afterEach(async () => {
    await appStop();
    await mongoUnit.drop();
  });

  it(`can store new user activity state `, async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `mutation UpdateUserActivityState($userId: ID!, $activityId: ID!, $googleDocId: String!, $metadata: String!) {
            updateUserActivityState(userId: $userId, activityId: $activityId, googleDocId: $googleDocId, metadata: $metadata) {
                userId
                activityId
                googleDocId
                metadata
              }
         }`,
        variables: {
          userId: "5ffdf1231ee2c62320b49e96",
          activityId: "5ffdf1231ee2c62320b49e9a",
          googleDocId: "test_google_doc_id",
          metadata: "test_metadata",
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.updateUserActivityState).to.eql({
      userId: "5ffdf1231ee2c62320b49e96",
      activityId: "5ffdf1231ee2c62320b49e9a",
      googleDocId: "test_google_doc_id",
      metadata: "test_metadata",
    });
  });

  it("can update existing user activity state", async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `mutation UpdateUserActivityState($userId: ID!, $activityId: ID!, $googleDocId: String!, $metadata: String!) {
            updateUserActivityState(userId: $userId, activityId: $activityId, googleDocId: $googleDocId, metadata: $metadata) {
                userId
                activityId
                googleDocId
                metadata
              }
         }`,
        variables: {
          userId: "5ffdf1231ee2c62320b49e99",
          activityId: "5ffdf1231ee2c62320b49e9f",
          googleDocId: "test_google_doc_id",
          metadata: "test_new_metadata",
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.updateUserActivityState).to.eql({
      userId: "5ffdf1231ee2c62320b49e99",
      activityId: "5ffdf1231ee2c62320b49e9f",
      googleDocId: "test_google_doc_id",
      metadata: "test_new_metadata",
    });
  });
});
