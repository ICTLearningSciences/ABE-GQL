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

  it(`can submit new google doc data`, async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `mutation StoreGoogleDoc($googleDoc: GoogleDocInputType!) {
            storeGoogleDoc(googleDoc: $googleDoc) {
                googleDocId
                user
                    }
                }`,
        variables: {
          googleDoc: {
            googleDocId: "test_store_google_doc",
            user: "5ffdf1231ee2c62320b49e99",
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.storeGoogleDoc).to.eql({
      googleDocId: "test_store_google_doc",
      user: "5ffdf1231ee2c62320b49e99",
    });
  });

  it(`can submit new admin google doc with title`, async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `mutation StoreGoogleDoc($googleDoc: GoogleDocInputType!) {
                  storeGoogleDoc(googleDoc: $googleDoc) {
                      googleDocId
                      admin
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
                      service
                  }
                }`,
        variables: {
          googleDoc: {
            googleDocId: "test_store_google_doc",
            user: "5ffdf1231ee2c62320b49e99",
            admin: true,
            title: "test_title_input",
            service: "GOOGLE_DOCS",
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.storeGoogleDoc).to.eql({
      googleDocId: "test_store_google_doc",
      admin: true,
      title: "test_title_input",
      documentIntention: null,
      currentDayIntention: null,
      assignmentDescription: null,
      service: "GOOGLE_DOCS",
    });
  });

  it("can update existing google docs and not clobber other values", async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `mutation StoreGoogleDoc($googleDoc: GoogleDocInputType!) {
                storeGoogleDoc(googleDoc: $googleDoc) {
                    googleDocId
                    admin
                    title
                    assignmentDescription
                    documentIntention {
                        description
                    }
                    currentDayIntention {
                        description
                    }
                    createdAt
                }
              }`,
        variables: {
          googleDoc: {
            googleDocId: "test_admin_google_doc_id",
            user: "5ffdf1231ee2c62320b49e99",
            documentIntention: {
              description: "test_intention",
            },
            currentDayIntention: {
              description: "test_day_intention",
            },
            assignmentDescription: "test_assignment",
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.storeGoogleDoc).to.eql({
      googleDocId: "test_admin_google_doc_id",
      admin: true,
      title: "Test Admin Document",
      documentIntention: {
        description: "test_intention",
      },
      currentDayIntention: {
        description: "test_day_intention",
      },
      assignmentDescription: "test_assignment",
      createdAt: "2021-01-13T00:00:00.000Z",
    });
  });
});
