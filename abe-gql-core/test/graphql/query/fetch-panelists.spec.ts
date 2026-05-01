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
import PanelistModel from "../../../src/schemas/models/Panelist";

export const fetchPanelistsQuery = `
query FetchPanelists($limit: Int, $filter: String, $filterObject: Object, $sortAscending: Boolean, $sortBy: String){
  fetchPanelists(limit: $limit, filter: $filter, filterObject: $filterObject, sortAscending: $sortAscending, sortBy: $sortBy) {
    edges {
      node {
        clientId
        panelistName
        panelistDescription
        promptSegment
        roleSegment
        profilePicture
        introductionMessage
        ragConfig {
          ragQuery
          topN
          filters
        }
      }
    }
  }
}
`;

describe("fetch panelists", () => {
  let app: Express;

  beforeEach(async () => {
    await mongoUnit.load(require("test/fixtures/mongodb/data-default.js"));
    app = await createApp();
    await appStart();

    await PanelistModel.create({
      clientId: "test-panelist-fetch-1",
      panelistName: "Expert 1",
      panelistDescription: "First expert",
      promptSegment: "Expert prompt 1",
      roleSegment: "Expert",
      ragConfig: {
        ragQuery: "What is the capital of France?",
        topN: 1,
        filters: { topic: "science" },
      },
    });

    await PanelistModel.create({
      clientId: "test-panelist-fetch-2",
      panelistName: "Expert 2",
      panelistDescription: "Second expert",
      promptSegment: "Expert prompt 2",
      roleSegment: "Consultant",
      ragConfig: {
        ragQuery: "What is the capital of France?",
        topN: 1,
        filters: { topic: "science" },
      },
    });
  });

  afterEach(async () => {
    await appStop();
    await mongoUnit.drop();
  });

  it("can fetch all panelists", async () => {
    const response = await request(app).post("/graphql").send({
      query: fetchPanelistsQuery,
      variables: {},
    });
    expect(response.status).to.equal(200);
    expect(response.body.data.fetchPanelists.edges.length).to.be.at.least(2);
  });

  it("can filter panelists by clientId", async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: fetchPanelistsQuery,
        variables: {
          filterObject: {
            clientId: "test-panelist-fetch-1",
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.fetchPanelists.edges.length).to.equal(1);
    expect(response.body.data.fetchPanelists.edges[0].node.clientId).to.equal(
      "test-panelist-fetch-1"
    );
    expect(
      response.body.data.fetchPanelists.edges[0].node.panelistName
    ).to.equal("Expert 1");
    expect(
      response.body.data.fetchPanelists.edges[0].node.ragConfig.ragQuery
    ).to.equal("What is the capital of France?");
    expect(
      response.body.data.fetchPanelists.edges[0].node.ragConfig.topN
    ).to.equal(1);
    expect(
      response.body.data.fetchPanelists.edges[0].node.ragConfig.filters.topic
    ).to.equal("science");
  });

  it("does not return deleted panelists", async () => {
    await PanelistModel.create({
      clientId: "test-panelist-deleted",
      panelistName: "Deleted Expert",
      deleted: true,
      ragConfig: {
        ragQuery: "What is the capital of France?",
        topN: 1,
        filters: { topic: "science" },
      },
    });

    const response = await request(app)
      .post("/graphql")
      .send({
        query: fetchPanelistsQuery,
        variables: {
          filterObject: {
            clientId: "test-panelist-deleted",
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.fetchPanelists.edges.length).to.equal(0);
  });
});
