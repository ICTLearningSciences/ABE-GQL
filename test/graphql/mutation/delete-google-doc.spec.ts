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

describe("store google doc", () => {
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

  it(`delete a google doc`, async () => {
    const existingDocs1 = await request(app)
      .post("/graphql")
      .send({
        query: `query FetchGoogleDocs($userId: ID!) {
                  fetchGoogleDocs(userId: $userId) {
                    googleDocId
                    user
                    title
                    documentIntention {
                      description
                      createdAt
                    }
                    currentDayIntention {
                      description
                      createdAt
                    }
                    assignmentDescription
                    createdAt
                  }
              }`,
        variables: {
          userId: "5ffdf1231ee2c62320b49e99",
        },
      });
    expect(existingDocs1.status).to.equal(200);
    expect(existingDocs1.body.data.fetchGoogleDocs).to.deep.include.members([
      {
        createdAt: "2021-01-13T00:00:00.000Z",
        googleDocId: "test_google_doc_id",
        documentIntention: {
          description: "test-intention",
          createdAt: "2000-10-12T20:49:41.599Z",
        },
        currentDayIntention: {
          description: "test-day-intention",
          createdAt: "2000-10-12T20:49:41.599Z",
        },
        assignmentDescription: "test-assignment-description",
        user: "5ffdf1231ee2c62320b49e99",
        title: "Test Document",
      },
      {
        createdAt: "2021-01-13T00:00:00.000Z",
        googleDocId: "test_admin_google_doc_id",
        documentIntention: null,
        currentDayIntention: null,
        assignmentDescription: null,
        title: "Test Admin Document",
        user: "5ffdf1231ee2c62320b49e99",
      },
    ]);

    const response = await request(app)
      .post("/graphql")
      .send({
        query: `mutation DeleteGoogleDoc($googleDocId: String!, $userId: String!) {
            deleteGoogleDoc(googleDocId: $googleDocId, userId: $userId) {
                googleDocId
                user
                    }
                }`,
        variables: {
          googleDocId: "test_google_doc_id",
          userId: "5ffdf1231ee2c62320b49e99",
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.deleteGoogleDoc).to.eql({
      googleDocId: "test_google_doc_id",
      user: "5ffdf1231ee2c62320b49e99",
    });

    const existingDocs2 = await request(app)
      .post("/graphql")
      .send({
        query: `query FetchGoogleDocs($userId: ID!) {
                  fetchGoogleDocs(userId: $userId) {
                    googleDocId
                    user
                    title
                    documentIntention {
                      description
                      createdAt
                    }
                    currentDayIntention {
                      description
                      createdAt
                    }
                    assignmentDescription
                    createdAt
                  }
              }`,
        variables: {
          userId: "5ffdf1231ee2c62320b49e99",
        },
      });
    expect(existingDocs2.status).to.equal(200);
    expect(existingDocs2.body.data.fetchGoogleDocs).to.deep.include.members([
      {
        createdAt: "2021-01-13T00:00:00.000Z",
        googleDocId: "test_admin_google_doc_id",
        documentIntention: null,
        currentDayIntention: null,
        assignmentDescription: null,
        title: "Test Admin Document",
        user: "5ffdf1231ee2c62320b49e99",
      },
    ]);
  });
});
