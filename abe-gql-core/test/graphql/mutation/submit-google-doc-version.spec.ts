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
  DocVersionCurrentStateModel,
  VersionType,
} from "../../../src/schemas/models/GoogleDocVersion";
import { dateNMinutesInPast } from "../../../src/helpers";
import TextDiffCreate from "textdiff-create";

describe("submit google doc version", () => {
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

  it(`throws an error if google doc data was not provided`, async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `mutation SubmitGoogleDocVersion($googleDocData: GDocVersionInputType!) {
                    submitGoogleDocVersion(googleDocData: $googleDocData) {
                      docId
                      plainText
                      lastChangedId
                      chatLog {
                        sender
                        message
                        displayType
                        bulletPoints
                      }
                      activity
                      intent
                      title
                      lastModifyingUser
                      modifiedTime
                    }
                }`,
        variables: {
          googleDocData: null,
        },
      });
    expect(response.status).to.equal(500);
    expect(response.body).to.have.deep.nested.property("errors[0].message");
  });

  it(`creates snapshot version and currentState when no currentState exists`, async () => {
    const sessionId = "session-no-current-state";

    // Ensure no currentState exists for this session
    await DocVersionCurrentStateModel.deleteMany({ sessionId });

    const newGoogleDocData = {
      docId: "1fKb_rCcYeGxMiuJF0y0NYB3VWo1tSMIPrcNUCtXoQ2q",
      plainText: "hello, world!",
      markdownText: "# hello, world!",
      lastChangedId: "123",
      courseAssignmentId: "course-assignment-id",
      chatLog: [
        {
          sender: "USER",
          message: "hello, world!",
          displayType: "TEXT",
          bulletPoints: [] as string[],
        },
      ],
      sessionId,
      sessionIntention: {
        description: "intention",
      },
      documentIntention: {
        description: "document-intention",
      },
      dayIntention: {
        description: "day-intention",
      },
      activity: "activity",
      intent: "intent",
      title: "title",
      lastModifyingUser: "aaron",
      modifiedTime: "2000-10-12T20:49:41.599Z",
    };

    const response = await request(app)
      .post("/graphql")
      .send({
        query: `mutation SubmitGoogleDocVersion($googleDocData: GDocVersionInputType!) {
                    submitGoogleDocVersion(googleDocData: $googleDocData) {
                      docId
                      plainText
                      markdownText
                      versionType
                      courseAssignmentId
                    }
                }`,
        variables: {
          googleDocData: newGoogleDocData,
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.data.submitGoogleDocVersion.versionType).to.equal(
      VersionType.SNAPSHOT
    );

    // Verify currentState was created
    const currentState = await DocVersionCurrentStateModel.findOne({
      sessionId,
    });
    expect(currentState).to.not.be.null;
    expect(currentState!.versionType).to.equal(VersionType.SNAPSHOT);
    expect(currentState!.plainText).to.equal("hello, world!");

    const docVersion = await GDocVersionModel.findOne({ sessionId });
    expect(docVersion).to.not.be.null;
    expect(docVersion!.versionType).to.equal(VersionType.SNAPSHOT);
    expect(docVersion!.plainText).to.equal("hello, world!");
    expect(docVersion!.courseAssignmentId).to.equal("course-assignment-id");
  });

  it(`creates delta version when currentState exists`, async () => {
    const sessionId = "session-with-current-state";

    // Clear any existing data for this session
    await DocVersionCurrentStateModel.deleteMany({ sessionId });
    await GDocVersionModel.deleteMany({ sessionId });

    // Create initial currentState
    const initialData = {
      docId: "1fKb_rCcYeGxMiuJF0y0NYB3VWo1tSMIPrcNUCtXoQ2q",
      plainText: "initial text",
      markdownText: "# initial text",
      lastChangedId: "123",
      chatLog: [
        {
          sender: "USER",
          message: "initial message",
          displayType: "TEXT",
          bulletPoints: [] as string[],
        },
      ],
      sessionId,
      sessionIntention: {
        description: "initial intention",
      },
      documentIntention: {
        description: "initial document-intention",
      },
      dayIntention: {
        description: "initial day-intention",
      },
      activity: "initial activity",
      intent: "initial intent",
      title: "initial title",
      lastModifyingUser: "aaron",
      modifiedTime: "2000-10-12T20:49:41.599Z",
      versionType: VersionType.SNAPSHOT,
    };

    await DocVersionCurrentStateModel.create(initialData);
    // Submit updated data
    const updatedData = {
      ...initialData,
      plainText: "updated text",
      markdownText: "# updated text",
      lastChangedId: "456",
    };

    const response = await request(app)
      .post("/graphql")
      .send({
        query: `mutation SubmitGoogleDocVersion($googleDocData: GDocVersionInputType!) {
                    submitGoogleDocVersion(googleDocData: $googleDocData) {
                      docId
                      plainTextDelta
                      markdownTextDelta
                      versionType
                      lastChangedId
                    }
                }`,
        variables: {
          googleDocData: updatedData,
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.submitGoogleDocVersion.versionType).to.equal(
      VersionType.DELTA
    );
    expect(response.body.data.submitGoogleDocVersion.plainTextDelta).to.not.be
      .undefined;
    expect(response.body.data.submitGoogleDocVersion.markdownTextDelta).to.not
      .be.undefined;
    expect(response.body.data.submitGoogleDocVersion.lastChangedId).to.equal(
      "456"
    );

    // Verify currentState was updated
    const updatedCurrentState = await DocVersionCurrentStateModel.findOne({
      sessionId,
    });
    expect(updatedCurrentState).to.not.be.null;
    expect(updatedCurrentState!.plainText).to.equal("updated text");
    expect(updatedCurrentState!.versionType).to.equal(VersionType.SNAPSHOT);

    const docVersion = await GDocVersionModel.findOne({ sessionId });
    expect(docVersion).to.not.be.null;
    expect(docVersion!.versionType).to.equal(VersionType.DELTA);
    // Delta versions should NOT have plainText stored, only plainTextDelta
    expect(docVersion!.plainText).to.be.undefined;
    expect(docVersion!.plainTextDelta).to.not.be.undefined;
  });

  it(`delta versions store plainTextDelta instead of plainText`, async () => {
    const sessionId = "session-test-delta-storage";

    // Clear any existing data for this session
    await DocVersionCurrentStateModel.deleteMany({ sessionId });
    await GDocVersionModel.deleteMany({ sessionId });

    // Create initial currentState
    const initialData = {
      docId: "1fKb_rCcYeGxMiuJF0y0NYB3VWo1tSMIPrcNUCtXoQ2q",
      plainText: "Hello world",
      markdownText: "# Hello world",
      lastChangedId: "123",
      chatLog: [
        {
          sender: "USER",
          message: "initial message",
          displayType: "TEXT",
          bulletPoints: [] as string[],
        },
      ],
      sessionId,
      sessionIntention: {
        description: "initial intention",
      },
      documentIntention: {
        description: "initial document-intention",
      },
      dayIntention: {
        description: "initial day-intention",
      },
      activity: "initial activity",
      intent: "initial intent",
      title: "initial title",
      lastModifyingUser: "aaron",
      modifiedTime: "2000-10-12T20:49:41.599Z",
      versionType: VersionType.SNAPSHOT,
    };

    await DocVersionCurrentStateModel.create(initialData);

    // Submit updated data to create a delta
    const updatedData = {
      ...initialData,
      plainText: "Hello world updated",
      markdownText: "# Hello world updated",
      lastChangedId: "456",
    };

    const response = await request(app)
      .post("/graphql")
      .send({
        query: `mutation SubmitGoogleDocVersion($googleDocData: GDocVersionInputType!) {
                    submitGoogleDocVersion(googleDocData: $googleDocData) {
                      versionType
                      plainTextDelta
                      markdownTextDelta
                    }
                }`,
        variables: {
          googleDocData: updatedData,
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.data.submitGoogleDocVersion.versionType).to.equal(
      VersionType.DELTA
    );

    // Verify the delta was stored in the database
    const deltaVersion = await GDocVersionModel.findOne({
      sessionId,
      versionType: VersionType.DELTA,
    });
    expect(deltaVersion).to.not.be.null;

    // Delta should have plainTextDelta and markdownTextDelta but NO plainText or markdownText
    expect(deltaVersion!.plainTextDelta).to.not.be.undefined;
    expect(deltaVersion!.markdownTextDelta).to.not.be.undefined;
    expect(deltaVersion!.plainText).to.be.undefined;
    expect(deltaVersion!.markdownText).to.be.undefined;

    // Verify the plainTextDelta contains valid diff data
    const deltaData = JSON.parse(deltaVersion!.plainTextDelta);
    expect(Array.isArray(deltaData)).to.be.true;
    expect(deltaData.length).to.be.greaterThan(0);
    const diff = TextDiffCreate(initialData.plainText, updatedData.plainText);
    expect(diff).to.deep.equal(deltaData);

    // Verify the markdownTextDelta contains valid diff data
    const markdownDeltaData = JSON.parse(deltaVersion!.markdownTextDelta!);
    expect(Array.isArray(markdownDeltaData)).to.be.true;
    expect(markdownDeltaData.length).to.be.greaterThan(0);
    const markdownDiff = TextDiffCreate(
      initialData.markdownText,
      updatedData.markdownText
    );
    expect(markdownDiff).to.deep.equal(markdownDeltaData);
  });

  it(`creates proper delta when currentState exists with many previous deltas`, async () => {
    const sessionId = "session-with-many-deltas";

    // Clear any existing data for this session
    await DocVersionCurrentStateModel.deleteMany({ sessionId });
    await GDocVersionModel.deleteMany({ sessionId });

    // Create initial currentState
    const initialData = {
      docId: "1fKb_rCcYeGxMiuJF0y0NYB3VWo1tSMIPrcNUCtXoQ2q",
      plainText: "base text",
      markdownText: "# base text",
      lastChangedId: "100",
      chatLog: [
        {
          sender: "USER",
          message: "base message",
          displayType: "TEXT",
          bulletPoints: [] as string[],
        },
      ],
      sessionId,
      sessionIntention: {
        description: "base intention",
      },
      documentIntention: {
        description: "base document-intention",
      },
      dayIntention: {
        description: "base day-intention",
      },
      activity: "base activity",
      intent: "base intent",
      title: "base title",
      lastModifyingUser: "aaron",
      modifiedTime: "2000-10-12T20:49:41.599Z",
      versionType: VersionType.SNAPSHOT,
      createdAt: dateNMinutesInPast(5),
    };

    await DocVersionCurrentStateModel.create(initialData);

    // Create several delta versions to simulate existing deltas
    const delta1 = {
      docId: "1fKb_rCcYeGxMiuJF0y0NYB3VWo1tSMIPrcNUCtXoQ2q",
      sessionId,
      plainTextDelta: JSON.stringify(
        TextDiffCreate(initialData.plainText, "first delta text")
      ),
      markdownTextDelta: JSON.stringify(
        TextDiffCreate(initialData.markdownText, "# first delta text")
      ),
      versionType: VersionType.SNAPSHOT,
      createdAt: dateNMinutesInPast(4),
    };

    const delta2 = {
      docId: "1fKb_rCcYeGxMiuJF0y0NYB3VWo1tSMIPrcNUCtXoQ2q",
      sessionId,
      plainTextDelta: JSON.stringify(
        TextDiffCreate(initialData.plainText, "second delta text")
      ),
      markdownTextDelta: JSON.stringify(
        TextDiffCreate(initialData.markdownText, "# second delta text")
      ),
      lastChangedId: "200",
      versionType: VersionType.DELTA,
      createdAt: dateNMinutesInPast(3),
    };

    await GDocVersionModel.create(delta1);
    await GDocVersionModel.create(delta2);

    // Update currentState to reflect the accumulated changes
    await DocVersionCurrentStateModel.updateOne(
      { sessionId },
      {
        $set: {
          plainText: "second delta text",
          markdownText: "# second delta text",
          lastChangedId: "200",
        },
      }
    );

    // Now submit a new version that should create another delta
    const newVersionData = {
      docId: "1fKb_rCcYeGxMiuJF0y0NYB3VWo1tSMIPrcNUCtXoQ2q",
      plainText: "third delta text",
      markdownText: "# third delta text",
      lastChangedId: "300",
      chatLog: [
        {
          sender: "USER",
          message: "base message",
          displayType: "TEXT",
          bulletPoints: [] as string[],
        },
      ],
      sessionId,
      sessionIntention: {
        description: "base intention",
      },
      documentIntention: {
        description: "base document-intention",
      },
      dayIntention: {
        description: "base day-intention",
      },
      activity: "base activity",
      intent: "base intent",
      title: "base title",
      lastModifyingUser: "aaron",
      modifiedTime: "2000-10-12T20:49:41.599Z",
    };

    const response = await request(app)
      .post("/graphql")
      .send({
        query: `mutation SubmitGoogleDocVersion($googleDocData: GDocVersionInputType!) {
                    submitGoogleDocVersion(googleDocData: $googleDocData) {
                      docId
                      plainTextDelta
                      markdownTextDelta
                      versionType
                      lastChangedId
                    }
                }`,
        variables: {
          googleDocData: newVersionData,
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.data.submitGoogleDocVersion.versionType).to.equal(
      VersionType.DELTA
    );

    // Verify delta contains only the changed fields compared to current state
    expect(response.body.data.submitGoogleDocVersion.plainTextDelta).to.not.be
      .undefined;
    expect(response.body.data.submitGoogleDocVersion.markdownTextDelta).to.not
      .be.undefined;
    expect(response.body.data.submitGoogleDocVersion.lastChangedId).to.equal(
      "300"
    );

    // Verify currentState was updated to reflect new changes
    const finalCurrentState = await DocVersionCurrentStateModel.findOne({
      sessionId,
    });
    expect(finalCurrentState).to.not.be.null;
    expect(finalCurrentState!.plainText).to.equal("third delta text");
    expect(finalCurrentState!.lastChangedId).to.equal("300");
    expect(finalCurrentState!.versionType).to.equal(VersionType.SNAPSHOT);

    // Verify we have the correct number of versions in the database
    const allVersions = await GDocVersionModel.find({ sessionId });
    const sortedVersions = allVersions.sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    );
    expect(sortedVersions.length).to.equal(3);
    expect(sortedVersions[0].versionType).to.equal(VersionType.SNAPSHOT);
    expect(sortedVersions[1].versionType).to.equal(VersionType.DELTA);
    expect(sortedVersions[2].versionType).to.equal(VersionType.DELTA);

    // Verify delta versions don't store plainText or markdownText, only deltas
    expect(sortedVersions[1].plainText).to.be.undefined;
    expect(sortedVersions[1].markdownText).to.be.undefined;
    expect(sortedVersions[1].plainTextDelta).to.not.be.undefined;
    expect(sortedVersions[1].markdownTextDelta).to.not.be.undefined;
    expect(sortedVersions[2].plainText).to.be.undefined;
    expect(sortedVersions[2].markdownText).to.be.undefined;
    expect(sortedVersions[2].plainTextDelta).to.not.be.undefined;
    expect(sortedVersions[2].markdownTextDelta).to.not.be.undefined;
  });
});
