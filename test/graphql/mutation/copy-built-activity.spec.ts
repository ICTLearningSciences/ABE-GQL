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
import { ActivityBuilder } from "../../../src/schemas/models/BuiltActivity/types";
import BuiltActivityModel from "../../../src/schemas/models/BuiltActivity/BuiltActivity";
import { getToken } from "../../helpers";
import { UserRole } from "../../../src/schemas/models/User";
import { fullBuiltActivityQueryData } from "../mutation/add-or-update-built-activity.spec";

describe("copy built activity", () => {
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

  it("users can make a copy of an existing activity", async () => {
    const token = await getToken(
      "5ffdf1231ee2c62320b49a99",
      UserRole.CONTENT_MANAGER
    );
    const builtActivitesPre = await BuiltActivityModel.find();
    const prebuiltLength = builtActivitesPre.length;

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation CopyBuiltActivity($activityIdToCopy: String!) {
          copyBuiltActivity(activityIdToCopy: $activityIdToCopy) {
                ${fullBuiltActivityQueryData}
              }
         }`,
        variables: {
          activityIdToCopy: "5ffdf1231ee2c62320b49e2f",
        },
      });
    expect(response.status).to.equal(200);
    const createdActivity = response.body.data.copyBuiltActivity;
    expect(createdActivity.title).to.equal("Test AI Response Data");
    const builtActivitesPost = await BuiltActivityModel.find();
    expect(builtActivitesPost.length).to.equal(prebuiltLength + 1);
  });
});
