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

describe("store prompt run", () => {
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

  it(`can store prompt run`, async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `mutation StorePromptRun($googleDocId: String!, $user: ID!, $openAiPromptSteps: [OpenAiPromptStepInputType]!, $openAiSteps: [OpenAiStepsInputType]!) {
            storePromptRun(googleDocId: $googleDocId, user: $user, openAiPromptSteps: $openAiPromptSteps, openAiSteps: $openAiSteps) {
                googleDocId
                user
                openAiPromptSteps {
                    prompts{
                      promptText
                      includeEssay
                      includeUserInput
                      promptRole
                    }
                    outputDataType
                    jsonValidation
                    includeChatLogContext
                }
                openAiSteps {
                    openAiPromptStringify
                    openAiResponseStringify
                }
              }
         }`,
        variables: {
          googleDocId: "test_store_google_doc",
          user: "5ffdf1231ee2c62320b49e99",
          openAiPromptSteps: [
            {
              prompts: [
                {
                  promptText: "store_test_prompt_text",
                  includeEssay: true,
                  includeUserInput: true,
                  promptRole: "user",
                },
              ],
              outputDataType: "TEXT",
              jsonValidation: "store_test_json_validation",
              includeChatLogContext: true,
            },
          ],
          openAiSteps: [
            {
              openAiPromptStringify: "store_open_ai_prompt_stringify_test",
              openAiResponseStringify: "store_open_ai_response_stringify_test",
            },
          ],
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.storePromptRun).to.eql({
      googleDocId: "test_store_google_doc",
      user: "5ffdf1231ee2c62320b49e99",
      openAiPromptSteps: [
        {
          prompts: [
            {
              promptText: "store_test_prompt_text",
              includeEssay: true,
              includeUserInput: true,
              promptRole: "user",
            },
          ],
          outputDataType: "TEXT",
          jsonValidation: "store_test_json_validation",
          includeChatLogContext: true,
        },
      ],
      openAiSteps: [
        {
          openAiPromptStringify: "store_open_ai_prompt_stringify_test",
          openAiResponseStringify: "store_open_ai_response_stringify_test",
        },
      ],
    });
  });
});
