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

describe("store prompt template", () => {
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

  it(`can store new prompt template`, async () => {
    const newPromptTemplate = {
      title: "new_prompt_template",
      clientId: "test_client_id",
      aiPromptSteps: [
        {
          prompts: [
            {
              promptText: "new_prompt_template_prompt_text",
              includeEssay: true,

              promptRole: "user",
            },
          ],
          outputDataType: "TEXT",
          targetGptModel: "test_target_gpt_model",
          customSystemRole: "test_custom_system_role",
        },
        {
          prompts: [
            {
              promptText: "new_prompt_template_prompt_text_2",
              includeEssay: true,

              promptRole: "user",
            },
          ],
          outputDataType: "TEXT",
          targetGptModel: "test_target_gpt_model",
          customSystemRole: "test_custom_system_role",
        },
      ],
      userInputIsIntention: true,
    };
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `mutation StorePrompt($prompt: PromptInputType!) {
            storePrompt(prompt: $prompt) {
                _id
                title
                clientId
                userInputIsIntention
                aiPromptSteps {
                    prompts{
                      promptText
                      includeEssay
                      
                      promptRole
                    }
                      targetGptModel
                      customSystemRole
                      outputDataType
                    
                  }
              }
         }`,
        variables: {
          prompt: newPromptTemplate,
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.storePrompt.title).to.equal(
      newPromptTemplate.title
    );
    expect(
      response.body.data.storePrompt.aiPromptSteps
    ).to.deep.include.members(newPromptTemplate.aiPromptSteps);
    expect(response.body.data.storePrompt.clientId).to.equal(
      newPromptTemplate.clientId
    );
    expect(response.body.data.storePrompt.userInputIsIntention).to.equal(
      newPromptTemplate.userInputIsIntention
    );
  });

  it("can update existing prompt template", async () => {
    const existingPromptTemplateId = "5ffdf1231ee2c62320b49e9e";
    const newTitle = "new_prompt_template_title";
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `mutation StorePrompt($prompt: PromptInputType!) {
            storePrompt(prompt: $prompt) {
                _id
                title
                aiPromptSteps {
                  prompts{
                    promptText
                    includeEssay
                    
                    promptRole
                  }
                  outputDataType
                  
                }
                userInputIsIntention
              }
         }`,
        variables: {
          prompt: {
            _id: existingPromptTemplateId,
            title: newTitle,
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.storePrompt._id).to.equal(
      existingPromptTemplateId
    );
    expect(response.body.data.storePrompt.title).to.equal(newTitle);
    expect(response.body.data.storePrompt.userInputIsIntention).to.eql(false);
    expect(response.body.data.storePrompt.aiPromptSteps).to.eql([
      {
        prompts: [
          {
            promptText: "prompt_text",
            includeEssay: false,

            promptRole: "user",
          },
        ],
        outputDataType: "TEXT",
      },
      {
        prompts: [
          {
            promptText: "prompt_text_2",
            includeEssay: true,

            promptRole: "user",
          },
        ],
        outputDataType: "JSON",
      },
    ]);
  });
});
