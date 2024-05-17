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

describe("fetch google doc versions", () => {
  let app: Express;

  beforeEach(async () => {
    await mongoUnit.load(require("../../fixtures/mongodb/data-default.js"));
    app = createApp();
    await appStart();
  });

  afterEach(async () => {
    await appStop();
    await mongoUnit.drop();
  });

  it(`throws an error if google doc version not provided`, async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `query FetchGoogleDocVersions($googleDocId: String!) {
                    fetchGoogleDocVersions(googleDocId: $googleDocId) {
                      docId
                      plainText
                      lastChangedId
                      chatLog {
                        sender
                        message
                      }
                      activity
                      intent
                      title
                      lastModifyingUser
                      modifiedTime
                }
        }`,
        variables: {
          googleDocId: null,
        },
      });
    expect(response.status).to.equal(500);
    expect(response.body).to.have.deep.nested.property("errors[0].message");
  });

  it(`can fetch google doc versions`, async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `query FetchGoogleDocVersions($googleDocId: String!) {
                    fetchGoogleDocVersions(googleDocId: $googleDocId) {
                      docId
                      plainText
                      lastChangedId
                      chatLog {
                        sender
                        message
                      }
                      activity
                      intent
                      title
                      lastModifyingUser
                      modifiedTime   
                    }
                }`,
        variables: {
          googleDocId: "1fKb_rCcYeGxMiuJF0y0NYB3VWo1tSMIPrcNUCtXoQ2q",
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.fetchGoogleDocVersions).to.deep.include.members([
      {
        docId: "1fKb_rCcYeGxMiuJF0y0NYB3VWo1tSMIPrcNUCtXoQ2q",
        plainText: "hello, world!",
        lastChangedId: "123",
        chatLog: [
          {
            sender: "John Doe",
            message: "Hello, world!",
          },
        ],
        activity: "5ffdf1231ee2c62320b49e9f",
        intent: "intention",
        title: "Test Document",
        lastModifyingUser: "John Doe",
        modifiedTime: "2000-10-12T20:49:41.599Z",
      },
      {
        docId: "1fKb_rCcYeGxMiuJF0y0NYB3VWo1tSMIPrcNUCtXoQ2q",
        plainText: "hello, world! 2",
        lastChangedId: "123",
        chatLog: [
          {
            sender: "John Doe",
            message: "Hello, world!",
          },
        ],
        activity: "5ffdf1231ee2c62320b49e9f",
        intent: "intention",
        title: "Test Document",
        lastModifyingUser: "John Doe",
        modifiedTime: "2000-10-12T20:49:41.599Z",
      },
      {
        docId: "1fKb_rCcYeGxMiuJF0y0NYB3VWo1tSMIPrcNUCtXoQ2q",
        plainText: "hello, world! 3",
        lastChangedId: "123",
        chatLog: [
          {
            sender: "John Doe",
            message: "Hello, world!",
          },
        ],
        activity: "5ffdf1231ee2c62320b49e9f",
        intent: "intention",
        title: "Test Document",
        lastModifyingUser: "John Doe",
        modifiedTime: "2000-10-12T20:49:41.599Z",
      },
    ]);
  });
});
