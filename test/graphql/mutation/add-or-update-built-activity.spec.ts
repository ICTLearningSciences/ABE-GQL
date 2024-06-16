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
import { ActivityBuilderStepType } from "../../../src/schemas/models/BuiltActivity/types";

describe("update built activity", () => {
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
    const stepsData = [
      {
        stepType: ActivityBuilderStepType.SYSTEM_MESSAGE,
        message: "message 1",
      },
      {
        stepType: ActivityBuilderStepType.REQUEST_USER_INPUT,
        message: "message 2",
      },
      {
        stepType: ActivityBuilderStepType.PROMPT,
        promptText: "prompt 1",
      },
    ];
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `mutation AddOrUpdateBuiltActivity($activity: BuiltActivityInputType!) {
          addOrUpdateBuiltActivity(activity: $activity) {
                        steps{
                            ... on SystemMessageActivityStepType {
                                stepType
                                message
                            }

                            ... on RequestUserInputActivityStepType {
                                stepType
                                message
                            }

                            ... on PromptActivityStepType{
                                stepType
                                promptText
                            }
                        }
              }
         }`,
        variables: {
          activity: {
            _id: "5ffdf1231ee2c62320b49e1f",
            steps: stepsData,
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.addOrUpdateBuiltActivity).to.eql({
      steps: stepsData,
    });
  });
});
