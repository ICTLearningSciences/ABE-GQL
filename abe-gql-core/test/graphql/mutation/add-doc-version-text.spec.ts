/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/

import createApp, { appStart, appStop } from "../../../src/app";
import { expect } from "chai";
import { Express, response } from "express";
import { describe } from "mocha";
import mongoUnit from "mongo-unit";
import request from "supertest";
import { UserRole } from "../../../src/schemas/models/User";
import { getToken } from "../../helpers";

describe("add doc version text", () => {
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

  it(`can add doc version text`, async () => {
    const token = await getToken("5ffdf1231ee2c62320b49e99", UserRole.ADMIN); //user with role "ADMIN"
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation AddDocVersionText($versionId: String!, $docId: String!, $plainText: String!) {
          addOrUpdateDocVersionText(versionId: $versionId, docId: $docId, plainText: $plainText) {
                _id
                versionId
                docId
                plainText
                }
              
         }`,
        variables: {
          versionId: "5ffdf1231ee2c62320b49e9f",
          docId: "5ffdf1231ee2c62320b49e99",
          plainText: "test_new_activity_title",
        },
      });
    console.log(JSON.stringify(response.body, null, 2));
    expect(response.status).to.equal(200);
    expect(response.body.data.addOrUpdateDocVersionText.versionId).to.eql(
      "5ffdf1231ee2c62320b49e9f"
    );
    expect(response.body.data.addOrUpdateDocVersionText.docId).to.eql(
      "5ffdf1231ee2c62320b49e99"
    );
    expect(response.body.data.addOrUpdateDocVersionText.plainText).to.eql(
      "test_new_activity_title"
    );
  });
});
