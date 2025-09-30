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
import { UserRole } from "../../../src/schemas/types/types";
import { getToken } from "../../helpers";
import GoogleDocModel from "../../../src/schemas/models/GoogleDoc";

describe("add or update google doc", () => {
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

  it(`can set archived for google doc`, async () => {
    const before = await GoogleDocModel.findOne({
      googleDocId: "test_google_doc_id",
    });
    expect(before).to.exist;
    expect(before?.archived).to.be.false;
    expect(before?.assignmentDescription).to.be.equal(
      "test-assignment-description"
    );
    const token = await getToken("5ffdf1231ee2c62320b49e99", UserRole.ADMIN); //user with role "ADMIN"
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateGoogleDoc($googleDoc: GoogleDocInputType!) {
          addOrUpdateDoc(googleDoc: $googleDoc) {
            assignmentDescription
            archived
          }
         }`,
        variables: {
          googleDoc: {
            googleDocId: "test_google_doc_id",
            user: "5ffdf1231ee2c62320b49e99",
            archived: true,
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.addOrUpdateDoc.archived).to.be.true;
    expect(response.body.data.addOrUpdateDoc.assignmentDescription).to.be.equal(
      "test-assignment-description"
    );
    const after = await GoogleDocModel.findOne({
      googleDocId: "test_google_doc_id",
    });
    expect(after).to.exist;
    expect(after?.archived).to.be.true;
    expect(after?.assignmentDescription).to.be.equal(
      "test-assignment-description"
    );
  });
});
