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
import PanelModel from "../../../src/schemas/models/Panel";
import PanelistModel from "../../../src/schemas/models/Panelist";

describe("add or update panel", () => {
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

  it("can create a new panel", async () => {
    const panelist1 = await PanelistModel.create({
      clientId: "panelist-1",
      panelistName: "Expert 1",
      ragConfig: {
        ragQuery: "What is the capital of France?",
        topN: 1,
        filters: { topic: "science" },
      },
    });
    const panelist2 = await PanelistModel.create({
      clientId: "panelist-2",
      panelistName: "Expert 2",
      ragConfig: {
        ragQuery: "What is the capital of France?",
        topN: 1,
        filters: { topic: "science" },
      },
    });

    const token = await getToken("5ffdf1231ee2c62320b49e99", UserRole.USER);
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdatePanel($panel: PanelInputType!) {
          addOrUpdatePanel(panel: $panel) {
            clientId
            panelName
            panelDescription
            panelists
          }
         }`,
        variables: {
          panel: {
            clientId: "test-panel-1",
            panelName: "Expert Panel",
            panelDescription: "A panel of experts",
            panelists: [panelist1._id.toString(), panelist2._id.toString()],
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.addOrUpdatePanel.clientId).to.equal(
      "test-panel-1"
    );
    expect(response.body.data.addOrUpdatePanel.panelName).to.equal(
      "Expert Panel"
    );
    expect(response.body.data.addOrUpdatePanel.panelists.length).to.equal(2);
  });

  it("can update an existing panel", async () => {
    const token = await getToken("5ffdf1231ee2c62320b49e99", UserRole.USER);

    await PanelModel.create({
      clientId: "test-panel-2",
      panelName: "Original Panel Name",
      panelDescription: "Original Description",
      panelists: [],
    });

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdatePanel($panel: PanelInputType!) {
          addOrUpdatePanel(panel: $panel) {
            clientId
            panelName
            panelDescription
          }
         }`,
        variables: {
          panel: {
            clientId: "test-panel-2",
            panelName: "Updated Panel Name",
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.addOrUpdatePanel.clientId).to.equal(
      "test-panel-2"
    );
    expect(response.body.data.addOrUpdatePanel.panelName).to.equal(
      "Updated Panel Name"
    );
    expect(response.body.data.addOrUpdatePanel.panelDescription).to.equal(
      "Original Description"
    );
  });

  it("rejects unauthenticated requests", async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `mutation AddOrUpdatePanel($panel: PanelInputType!) {
          addOrUpdatePanel(panel: $panel) {
            clientId
          }
         }`,
        variables: {
          panel: {
            clientId: "test-panel-3",
            panelName: "Test Panel",
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
        query: `mutation AddOrUpdatePanel($panel: PanelInputType!) {
          addOrUpdatePanel(panel: $panel) {
            clientId
          }
         }`,
        variables: {
          panel: {
            panelName: "Test Panel",
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.errors).to.exist;
    expect(response.body.errors[0].message).to.include("clientId is required");
  });
});
