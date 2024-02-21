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

describe("configUpdate", () => {
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

  it(`throws an error if no config`, async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `mutation ConfigUpdate($config: ConfigUpdateInputType!) {
            configUpdate(config: $config) {
              openaiSystemPrompt
            }
        }`,
        variables: {},
      });
    expect(response.status).to.not.equal(200);
  });

  it("can update config", async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `mutation ConfigUpdate($config: ConfigUpdateInputType!) {
          configUpdate(config: $config) {
            openaiSystemPrompt
          }
      }`,
        variables: {
          config: {
            openaiSystemPrompt: ["Hello, world!"],
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.configUpdate).to.eql({
      openaiSystemPrompt: ["Hello, world!"],
    });
  });

  it.skip("does not accept USER", async () => {
    const token = getToken("5ffdf41a1ee2c62320b49ea2"); //mentor with role "User"
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation ConfigUpdate($config: ConfigUpdateInputType!) {
          configUpdate(config: $config) {
            openaiSystemPrompt
          }
      }`,
        variables: { config: {} },
      });
    expect(response.status).to.equal(200);
    expect(response.body.errors[0].message).to.equal(
      "you do not have permission to edit config"
    );
  });

  it.skip("CONTENT_MANAGER can update config", async () => {
    const token = getToken("5ffdf41a1ee2c62320b49ea5"); //mentor with role "Content Manager"
    let response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation ConfigUpdate($config: ConfigUpdateInputType!) {
          configUpdate(config: $config) {
            openaiSystemPrompt
          }
      }`,
        variables: {
          config: {
            openaiSystemPrompt: ["Hello, world!"],
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.configUpdate).to.eql({
      openaiSystemPrompt: ["Hello, world!"],
    });
  });

  it.skip("ADMIN can update config", async () => {
    const token = getToken("5ffdf41a1ee2c62320b49ea1"); //mentor with role "Admin"
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation ConfigUpdate($config: ConfigUpdateInputType!) {
          configUpdate(config: $config) {
            openaiSystemPrompt
          }
      }`,
        variables: {
          config: {
            featuredMentors: ["5ffdf41a1ee2c62111111119"],
            featuredMentorPanels: ["5ffdf41a1ee2c62111111111"],
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.me.configUpdate).to.eql({
      activeMentors: [],
      featuredMentorPanels: ["5ffdf41a1ee2c62111111111"],
      featuredMentors: ["5ffdf41a1ee2c62111111119"],
      mentorsDefault: [],
    });
  });
});
