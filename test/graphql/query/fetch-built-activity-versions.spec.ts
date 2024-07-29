/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import createApp, { appStart, appStop } from "app";
import { expect } from "chai";
import { Express } from "express";
import { describe } from "mocha";
import mongoUnit from "mongo-unit";
import request from "supertest";
import { fullBuiltActivityQueryData } from "../mutation/add-or-update-built-activity.spec";

export const fetchActivityVersionsQueryData = `
    activity{
    ${fullBuiltActivityQueryData}
    }
    versionTime
`;

describe("fetch built activity Versiopns", () => {
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

  it(`can fetch built activity versions`, async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `query FetchBuiltActivityVersions($limit: Int, $filter: String, $sortAscending: Boolean, $sortBy: String){
            fetchBuiltActivityVersions(limit: $limit, filter: $filter, sortAscending: $sortAscending, sortBy: $sortBy) {
                        edges{
                            node{
                                ${fetchActivityVersionsQueryData}
                            }
                        }
                    }
        }`,
        variables: {
          limit: 10,
          filter: JSON.stringify({
            "activity.clientId": "built-activity-verions",
          }),
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.fetchBuiltActivityVersions.edges).to.have.length(
      1
    );
    delete response.body.data.fetchBuiltActivityVersions.edges[0].node
      .versionTime;
    expect(
      response.body.data.fetchBuiltActivityVersions.edges
    ).to.deep.include.members([
      {
        node: {
          activity: {
            _id: "5ffdf1231ee2c62320c49e2f",
            clientId: "built-activity-verions",
            title: "Private activity",
            user: "5ffdf1231ee2c62320b49e99",
            visibility: "private",
            activityType: "builder",
            description: "",
            displayIcon: "DEFAULT",
            disabled: null,
            newDocRecommend: null,
            flowsList: [],
          },
        },
      },
    ]);
  });
});
