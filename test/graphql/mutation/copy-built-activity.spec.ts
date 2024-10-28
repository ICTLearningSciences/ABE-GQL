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
import { ActivityBuilder } from "../../../src/schemas/models/BuiltActivity/types";
import BuiltActivityModel from "../../../src/schemas/models/BuiltActivity/BuiltActivity";
import { getToken } from "../../helpers";
import { UserRole } from "../../../src/schemas/models/User";

export const fullBuiltActivityQueryData = `
                      _id
                      clientId
                      title
                      user
                      visibility
                      activityType
                      description
                      displayIcon
                      disabled
                      newDocRecommend
                      flowsList{
                        clientId
                        name
                        steps{
                          ... on SystemMessageActivityStepType {
                              stepId
                              stepType
                              jumpToStepId
                              message
                          }

                          ... on RequestUserInputActivityStepType {
                              stepId
                              stepType
                              jumpToStepId
                              message
                              saveAsIntention
                              saveResponseVariableName
                              disableFreeInput
                              predefinedResponses{
                                  clientId
                                  message
                                  isArray
                                  jumpToStepId
                                  responseWeight
                              }
                          }

                          ... on PromptActivityStepType{
                              stepId
                              stepType
                              jumpToStepId
                              promptText
                              responseFormat
                              includeChatLogContext
                              includeEssay
                              outputDataType
                              jsonResponseData
                              customSystemRole
                          }

                          ... on ConditionalActivityStepType {
                              stepId
                              stepType
                              jumpToStepId
                              conditionals{
                                  stateDataKey
                                  checking
                                  operation
                                  expectedValue
                                  targetStepId
                              }
                          }
                      }
                      }
`;

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

  it("users can make a copy of an existing activity", async () => {
    const token = await getToken(
      "5ffdf1231ee2c62320b49a99",
      UserRole.CONTENT_MANAGER
    );
    const builtActivitesPre = await BuiltActivityModel.find();
    const prebuiltLength = builtActivitesPre.length;

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation CopyBuiltActivity($activityIdToCopy: String!) {
          copyBuiltActivity(activityIdToCopy: $activityIdToCopy) {
                ${fullBuiltActivityQueryData}
              }
         }`,
        variables: {
          activityIdToCopy: "5ffdf1231ee2c62320b49e2f",
        },
      });
    expect(response.status).to.equal(200);
    const createdActivity = response.body.data.copyBuiltActivity;
    expect(createdActivity.title).to.equal("Test AI Response Data");
    const builtActivitesPost = await BuiltActivityModel.find();
    expect(builtActivitesPost.length).to.equal(prebuiltLength + 1);
  });

  it("can update subfield of existing activity", async () => {
    const token = await getToken("5ffdf1231ee2c62320b49a99", UserRole.ADMIN);
    const preUpdate: ActivityBuilder | null = await BuiltActivityModel.findOne({
      _id: "5ffdf1231ee2c62320b49e2f",
    });
    expect(preUpdate).to.not.be.null;
    expect(preUpdate!.flowsList[0].steps.length).to.equal(5);
    expect(preUpdate!.description).to.not.equal("new description");

    const updateActivity = {
      _id: "5ffdf1231ee2c62320b49e2f",
      description: "new description",
    };
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateBuiltActivity($activity: BuiltActivityInputType!) {
        addOrUpdateBuiltActivity(activity: $activity) {
            ${fullBuiltActivityQueryData}
            }
       }`,
        variables: {
          activity: updateActivity,
        },
      });
    expect(response.status).to.equal(200);
    const postUpdate = await BuiltActivityModel.findOne({
      _id: "5ffdf1231ee2c62320b49e2f",
    });
    expect(postUpdate).to.not.be.null;
    expect(postUpdate!.description).to.equal("new description");
    expect(preUpdate!.flowsList[0].steps.length).to.equal(5);
  });

  it("admins can update other users activites", async () => {
    const token = await getToken("5ffdf1231ee2c62320b49a99", UserRole.ADMIN);
    const updateActivity = {
      _id: "5ffdf1231ee2c62320c49e2f",
      description: "new description",
    };
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateBuiltActivity($activity: BuiltActivityInputType!) {
        addOrUpdateBuiltActivity(activity: $activity) {
            ${fullBuiltActivityQueryData}
            }
       }`,
        variables: {
          activity: updateActivity,
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.addOrUpdateBuiltActivity.description).to.equal(
      "new description"
    );
  });
});
