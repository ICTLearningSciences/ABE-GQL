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
import { getToken } from "../../helpers";

describe("fetch prompt runs", () => {
  let app: Express;

  beforeEach(async () => {
    await mongoUnit.load(require("../../fixtures/mongodb/data-default.js"));
    app = createApp();
    await appStart();
  });

  afterEach(async () => {
    await appStop();
    await mongoUnit.drop();
  });

  it(`can fetch prompt runs for user and google doc`, async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `query FetchPromptRuns($userId: ID!, $googleDocId: String!) {
            fetchPromptRuns(userId: $userId, googleDocId: $googleDocId) {
                      aiPromptSteps{
                        prompts{
                          promptText
                          includeEssay
                          promptRole
                        }
                        outputDataType
                      }
                        googleDocId
                        user
                        aiSteps {
                          aiServiceRequestParams
                          aiServiceResponse
                        }
                    }
                }`,
        variables: {
          userId: "5ffdf1231ee2c62320b49e99",
          googleDocId: "test_google_doc_id",
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.fetchPromptRuns).to.have.length(1);
    expect(response.body.data.fetchPromptRuns).to.deep.include.members([
      {
        user: "5ffdf1231ee2c62320b49e99",
        googleDocId: "test_google_doc_id",
        aiSteps: [
          {
            aiServiceRequestParams: "open_ai_prompt_stringify",
            aiServiceResponse: "open_ai_response_stringify",
          },
        ],
        aiPromptSteps: [
          {
            prompts: [
              {
                promptText: "prompt_text_test",
                includeEssay: true,
                promptRole: "user",
              },
            ],
            outputDataType: "TEXT",
          },
          {
            prompts: [
              {
                promptText: "prompt_text_test_2",
                includeEssay: true,
                promptRole: "user",
              },
            ],
            outputDataType: "TEXT",
          },
        ],
      },
    ]);
  });

  it(`can fetch all prompt runs for user`, async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `query FetchPromptRuns($userId: ID!, $googleDocId: String) {
            fetchPromptRuns(userId: $userId, googleDocId: $googleDocId) {
              aiPromptSteps{
                prompts{
                  promptText
                  includeEssay
                  promptRole
                }
                outputDataType
              }
                        googleDocId
                        user
                        aiSteps {
                          aiServiceRequestParams
                          aiServiceResponse
                        }
                    }
                }`,
        variables: {
          userId: "5ffdf1231ee2c62320b49e99",
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.fetchPromptRuns).to.have.length(2);
    expect(response.body.data.fetchPromptRuns).to.deep.include.members([
      {
        user: "5ffdf1231ee2c62320b49e99",
        googleDocId: "test_google_doc_id",
        aiSteps: [
          {
            aiServiceRequestParams: "open_ai_prompt_stringify",
            aiServiceResponse: "open_ai_response_stringify",
          },
        ],
        aiPromptSteps: [
          {
            prompts: [
              {
                promptText: "prompt_text_test",
                includeEssay: true,
                promptRole: "user",
              },
            ],
            outputDataType: "TEXT",
          },
          {
            prompts: [
              {
                promptText: "prompt_text_test_2",
                includeEssay: true,
                promptRole: "user",
              },
            ],
            outputDataType: "TEXT",
          },
        ],
      },
      {
        user: "5ffdf1231ee2c62320b49e99",
        googleDocId: "test_google_doc_id_2",
        aiSteps: [
          {
            aiServiceRequestParams: "open_ai_prompt_stringify",
            aiServiceResponse: "open_ai_response_stringify",
          },
        ],
        aiPromptSteps: [
          {
            prompts: [
              {
                promptText: "prompt_text_test",
                includeEssay: true,
                promptRole: "user",
              },
            ],
            outputDataType: "TEXT",
          },
          {
            prompts: [
              {
                promptText: "prompt_text_test_2",
                includeEssay: true,
                promptRole: "user",
              },
            ],
            outputDataType: "TEXT",
          },
        ],
      },
    ]);
  });
});
