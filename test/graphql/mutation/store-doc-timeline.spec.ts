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
import {
  DocTimeline,
  TimelinePointType,
} from "../../../src/schemas/models/DocTimeline";
import { Sender } from "../../../src/schemas/models/GoogleDocVersion";

describe("store doc timeline", () => {
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

  const newDocTimeline = {
    docId: "test_store_doc_timeline",
    user: "5ffdf1231ee2c62320b49e99",
    timelinePoints: [
      {
        type: TimelinePointType.START,
        time: "2021-01-12T00:00:00.000Z",
        document: {
          docId: "test_store_doc_timeline",
          plainText: "test",
          lastChangedId: "test",
          chatLog: [
            {
              sender: Sender.USER,
              message: "test",
            },
          ],
          activity: "test",
          intent: "test",
          title: "test",
          lastModifyingUser: "test",
        },
        intent: "test",
        changeSummary: "test",
        reverseOutline: "test",
        relatedFeedback: "test",
      },
    ],
  };

  it(`can store new doc timeline`, async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `mutation StoreDocTimeline($docTimeline: DocTimelineInputType!) {
            storeDocTimeline(docTimeline: $docTimeline) {
                docId
                user
                timelinePoints{
                    type
                    time
                    document{
                        docId
                        plainText
                        lastChangedId
                        chatLog{
                            sender
                            message
                        }
                        activity
                        intent
                        title
                        lastModifyingUser
                    }
                    intent
                    changeSummary
                    reverseOutline
                    relatedFeedback
                }
                }
            }`,
        variables: {
          docTimeline: newDocTimeline,
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.storeDocTimeline).to.eql(newDocTimeline);
  });

  it(`can update doc timeline`, async () => {
    const response0 = await request(app)
      .post("/graphql")
      .send({
        query: `query FetchDocTimeline($googleDocId: String!, $userId: String!) {
          fetchDocTimeline(googleDocId: $googleDocId, userId: $userId) {
              docId
              user
              timelinePoints{
                  type
                  time
                  document{
                      docId
                      plainText
                      lastChangedId
                      chatLog{
                          sender
                          message
                      }
                      activity
                      intent
                      title
                      lastModifyingUser
                  }
                  intent
                  changeSummary
                  reverseOutline
                  relatedFeedback
              }
              }
          }`,
        variables: {
          googleDocId: "doc_id",
          userId: "5ffdf1231ee2c62320b49e99",
        },
      });
    expect(response0.status).to.equal(200);
    expect(response0.body.data.fetchDocTimeline).to.deep.contain.members([
      {
        docId: "doc_id",
        user: "5ffdf1231ee2c62320b49e99",
        timelinePoints: [
          {
            time: "2021-01-12T00:00:00.000Z",
            type: TimelinePointType.START,
            document: {
              docId: "doc_od",
              plainText: "test",
              lastChangedId: "test",
              chatLog: [
                {
                  sender: "USER",
                  message: "test",
                },
              ],
              activity: "test",
              intent: "test",
              title: "test",
              lastModifyingUser: "test",
            },
            intent: "test",
            changeSummary: "test",
            reverseOutline: "test",
            relatedFeedback: "test",
          },
        ],
      },
    ]);

    const response = await request(app)
      .post("/graphql")
      .send({
        query: `mutation StoreDocTimeline($docTimeline: DocTimelineInputType!) {
            storeDocTimeline(docTimeline: $docTimeline) {
                docId
                user
                timelinePoints{
                    type
                    time
                    document{
                        docId
                        plainText
                        lastChangedId
                        chatLog{
                            sender
                            message
                        }
                        activity
                        intent
                        title
                        lastModifyingUser
                    }
                    intent
                    changeSummary
                    reverseOutline
                    relatedFeedback
                }
                }
            }`,
        variables: {
          docTimeline: {
            user: "5ffdf1231ee2c62320b49e99",
            docId: "doc_id",
            timelinePoints: [],
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.storeDocTimeline).to.eql({
      user: "5ffdf1231ee2c62320b49e99",
      docId: "doc_id",
      timelinePoints: [],
    });

    const response2 = await request(app)
      .post("/graphql")
      .send({
        query: `query FetchDocTimeline($googleDocId: String!, $userId: String!) {
          fetchDocTimeline(googleDocId: $googleDocId, userId: $userId) {
              docId
              user
              timelinePoints{
                  type
                  time
                  document{
                      docId
                      plainText
                      lastChangedId
                      chatLog{
                          sender
                          message
                      }
                      activity
                      intent
                      title
                      lastModifyingUser
                  }
                  intent
                  changeSummary
                  reverseOutline
                  relatedFeedback
              }
              }
          }`,
        variables: {
          googleDocId: "doc_id",
          userId: "5ffdf1231ee2c62320b49e99",
        },
      });
    expect(response2.status).to.equal(200);
    expect(response2.body.data.fetchDocTimeline).to.deep.contain.members([
      {
        user: "5ffdf1231ee2c62320b49e99",
        docId: "doc_id",
        timelinePoints: [],
      },
    ]);
  });
});
