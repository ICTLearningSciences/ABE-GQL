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

describe("delete panel", () => {
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

  it("can delete a panel", async () => {
    await PanelModel.create({
      clientId: "test-panel-delete-1",
      panelName: "To Be Deleted",
      panelDescription: "This will be deleted",
      panelists: [],
    });

    const token = await getToken("5ffdf1231ee2c62320b49e99", UserRole.USER);
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation DeletePanel($panelClientId: String!) {
          deletePanel(panelClientId: $panelClientId) {
            clientId
            panelName
          }
         }`,
        variables: {
          panelClientId: "test-panel-delete-1",
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.deletePanel.clientId).to.equal(
      "test-panel-delete-1"
    );

    const deletedPanel = await PanelModel.findOne({
      clientId: "test-panel-delete-1",
    });
    expect(deletedPanel?.deleted).to.be.true;
  });

  it("rejects unauthenticated requests", async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `mutation DeletePanel($panelClientId: String!) {
          deletePanel(panelClientId: $panelClientId) {
            clientId
          }
         }`,
        variables: {
          panelClientId: "test-panel-delete-2",
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.errors).to.exist;
    expect(response.body.errors[0].message).to.include("unauthorized");
  });
});
