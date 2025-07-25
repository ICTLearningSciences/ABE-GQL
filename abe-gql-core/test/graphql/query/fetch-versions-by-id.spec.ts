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
  IGDocVersion,
  VersionType,
} from "../../../src/schemas/models/GoogleDocVersion";
import { dateNMinutesInFuture } from "../../../src/helpers";

export const fetchVersionsByIdQuery = `
query FetchVersionsById($ids: [String!]!) {
  fetchVersionsById(ids: $ids) {
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
    sessionId
    sessionIntention {
      description
    }
    documentIntention {
      description
    }
    dayIntention {
      description
    }
    versionType
  }
}
`;

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

  it(`returns an empty array if no ids are provided`, async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: fetchVersionsByIdQuery,
        variables: {
          ids: [],
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.fetchVersionsById).to.deep.equal([]);
  });

  it(`hydrates session with single snapshot`, async () => {
    const date = new Date();
    const snapshotVersion: Partial<IGDocVersion> = {
      _id: "5ffdf1231ee2c62320b49aaa",
      docId: "doc_1",
      plainText: "plainText",
      markdownText: "markdownText",
      lastChangedId: "1",
      chatLog: [],
      activity: "activity",
      intent: "intent",
      title: "title",
      lastModifyingUser: "lastModifyingUser",
      modifiedTime: date,
      versionType: VersionType.SNAPSHOT,
      sessionId: "session_1",
      sessionIntention: { description: "sessionIntention" },
      documentIntention: { description: "documentIntention" },
      dayIntention: { description: "dayIntention" },
      createdAt: date,
      updatedAt: date,
    };
    const deltaVersion1: Partial<IGDocVersion> = {
      _id: "5ffdf1231ee2c62320b49aab",
      docId: "doc_1",
      versionType: VersionType.DELTA,
      title: "title2",
      sessionId: "session_1",
      createdAt: dateNMinutesInFuture(1),
    };
    const deltaVersion2: Partial<IGDocVersion> = {
      _id: "5ffdf1231ee2c62320b49aac",
      docId: "doc_1",
      versionType: VersionType.DELTA,
      activity: "activity2",
      sessionId: "session_1",
      createdAt: dateNMinutesInFuture(2),
    };
    const docVersions: Partial<IGDocVersion>[] = [
      snapshotVersion,
      deltaVersion1,
      deltaVersion2,
    ];
    await GDocVersionModel.deleteMany({});
    await GDocVersionModel.insertMany(docVersions as IGDocVersion[]);
    const response = await request(app)
      .post("/graphql")
      .send({
        query: fetchVersionsByIdQuery,
        variables: {
          ids: ["5ffdf1231ee2c62320b49aac", "5ffdf1231ee2c62320b49aab"],
        },
      });
    expect(response.status).to.equal(200);
    delete snapshotVersion.createdAt;
    delete snapshotVersion.updatedAt;
    delete deltaVersion1.createdAt;
    delete deltaVersion2.createdAt;
    expect(response.body.data.fetchVersionsById).to.deep.include.members([
      {
        ...snapshotVersion,
        ...deltaVersion1,
        modifiedTime: date.toISOString(),
      },
      {
        ...snapshotVersion,
        ...deltaVersion1,
        ...deltaVersion2,
        modifiedTime: date.toISOString(),
      },
    ]);
  });

  it("hydrates session with multiple snapshots", async () => {
    const date = new Date();
    const snapshotVersion1: Partial<IGDocVersion> = {
      _id: "5ffdf1231ee2c62320b49aaa",
      docId: "doc_1",
      plainText: "plainText",
      markdownText: "markdownText",
      lastChangedId: "1",
      chatLog: [],
      activity: "activity snapshot 1",
      intent: "intent snapshot 1",
      title: "title snapshot 1",
      lastModifyingUser: "lastModifyingUser",
      modifiedTime: date,
      versionType: VersionType.SNAPSHOT,
      sessionId: "session_1",
      sessionIntention: { description: "sessionIntention" },
      documentIntention: { description: "documentIntention" },
      dayIntention: { description: "dayIntention" },
      createdAt: date,
      updatedAt: date,
    };
    const deltaVersion1: Partial<IGDocVersion> = {
      _id: "5ffdf1231ee2c62320b49aab",
      docId: "doc_1",
      versionType: VersionType.DELTA,
      title: "title delta 1",
      sessionId: "session_1",
      createdAt: dateNMinutesInFuture(1),
    };
    const snapshotVersion2: Partial<IGDocVersion> = {
      _id: "5ffdf1231ee2c62320b49aac",
      docId: "doc_1",
      plainText: "plainText",
      markdownText: "markdownText",
      lastChangedId: "1",
      chatLog: [],
      activity: "activity snapshot 2",
      intent: "intent snapshot 2",
      title: "title snapshot 2",
      lastModifyingUser: "lastModifyingUser",
      modifiedTime: date,
      versionType: VersionType.SNAPSHOT,
      sessionId: "session_1",
      sessionIntention: { description: "sessionIntention" },
      documentIntention: { description: "documentIntention" },
      dayIntention: { description: "dayIntention" },
      createdAt: dateNMinutesInFuture(2),
      updatedAt: dateNMinutesInFuture(2),
    };
    const deltaVersion2: Partial<IGDocVersion> = {
      _id: "5ffdf1231ee2c62320b49aad",
      docId: "doc_1",
      versionType: VersionType.DELTA,
      activity: "activity delta 2",
      sessionId: "session_1",
      createdAt: dateNMinutesInFuture(3),
    };
    const docVersions: Partial<IGDocVersion>[] = [
      snapshotVersion1,
      deltaVersion1,
      snapshotVersion2,
      deltaVersion2,
    ];
    await GDocVersionModel.deleteMany({});
    await GDocVersionModel.insertMany(docVersions as IGDocVersion[]);
    const response = await request(app)
      .post("/graphql")
      .send({
        query: fetchVersionsByIdQuery,
        variables: {
          ids: ["5ffdf1231ee2c62320b49aab", "5ffdf1231ee2c62320b49aad"],
        },
      });
    expect(response.status).to.equal(200);
    delete snapshotVersion1.createdAt;
    delete snapshotVersion1.updatedAt;
    delete deltaVersion1.createdAt;
    delete deltaVersion2.createdAt;
    delete snapshotVersion2.createdAt;
    delete snapshotVersion2.updatedAt;
    expect(response.body.data.fetchVersionsById).to.deep.include.members([
      {
        ...snapshotVersion1,
        ...deltaVersion1,
        modifiedTime: date.toISOString(),
      },
      {
        ...snapshotVersion2,
        ...deltaVersion2,
        modifiedTime: date.toISOString(),
      },
    ]);
  });
});
