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

describe("fetch doc goals", () => {
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

  it(`can fetch doc goals`, async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `query {
          fetchDocGoals {
            edges {
                node{
                    activities{
                        _id
                        title
                        steps{
                            text
                            stepType
                            mcqChoices
                        }
                        description
                        responsePendingMessage
                        responseReadyMessage
                        newDocRecommend
                        introduction
                        disabled
                        displayIcon
                        prompt{
                          _id
                          openAiPromptSteps{
                            prompts{
                              promptText
                              includeEssay
                              includeUserInput
                              promptRole
                            }
                            outputDataType
                            includeChatLogContext
                          }
                          title
                          userInputIsIntention
                        }
                        prompts{
                          _id
                          promptId
                          order
                        }
                    }
                    activityOrder
                    newDocRecommend
                    title
                    description
                    displayIcon
                    introduction
                  }
                }
            }
        }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.fetchDocGoals.edges).to.deep.include.members([
      {
        node: {
          activities: [
            {
              _id: "5ffdf1231ee2c62320b49e9f",
              title: "activity_title_test",
              steps: [
                {
                  stepType: "MESSAGE",
                  text: "activity_message_test",
                  mcqChoices: [],
                },
                {
                  stepType: "MULTIPLE_CHOICE_QUESTIONS",
                  text: "activity_multiple_choice_questions_test",
                  mcqChoices: ["mcq_choice_1", "mcq_choice_2", "mcq_choice_3"],
                },
              ],
              description: "activity_description_test",
              responsePendingMessage: "activity_response_pending_message_test",
              responseReadyMessage: "activity_response_ready_message_test",
              newDocRecommend: true,
              disabled: false,
              introduction: "activity_introduction_test",
              displayIcon: "activity_display_icon_test",
              prompt: {
                _id: "5ffdf1231ee2c62320b49e9e",
                title: "prompt_title_test",
                openAiPromptSteps: [
                  {
                    prompts: [
                      {
                        promptText: "prompt_text",
                        includeEssay: false,
                        includeUserInput: true,
                        promptRole: "user",
                      },
                    ],
                    outputDataType: "TEXT",
                    includeChatLogContext: false,
                  },
                  {
                    prompts: [
                      {
                        promptText: "prompt_text_2",
                        includeEssay: true,
                        includeUserInput: true,
                        promptRole: "user",
                      },
                    ],
                    outputDataType: "JSON",
                    includeChatLogContext: true,
                  },
                ],
                userInputIsIntention: false,
              },
              prompts: [
                {
                  _id: "5ffdf1231ee2c62320b49e8e",
                  promptId: "5ffdf1231ee2c62320b49e9e",
                  order: 0,
                },
              ],
            },
          ],
          activityOrder: ["5ffdf1231ee2c62320b49e9f"],
          newDocRecommend: true,
          title: "docgoal_title_test",
          description: "docgoal_description_test",
          displayIcon: "docgoal_display_icon_test",
          introduction: "docgoal_introduction_test",
        },
      },
    ]);
  });
});
