/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import createApp, { appStart, appStop } from "app";
import { expect } from "chai";
import { Express } from "express";
import mongoUnit from "mongo-unit";
import request from "supertest";
import { getToken } from "../../helpers";
import OrganizationModel from "../../../src/schemas/models/Organization";
import ConfigModel from "../../../src/schemas/models/Config";
import { UserRole } from "../../../src/schemas/models/User";

describe("config update by key", () => {
  let app: Express;

  beforeEach(async () => {
    await mongoUnit.load(require("test/fixtures/mongodb/data-default.js"));
    app = await createApp();
    await appStart();
  });

  afterEach(async () => {
    await appStop();
    await mongoUnit.drop();
  });

  it("USER cannot update config", async () => {
    const token = await getToken("5ffdf1231ee2c62320b49e99", UserRole.USER); //user with role "USER"
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation ConfigUpdateByKey($key: String!, $value: AnythingScalarType!) {
            configUpdateByKey(key: $key, value: $value) {
            aiSystemPrompt
          }
      }`,
        variables: {
          key: "aiSystemPrompt",
          value: ["Hello, world!"],
        },
      });
    expect(response.status).to.equal(400);
    expect(
      response.body.errors.find((e: any) =>
        e.message.includes("Cannot query field")
      )
    ).to.exist;
  });

  it("updates subdomain config, not global", async () => {
    const globalConfigBeforeUpdate = await ConfigModel.getConfig();
    const orgBeforeUpdate = await OrganizationModel.findOne({
      subdomain: "army",
    });
    const orgSystemPromptsBeforeUpdate = orgBeforeUpdate?.customConfig.find(
      (c) => c.key === "aiSystemPrompt"
    )?.value;

    expect(globalConfigBeforeUpdate.aiSystemPrompt).to.eql([]);
    expect(orgSystemPromptsBeforeUpdate).to.eql(["army system prompt"]);

    const token = await getToken("5ffdf1231ee2c62320b49a99", UserRole.ADMIN); //user with role "ADMIN"
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .set("origin", "https://army.abewriting.org")
      .send({
        query: `mutation ConfigUpdateByKey($key: String!, $value: AnythingScalarType!) {
            configUpdateByKey(key: $key, value: $value) {
            aiSystemPrompt
          }
      }`,
        variables: {
          key: "aiSystemPrompt",
          value: ["Hello, world!"],
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.configUpdateByKey).to.eql({
      aiSystemPrompt: ["Hello, world!"],
    });

    const globalConfigAfterUpdate = await ConfigModel.getConfig();
    const orgAfterUpdate = await OrganizationModel.findOne({
      subdomain: "army",
    });
    const orgSystemPromptsAfterUpdate = orgAfterUpdate?.customConfig.find(
      (c) => c.key === "aiSystemPrompt"
    )?.value;

    expect(globalConfigAfterUpdate.aiSystemPrompt).to.eql([]);
    expect(orgSystemPromptsAfterUpdate).to.eql(["Hello, world!"]);
  });
});
