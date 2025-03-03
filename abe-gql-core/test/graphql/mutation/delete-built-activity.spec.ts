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
import { getToken } from "../../helpers";
import { UserRole } from "../../../src/schemas/models/User";
import { fullBuiltActivityQueryData } from "../mutation/add-or-update-built-activity.spec";
import BuiltActivityModel from "../../../src/schemas/models/BuiltActivity/BuiltActivity";
describe("update built activity", () => {
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

  it("users cannot see delete built activity mutation", async () => {
    const token = await getToken("5ffdf1231ee2c62320b49a99", UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation DeleteBuiltActivity($activityIdToDelete: String!) {
          deleteBuiltActivity(activityIdToDelete: $activityIdToDelete) {
                ${fullBuiltActivityQueryData}
              }
         }`,
        variables: {
          activityIdToDelete: "5ffdf1231ee2c62320b49e2f",
        },
      });
    expect(response.status).to.equal(400);
    expect(
      response.body.errors.find((e: any) =>
        e.message.includes("Cannot query field")
      )
    ).to.exist;
  });

  it("content managers can delete their own built activities", async () => {
    const token = await getToken(
      "5ffdf1231ee2c62320b49a99",
      UserRole.CONTENT_MANAGER
    );

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation DeleteBuiltActivity($activityIdToDelete: String!) {
          deleteBuiltActivity(activityIdToDelete: $activityIdToDelete)
         }`,
        variables: {
          activityIdToDelete: "5ffdf1231ee2c62322c49e3f",
        },
      });
    expect(response.status).to.equal(200);
    const deletedActivity = response.body.data.deleteBuiltActivity;
    expect(deletedActivity).to.equal("5ffdf1231ee2c62322c49e3f");

    const builtActivities = await BuiltActivityModel.findById(
      "5ffdf1231ee2c62322c49e3f"
    );
    expect(builtActivities?.deleted).to.equal(true);
  });

  it("content managers cannot delete other users' built activities", async () => {
    const token = await getToken(
      "5ffdf1231ee2c62320b49a99",
      UserRole.CONTENT_MANAGER
    );

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation DeleteBuiltActivity($activityIdToDelete: String!) {
            deleteBuiltActivity(activityIdToDelete: $activityIdToDelete)
           }`,
        variables: {
          activityIdToDelete: "5ffdf1231ee2c62320c44e2f",
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.errors).to.exist;
    expect(response.body.errors[0].message).to.include("Error: unauthorized");
  });

  it("admins can delete other users' built activities", async () => {
    const token = await getToken("5ffdf1231ee2c62320b49a99", UserRole.ADMIN);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation DeleteBuiltActivity($activityIdToDelete: String!) {
            deleteBuiltActivity(activityIdToDelete: $activityIdToDelete)
           }`,
        variables: {
          activityIdToDelete: "5ffdf1231ee2c62320c44e2f",
        },
      });
    expect(response.status).to.equal(200);
    const deletedActivity = response.body.data.deleteBuiltActivity;
    expect(deletedActivity).to.equal("5ffdf1231ee2c62320c44e2f");

    const builtActivities = await BuiltActivityModel.findById(
      "5ffdf1231ee2c62320c44e2f"
    );
    expect(builtActivities?.deleted).to.equal(true);
  });
});
