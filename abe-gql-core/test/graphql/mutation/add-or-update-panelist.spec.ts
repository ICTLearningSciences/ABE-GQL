/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
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
import PanelistModel from "../../../src/schemas/models/Panelist";

describe("add or update panelist", () => {
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

  it("can create a new panelist", async () => {
    const token = await getToken("5ffdf1231ee2c62320b49e99", UserRole.USER);
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdatePanelist($panelist: PanelistInputType!) {
          addOrUpdatePanelist(panelist: $panelist) {
            clientId
            panelistName
            panelistDescription
            promptSegment
            roleSegment
            profilePicture
            introductionMessage
            ragConfig {
              includeRag
              ragMetadataFilter
            }
          }
         }`,
        variables: {
          panelist: {
            clientId: "test-panelist-1",
            panelistName: "Expert Panelist",
            panelistDescription: "An expert in the field",
            promptSegment: "You are an expert",
            roleSegment: "Expert",
            profilePicture: "https://example.com/pic.jpg",
            introductionMessage: "Hello, I'm an expert",
            ragConfig: {
              includeRag: true,
              ragMetadataFilter: { topic: "science" },
            },
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.addOrUpdatePanelist.clientId).to.equal(
      "test-panelist-1"
    );
    expect(response.body.data.addOrUpdatePanelist.panelistName).to.equal(
      "Expert Panelist"
    );
    expect(response.body.data.addOrUpdatePanelist.ragConfig.includeRag).to.be
      .true;
  });

  it("can update an existing panelist", async () => {
    const token = await getToken("5ffdf1231ee2c62320b49e99", UserRole.USER);

    await PanelistModel.create({
      clientId: "test-panelist-2",
      panelistName: "Original Name",
      panelistDescription: "Original Description",
    });

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdatePanelist($panelist: PanelistInputType!) {
          addOrUpdatePanelist(panelist: $panelist) {
            clientId
            panelistName
            panelistDescription
          }
         }`,
        variables: {
          panelist: {
            clientId: "test-panelist-2",
            panelistName: "Updated Name",
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.addOrUpdatePanelist.clientId).to.equal(
      "test-panelist-2"
    );
    expect(response.body.data.addOrUpdatePanelist.panelistName).to.equal(
      "Updated Name"
    );
    expect(response.body.data.addOrUpdatePanelist.panelistDescription).to.equal(
      "Original Description"
    );
  });

  it("rejects unauthenticated requests", async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `mutation AddOrUpdatePanelist($panelist: PanelistInputType!) {
          addOrUpdatePanelist(panelist: $panelist) {
            clientId
          }
         }`,
        variables: {
          panelist: {
            clientId: "test-panelist-3",
            panelistName: "Test Panelist",
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.errors).to.exist;
    expect(response.body.errors[0].message).to.include("unauthorized");
  });

  it("rejects request without clientId", async () => {
    const token = await getToken("5ffdf1231ee2c62320b49e99", UserRole.USER);
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdatePanelist($panelist: PanelistInputType!) {
          addOrUpdatePanelist(panelist: $panelist) {
            clientId
          }
         }`,
        variables: {
          panelist: {
            panelistName: "Test Panelist",
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.errors).to.exist;
    expect(response.body.errors[0].message).to.include("clientId is required");
  });
});
