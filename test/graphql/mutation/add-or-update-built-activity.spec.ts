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
import {
  ActivityBuilder,
  ActivityBuilderStepType,
} from "../../../src/schemas/models/BuiltActivity/types";
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

  it("unauthenticated user cannot see addOrUpdateBuiltActivity", async () => {
    const flowsListData = [
      {
        clientId: "5ffdf1231ea2c62320b49e1a",
        name: "flow 1",
        steps: [
          {
            stepType: ActivityBuilderStepType.SYSTEM_MESSAGE,
            message: "message 1",
          },
        ],
      },
    ];
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `mutation AddOrUpdateBuiltActivity($activity: BuiltActivityInputType!) {
        addOrUpdateBuiltActivity(activity: $activity) {
            ${fullBuiltActivityQueryData}
            }
       }`,
        variables: {
          activity: {
            _id: "5ffdf1231ee2c62320b49e1f",
            flowsList: flowsListData,
          },
        },
      });
    expect(response.status).to.equal(400);
    expect(
      response.body.errors.find((e: any) =>
        e.message.includes("Cannot query field")
      )
    ).to.exist;
  });

  it("USER cannot see addOrUpdateBuiltActivity", async () => {
    const token = await getToken("5ffdf1231ee2c62320b49e99", UserRole.USER);
    const flowsListData = [
      {
        clientId: "5ffdf1231ee2c62320b49e1a",
        name: "flow 1",
        steps: [
          {
            stepType: ActivityBuilderStepType.SYSTEM_MESSAGE,
            message: "message 1",
          },
        ],
      },
    ];
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
          activity: {
            _id: "5ffdf1231ee2c62320b49e1f",
            flowsList: flowsListData,
          },
        },
      });
    expect(response.status).to.equal(400);
    expect(
      response.body.errors.find((e: any) =>
        e.message.includes("Cannot query field")
      )
    ).to.exist;
  });

  it(`admins can create new activity`, async () => {
    const token = await getToken("5ffdf1231ee2c62320b49a99", UserRole.ADMIN);
    const flowsListData = [
      {
        clientId: "5ffdf1231ee2c62320a49e1f",
        name: "flow 1",
        steps: [
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
          {
            stepType: ActivityBuilderStepType.CONDITIONAL,
            conditionals: [
              {
                stateDataKey: "state data key 1",
                checking: "checking 1",
                operation: "operation 1",
                expectedValue: "expected value 1",
                targetStepId: "target step id 1",
              },
            ],
          },
        ],
      },
    ];
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateBuiltActivity($activity: BuiltActivityInputType!) {
          addOrUpdateBuiltActivity(activity: $activity) {
                        flowsList{
                        clientId
                        name
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

                            ... on ConditionalActivityStepType {
                                stepType
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
              }
         }`,
        variables: {
          activity: {
            _id: "5ffdf1231ee2c62320b49e1f",
            flowsList: flowsListData,
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.addOrUpdateBuiltActivity).to.eql({
      flowsList: flowsListData,
    });
  });

  it("content manager can update activity if they own it", async () => {
    const token = await getToken(
      "5ffdf1231ee2c62320c4933f",
      UserRole.CONTENT_MANAGER
    );
    const flowsListData = [
      {
        clientId: "5ffdf1231ee2c62320a49e1f",
        name: "flow 1",
        steps: [
          {
            stepType: ActivityBuilderStepType.SYSTEM_MESSAGE,
            message: "message 1",
            jumpToStepId: "456",
            stepId: "123",
          },
        ],
      },
    ];
    const activity = {
      _id: "5ffdf1231ee2c62320c49e3f",
      flowsList: flowsListData,
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
        variables: { activity },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.addOrUpdateBuiltActivity.flowsList).to.eql(
      activity.flowsList
    );
  });

  it("content manager cannot update activity if they don't own it", async () => {
    const token = await getToken(
      "5ffdf1231ee2c62320c4933f",
      UserRole.CONTENT_MANAGER
    );
    const flowsListData = [
      {
        clientId: "5ffdf1231ee2c62320a49e1f",
        name: "flow 1",
        steps: [
          {
            stepType: ActivityBuilderStepType.SYSTEM_MESSAGE,
            message: "message 1",
            jumpToStepId: "456",
            stepId: "123",
          },
        ],
      },
    ];
    const activity = {
      _id: "5ffdf1231ee2c62320c49e2f",
      flowsList: flowsListData,
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
        variables: { activity },
      });
    expect(response.body.errors).to.exist;
    expect(response.body.errors[0].message).to.equal("Error: unauthorized");
  });

  it("admin can create new activity", async () => {
    const token = await getToken("5ffdf1231ee2c62320b49a99", UserRole.ADMIN);
    const builtActivitesPre = await BuiltActivityModel.find();
    expect(builtActivitesPre.length).to.equal(4);
    const flowsListData = [
      {
        clientId: "67890",
        name: "flow 1",
        steps: [
          {
            stepId: "123",
            jumpToStepId: "456",
            stepType: ActivityBuilderStepType.SYSTEM_MESSAGE,
            message: "message 1",
          },
          {
            stepId: "456",
            jumpToStepId: "789",
            stepType: ActivityBuilderStepType.REQUEST_USER_INPUT,
            message: "message 2",
            saveAsIntention: true,
            saveResponseVariableName: "save response variable name 1",
            disableFreeInput: true,
            predefinedResponses: [
              {
                clientId: "123",
                message: "message 1",
                isArray: false,
                jumpToStepId: "jump to step id 1",
                responseWeight: "1",
              },
            ],
          },
          {
            stepId: "789",
            stepType: ActivityBuilderStepType.PROMPT,
            promptText: "prompt 1",
            jumpToStepId: "123",
            jsonResponseData: "stringified_json_response_data",
            responseFormat: "response format 1",
            includeChatLogContext: true,
            includeEssay: true,
            outputDataType: "JSON",
            customSystemRole: "custom system role 1",
          },
          {
            stepId: "101112",
            stepType: ActivityBuilderStepType.CONDITIONAL,
            jumpToStepId: "101112",
            conditionals: [
              {
                stateDataKey: "state data key 1",
                checking: "checking 1",
                operation: "operation 1",
                expectedValue: "expected value 1",
                targetStepId: "target step id 1",
              },
            ],
          },
        ],
      },
    ];
    const activity = {
      _id: "5ffdf1231ee2c62320b49e5f",
      clientId: "123",
      activityType: "builder",
      title: "title 1",
      user: "5ffdf1231ee2c62320b49a99",
      visibility: "public",
      description: "description 1",
      displayIcon: "display icon 1",
      newDocRecommend: true,
      disabled: false,
      flowsList: flowsListData,
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
          activity,
        },
      });
    expect(response.body.data.addOrUpdateBuiltActivity).to.eql(activity);
    const builtActivitesPost = await BuiltActivityModel.find();
    expect(builtActivitesPost.length).to.equal(5);
    const savedActivity = builtActivitesPost.find(
      (a) => a._id.toString() === activity._id
    );
    if (!savedActivity) {
      throw new Error("activity not found");
    }

    const response2 = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `query FetchBuiltActivities{
          fetchBuiltActivities{
                      ${fullBuiltActivityQueryData}
          }
      }`,
        variables: {
          limit: 2,
        },
      });
    expect(response2.status).to.equal(200);
    const fetchedActivity = response2.body.data.fetchBuiltActivities.find(
      (a: any) => a._id === activity._id
    );
    expect(fetchedActivity).to.eql(activity);
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
