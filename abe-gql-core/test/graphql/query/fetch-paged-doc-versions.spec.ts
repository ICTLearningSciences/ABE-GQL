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

  it(`can fetch doc version by docId filter`, async () => {
    const variables = {
      limit: 10,
      sortBy: "createdAt",
      sortAscending: true,
      filterObject: { _id: { $in: ["5ffdf1231ee2c62320b49ea8"] } },
    };
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `query DocVersions($limit: Int, $filterObject: Object, $sortAscending: Boolean, $sortBy: String) {
                docVersions(limit: $limit, filterObject: $filterObject, sortAscending: $sortAscending, sortBy: $sortBy) {
                      edges {
                        node{
                            _id
                            docId
                            plainText
                            lastChangedId
                            sessionId
                            chatLog {
                              sender
                              message
                            }
                            activity
                            intent
                            title
                            lastModifyingUser
                            modifiedTime
                            createdAt
                        }
                    }
                    }
                }`,
        variables: variables,
      });
    expect(response.status).to.equal(200);
    expect(
      response.body.data.docVersions.edges.map((e: any) => e.node)
    ).to.deep.include.members([
      {
        _id: "5ffdf1231ee2c62320b49ea8",
        docId: "1K-JFihjdDHmKqATZpsGuIjcCwp-OJHWcfAAzVZP0vFc",
        plainText: "hello, world! 5",
        lastChangedId: "123",
        sessionId: "session-id-5",
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
        createdAt: "2000-10-12T20:49:41.599Z",
      },
    ]);
  });

  it(`can fetch most recent doc version by createdAt`, async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `query DocVersions($limit: Int, $filter: String, $sortBy: String, $sortAscending: Boolean) {
                docVersions(limit: $limit, filter: $filter, sortBy: $sortBy, sortAscending: $sortAscending) {
                      edges {
                        node{
                            docId
                            plainText
                            lastChangedId
                            sessionId
                            sessionIntention {
                              description
                              createdAt
                            }
                            documentIntention {
                              description
                              createdAt
                            }
                            dayIntention {
                              description
                              createdAt
                            }
                            chatLog {
                              sender
                              message
                            }
                            activity
                            intent
                            title
                            lastModifyingUser
                            modifiedTime
                            createdAt
                        }
                    }
                    }
                }`,
        variables: {
          limit: 1,
          sortBy: "createdAt",
          sortAscending: false,
          filter: JSON.stringify({
            docId: "1fKb_rCcYeGxMiuJF0y0NYB3VWo1tSMIPrcNUCtXoQ2q",
          }),
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.docVersions.edges.map((e: any) => e.node)).to.eql(
      [
        {
          docId: "1fKb_rCcYeGxMiuJF0y0NYB3VWo1tSMIPrcNUCtXoQ2q",
          plainText: "hello, world! 3",
          lastChangedId: "123",
          sessionId: "session-id-3",
          sessionIntention: {
            description: "test-intention",
            createdAt: "2000-10-12T20:49:41.599Z",
          },
          documentIntention: {
            description: "test-document-intention",
            createdAt: "2000-10-12T20:49:41.599Z",
          },
          dayIntention: {
            description: "test-day-intention",
            createdAt: "2000-10-12T20:49:41.599Z",
          },
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
          createdAt: "2003-10-12T20:49:41.599Z",
        },
      ]
    );
  });

  it(`can fetch oldest doc version by createdAt`, async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `query DocVersions($limit: Int, $filter: String, $sortBy: String, $sortAscending: Boolean) {
                docVersions(limit: $limit, filter: $filter, sortBy: $sortBy, sortAscending: $sortAscending) {
                      edges {
                        node{
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
                            createdAt
                        }
                    }
                    }
                }`,
        variables: {
          limit: 1,
          sortBy: "createdAt",
          sortAscending: true,
          filter: JSON.stringify({
            docId: "1fKb_rCcYeGxMiuJF0y0NYB3VWo1tSMIPrcNUCtXoQ2q",
          }),
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.docVersions.edges.map((e: any) => e.node)).to.eql(
      [
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
          createdAt: "2001-10-12T20:49:41.599Z",
        },
      ]
    );
  });
});
