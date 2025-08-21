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
import { ObjectId } from "mongodb";
import GoogleDocModel from "../../../src/schemas/models/GoogleDoc";

export const findAllGoogleDocsQuery = `
query FindAllGoogleDocs($limit: Int, $filter: String, $filterObject: Object, $sortAscending: Boolean, $sortBy: String){
            findAllGoogleDocs(limit: $limit, filter: $filter, filterObject: $filterObject, sortAscending: $sortAscending, sortBy: $sortBy) {
            edges {
                node{
                    user
                    title
                    googleDocId
                    courseAssignmentId
                  }
                }
            }
        }
`;

describe("find all google docs", () => {
  let app: Express;

  let userId: string;
  let courseAssignmentId: string;
  beforeEach(async () => {
    await mongoUnit.load(require("test/fixtures/mongodb/data-default.js"));
    app = await createApp();
    await appStart();

    userId = new ObjectId().toString();
    courseAssignmentId = new ObjectId().toString();
    await GoogleDocModel.create({
      googleDocId: new ObjectId().toString(),
      user: userId,
      title: "Test Google Doc",
      courseAssignmentId: courseAssignmentId,
    });
  });

  afterEach(async () => {
    await appStop();
    await mongoUnit.drop();
  });

  it(`can find all google docs`, async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: findAllGoogleDocsQuery,
        variables: {
          filterObject: {
            user: userId,
            courseAssignmentId: courseAssignmentId,
          },
        },
      });
    console.log(JSON.stringify(response.body, null, 2));
    expect(response.status).to.equal(200);
    expect(response.body.data.findAllGoogleDocs.edges.length).to.equal(1);
    expect(response.body.data.findAllGoogleDocs.edges[0].node.user).to.equal(
      userId
    );
    expect(
      response.body.data.findAllGoogleDocs.edges[0].node.courseAssignmentId
    ).to.equal(courseAssignmentId);
  });
});
