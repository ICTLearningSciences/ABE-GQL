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
import BuiltActivityModel from "../../../src/schemas/models/BuiltActivity/BuiltActivity";

export const fullBuiltActivityQueryData = `
                      _id
                      title
                      activityType
                      description
                      displayIcon
                      disabled
                      newDocRecommend
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
                                  message
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
                              jsonResponseData{
                                  name
                                  type
                                  isRequired
                                  additionalInfo
                              }
                              customSystemRole
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

  it("can create new activity", async () => {
    const builtActivitesPre = await BuiltActivityModel.find();
    expect(builtActivitesPre.length).to.equal(1);
    const stepsData = [
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
            message: "message 1",
          },
        ],
      },
      {
        stepId: "789",
        stepType: ActivityBuilderStepType.PROMPT,
        promptText: "prompt 1",
        jumpToStepId: "123",
        jsonResponseData: [
          {
            name: "name 1",
            type: "type 1",
            isRequired: true,
            additionalInfo: "additional info 1",
          },
        ],
        responseFormat: "response format 1",
        includeChatLogContext: true,
        includeEssay: true,
        outputDataType: "JSON",
        customSystemRole: "custom system role 1",
      },
    ];
    const activity = {
      _id: "5ffdf1231ee2c62320b49e5f",
      activityType: "builder",
      title: "title 1",
      description: "description 1",
      displayIcon: "display icon 1",
      newDocRecommend: true,
      disabled: false,
      steps: stepsData,
    };
    const response = await request(app)
      .post("/graphql")
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
    expect(response.status).to.equal(200);
    expect(response.body.data.addOrUpdateBuiltActivity).to.eql(activity);
    const builtActivitesPost = await BuiltActivityModel.find();
    expect(builtActivitesPost.length).to.equal(2);
    const savedActivity = builtActivitesPost.find(
      (a) => a._id.toString() === activity._id
    );
    if (!savedActivity) {
      throw new Error("activity not found");
    }

    const response2 = await request(app)
      .post("/graphql")
      .send({
        query: `query FetchBuiltActivities($limit: Int){
          fetchBuiltActivities(limit: $limit) {
              edges {
                  node{
                      ${fullBuiltActivityQueryData}
                  }
              }
          }
      }`,
        variables: {
          limit: 2,
        },
      });
    expect(response2.status).to.equal(200);
    const fetchedActivity = response2.body.data.fetchBuiltActivities.edges.find(
      (a: any) => a.node._id === activity._id
    );
    expect(fetchedActivity.node).to.eql(activity);
  });

  it("can update subfield of existing activity", async () => {
    const preUpdate = await BuiltActivityModel.findOne({
      _id: "5ffdf1231ee2c62320b49e2f",
    });
    expect(preUpdate).to.not.be.null;
    expect(preUpdate!.steps.length).to.equal(5);
    expect(preUpdate!.description).to.not.equal("new description");

    const updateActivity = {
      _id: "5ffdf1231ee2c62320b49e2f",
      description: "new description",
    };
    const response = await request(app)
      .post("/graphql")
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
    expect(postUpdate!.steps.length).to.equal(5);
  });
});
