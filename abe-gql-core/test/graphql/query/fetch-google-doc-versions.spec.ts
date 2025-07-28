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
import GDocVersionModel, {
  VersionType,
} from "../../../src/schemas/models/GoogleDocVersion";
import { dateNMinutesInPast } from "../../../src/helpers";
import TextDiffCreate from "textdiff-create";

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
                      markdownText
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
                      _id
                    docId
                      plainText
                      markdownText
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
        _id: "5ffdf1231ee2c62320b49ea1",
        docId: "1fKb_rCcYeGxMiuJF0y0NYB3VWo1tSMIPrcNUCtXoQ2q",
        plainText: "hello, world!",
        markdownText: "# hello, world!",
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
        _id: "5ffdf1231ee2c62320b49ea2",
        docId: "1fKb_rCcYeGxMiuJF0y0NYB3VWo1tSMIPrcNUCtXoQ2q",
        plainText: "hello, world! 2",
        markdownText: "# hello, world! 2",
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
        _id: "5ffdf1231ee2c62320b49ea3",
        docId: "1fKb_rCcYeGxMiuJF0y0NYB3VWo1tSMIPrcNUCtXoQ2q",
        plainText: "hello, world! 3",
        markdownText: "# hello, world! 3",
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

  it(`properly hydrates plainText from deltas with plainTextDelta`, async () => {
    const sessionId = "test-hydration-session";
    const docId = "test-hydration-doc";

    // Clear any existing data for this session
    await GDocVersionModel.deleteMany({ sessionId });

    // Create a snapshot version
    const snapshotData = {
      _id: "607f1f77bcf86cd799439011",
      docId,
      sessionId,
      plainText: "Initial snapshot text",
      markdownText: "# Initial snapshot text",
      lastChangedId: "snap123",
      chatLog: [
        {
          sender: "USER",
          message: "Snapshot message",
        },
      ],
      activity: "snapshot activity",
      intent: "snapshot intent",
      title: "Snapshot Title",
      lastModifyingUser: "John Doe",
      modifiedTime: "2000-10-12T20:49:41.599Z",
      versionType: VersionType.SNAPSHOT,
      createdAt: dateNMinutesInPast(10),
    };

    await GDocVersionModel.create(snapshotData);

    // Create a delta version with plainTextDelta (no plainText)
    const updatedText = "Initial snapshot text with delta changes";
    const diff = TextDiffCreate(snapshotData.plainText, updatedText);

    const deltaData = {
      _id: "607f1f77bcf86cd799439012",
      docId,
      sessionId,
      plainTextDelta: JSON.stringify(diff), // Store the diff, not the full text
      markdownText: "# Initial snapshot text with delta changes",
      lastChangedId: "delta456",
      versionType: VersionType.DELTA,
      createdAt: dateNMinutesInPast(5),
    };

    await GDocVersionModel.create(deltaData);

    // Fetch the versions and verify hydration
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `query FetchGoogleDocVersions($googleDocId: String!) {
                    fetchGoogleDocVersions(googleDocId: $googleDocId) {
                      _id
                      docId
                      plainText
                      markdownText
                      versionType
                      sessionId
                    }
                }`,
        variables: {
          googleDocId: docId,
        },
      });

    expect(response.status).to.equal(200);
    const versions = response.body.data.fetchGoogleDocVersions;

    // Find the delta version in the response
    const hydratedDelta = versions.find(
      (v: any) => v._id === "607f1f77bcf86cd799439012"
    );
    expect(hydratedDelta).to.not.be.undefined;

    // Verify that the delta version now has the correct hydrated plainText
    expect(hydratedDelta.plainText).to.equal(updatedText);
    expect(hydratedDelta.versionType).to.equal(VersionType.DELTA);
  });

  it(`hydrates multiple deltas in sequence correctly`, async () => {
    const sessionId = "test-multi-delta-session";
    const docId = "test-multi-delta-doc";

    // Clear any existing data for this session
    await GDocVersionModel.deleteMany({ sessionId });

    const baseText = "Base text for testing";
    const firstDeltaText = "Base text for testing with first change";
    const secondDeltaText =
      "Base text for testing with first change and second change";

    // Create snapshot
    const snapshotData = {
      _id: "607f1f77bcf86cd799439021",
      docId,
      sessionId,
      plainText: baseText,
      markdownText: `# ${baseText}`,
      lastChangedId: "snap123",
      chatLog: [
        {
          sender: "USER",
          message: "Base message",
        },
      ],
      activity: "base activity",
      intent: "base intent",
      title: "Base Title",
      lastModifyingUser: "John Doe",
      modifiedTime: "2000-10-12T20:49:41.599Z",
      versionType: VersionType.SNAPSHOT,
      createdAt: dateNMinutesInPast(15),
    };

    await GDocVersionModel.create(snapshotData);

    // Create first delta
    const firstDiff = TextDiffCreate(baseText, firstDeltaText);
    const firstDeltaData = {
      _id: "607f1f77bcf86cd799439022",
      docId,
      sessionId,
      plainTextDelta: JSON.stringify(firstDiff),
      markdownText: `# ${firstDeltaText}`,
      lastChangedId: "delta1",
      versionType: VersionType.DELTA,
      createdAt: dateNMinutesInPast(10),
    };

    await GDocVersionModel.create(firstDeltaData);

    // Create second delta (based on first delta result)
    const secondDiff = TextDiffCreate(firstDeltaText, secondDeltaText);
    const secondDeltaData = {
      _id: "607f1f77bcf86cd799439023",
      docId,
      sessionId,
      plainTextDelta: JSON.stringify(secondDiff),
      markdownText: `# ${secondDeltaText}`,
      lastChangedId: "delta2",
      versionType: VersionType.DELTA,
      createdAt: dateNMinutesInPast(5),
    };

    await GDocVersionModel.create(secondDeltaData);

    // Fetch and verify hydration
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `query FetchGoogleDocVersions($googleDocId: String!) {
                    fetchGoogleDocVersions(googleDocId: $googleDocId) {
                      _id
                      plainText
                      versionType
                      createdAt
                    }
                }`,
        variables: {
          googleDocId: docId,
        },
      });

    expect(response.status).to.equal(200);
    const versions = response.body.data.fetchGoogleDocVersions;

    // Sort by creation time to match expected order
    versions.sort(
      (a: any, b: any) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    expect(versions.length).to.equal(3);

    // Verify each version has the correct hydrated text
    expect(versions[0].plainText).to.equal(baseText); // snapshot
    expect(versions[1].plainText).to.equal(firstDeltaText); // first delta
    expect(versions[2].plainText).to.equal(secondDeltaText); // second delta
  });
});
