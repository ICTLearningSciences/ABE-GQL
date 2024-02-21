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

describe("fetch open ai async job", () => {
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

  it(`can fetch open ai async job`, async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `query FetchOpenAiAsyncJob($_id: ID!) {
            fetchOpenAiAsyncJob(_id: $_id) {
                _id
                openAiData {
                    openAiPromptStringify
                    openAiResponseStringify
                }
                status
                answer
                    }
                }`,
        variables: {
          _id: "5ffdf1231ee2c62320b49e4c",
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.fetchOpenAiAsyncJob).to.eql({
      _id: "5ffdf1231ee2c62320b49e4c",
      openAiData: [
        {
          openAiPromptStringify: "open_ai_prompt_stringify",
          openAiResponseStringify: "open_ai_response_stringify",
        },
      ],
      answer: "Open Ai Async Answer Test",
      status: "QUEUED",
    });
  });
});
