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
import { UserRole } from "../../../src/schemas/models/User";
import { getToken } from "../../helpers";

describe("add or update activity", () => {
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

  it(`can update existing activity`, async () => {
    const token = await getToken("5ffdf1231ee2c62320b49e99", UserRole.ADMIN); //user with role "ADMIN"
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateActivity($activity: ActivityInputType!) {
          addOrUpdateActivity(activity: $activity) {
                _id
                title
                description
                steps{
                  messages{
                    _id
                    text
                  }
                }
              }
         }`,
        variables: {
          activity: {
            _id: "5ffdf1231ee2c62320b49e9f",
            title: "test_new_activity_title",
            steps: [
              {
                messages: [
                  {
                    _id: "5ffdf1231ee2c62320b49e4e",
                    text: "message 1",
                  },
                  {
                    _id: "5ffdf1231ee2c62320b49d4e",
                    text: "message 2",
                  },
                ],
              },
            ],
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.addOrUpdateActivity).to.eql({
      _id: "5ffdf1231ee2c62320b49e9f",
      title: "test_new_activity_title",
      description: "activity_description_test",
      steps: [
        {
          messages: [
            {
              _id: "5ffdf1231ee2c62320b49e4e",
              text: "message 1",
            },
            {
              _id: "5ffdf1231ee2c62320b49d4e",
              text: "message 2",
            },
          ],
        },
      ],
    });
  });
});
