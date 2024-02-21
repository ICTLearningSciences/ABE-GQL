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

describe("store prompt templates", () => {
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

  it(`can store and update multiple prompt templates`, async () => {
    const newPromptTemplate = {
      title: "new_prompt_template",
      clientId: "test_client_id",
      openAiPromptSteps: [
        {
          prompts: [
            {
              promptText: "new_prompt_template_prompt_text",
              includeEssay: true,
              includeUserInput: true,
              promptRole: "user",
            },
          ],
          outputDataType: "TEXT",
        },
        {
          prompts: [
            {
              promptText: "new_prompt_template_prompt_text_2",
              includeEssay: false,
              includeUserInput: true,
              promptRole: "user",
            },
          ],
          outputDataType: "JSON",
        },
      ],
      _id: "654e926e7aaab424574a7de6",
    };
    const updatedPromptTemplate = {
      title: "updated_prompt_template",
      clientId: "test_client_id_2",
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
        },
      ],
      _id: "5ffdf1231ee2c62320b49e9e",
    };
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `mutation StorePrompts($prompts: [PromptInputType]!) {
            storePrompts(prompts: $prompts) {
                _id
                title
                clientId
                openAiPromptSteps {
                    prompts{
                      promptText
                      includeEssay
                      includeUserInput
                      promptRole
                    }
                    outputDataType
                  }
              }
         }`,
        variables: {
          prompts: [newPromptTemplate, updatedPromptTemplate],
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.storePrompts.length).to.equal(2);
    expect(response.body.data.storePrompts).to.deep.include(newPromptTemplate);
    expect(response.body.data.storePrompts).to.deep.include(
      updatedPromptTemplate
    );
  });
});
