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
import PanelModel from "../../../src/schemas/models/Panel";
import PanelistModel from "../../../src/schemas/models/Panelist";

export const fetchPanelsQuery = `
query FetchPanels($limit: Int, $filter: String, $filterObject: Object, $sortAscending: Boolean, $sortBy: String){
  fetchPanels(limit: $limit, filter: $filter, filterObject: $filterObject, sortAscending: $sortAscending, sortBy: $sortBy) {
    edges {
      node {
        clientId
        panelName
        panelDescription
        panelists
        ragConfig {
          includeRag
          ragMetadataFilter
        }
      }
    }
  }
}
`;

describe("fetch panels", () => {
  let app: Express;

  beforeEach(async () => {
    await mongoUnit.load(require("test/fixtures/mongodb/data-default.js"));
    app = await createApp();
    await appStart();

    const panelist1 = await PanelistModel.create({
      clientId: "panelist-for-panel-1",
      panelistName: "Expert A",
    });

    const panelist2 = await PanelistModel.create({
      clientId: "panelist-for-panel-2",
      panelistName: "Expert B",
    });

    await PanelModel.create({
      clientId: "test-panel-fetch-1",
      panelName: "Panel 1",
      panelDescription: "First panel",
      panelists: [panelist1._id],
      ragConfig: {
        includeRag: true,
        ragMetadataFilter: { topic: "AI" },
      },
    });

    await PanelModel.create({
      clientId: "test-panel-fetch-2",
      panelName: "Panel 2",
      panelDescription: "Second panel",
      panelists: [panelist2._id],
    });
  });

  afterEach(async () => {
    await appStop();
    await mongoUnit.drop();
  });

  it("can fetch all panels", async () => {
    const response = await request(app).post("/graphql").send({
      query: fetchPanelsQuery,
      variables: {},
    });
    expect(response.status).to.equal(200);
    expect(response.body.data.fetchPanels.edges.length).to.be.at.least(2);
  });

  it("can filter panels by clientId", async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: fetchPanelsQuery,
        variables: {
          filterObject: {
            clientId: "test-panel-fetch-1",
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.fetchPanels.edges.length).to.equal(1);
    expect(response.body.data.fetchPanels.edges[0].node.clientId).to.equal(
      "test-panel-fetch-1"
    );
    expect(response.body.data.fetchPanels.edges[0].node.panelName).to.equal(
      "Panel 1"
    );
    expect(response.body.data.fetchPanels.edges[0].node.ragConfig.includeRag).to
      .be.true;
    expect(
      response.body.data.fetchPanels.edges[0].node.panelists.length
    ).to.equal(1);
  });

  it("does not return deleted panels", async () => {
    await PanelModel.create({
      clientId: "test-panel-deleted",
      panelName: "Deleted Panel",
      deleted: true,
      panelists: [],
    });

    const response = await request(app)
      .post("/graphql")
      .send({
        query: fetchPanelsQuery,
        variables: {
          filterObject: {
            clientId: "test-panel-deleted",
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.fetchPanels.edges.length).to.equal(0);
  });
});
