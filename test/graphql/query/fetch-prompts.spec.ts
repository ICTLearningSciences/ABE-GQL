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

describe("fetch prompts", () => {
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

  it(`can fetch prompts`, async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `query FetchPrompts {
            fetchPrompts {
                  _id
                  aiPromptSteps {
                        prompts{
                          promptText
                          includeEssay
                          includeUserInput
                          promptRole
                        }
                        targetAiServiceModel{
                          serviceName
                          model
                        }
                        outputDataType
                        includeChatLogContext
                        jsonValidation
                      }
                      title
                    }
                }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.fetchPrompts).to.deep.include.members([
      {
        _id: "5ffdf1231ee2c62320b49e9e",
        aiPromptSteps: [
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
            jsonValidation: "",
            includeChatLogContext: false,
            targetAiServiceModel: {
              serviceName: "testServiceName",
              model: "testModel",
            },
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
            jsonValidation: "json_validation_test",
            includeChatLogContext: true,
            targetAiServiceModel: null,
          },
        ],
        title: "prompt_title_test",
      },
    ]);
  });
});
