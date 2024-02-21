/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import createApp, { appStart, appStop } from "app";
import { expect } from "chai";
import { Express } from "express";
import mongoUnit from "mongo-unit";
import request from "supertest";

describe("open ai async update", () => {
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

  it("can create new async job", async () => {
    const newJob = {
      _id: "",
      openAiData: [
        {
          openAiPromptStringify: "prompt",
          openAiResponseStringify: "response",
        },
      ],
      status: "QUEUED",
      answer: "answer",
    };
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `mutation OpenAiAsyncJobUpdate($_id: ID!, $openAiData: [OpenAiStepsInputType], $status: String, $answer: String) {
          openAiAsyncJobUpdate(_id: $_id, openAiData: $openAiData, status: $status, answer: $answer){
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
          _id: newJob._id,
          openAiData: newJob.openAiData,
          status: newJob.status,
          answer: newJob.answer,
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.openAiAsyncJobUpdate._id).to.not.be.empty;
    expect(response.body.data.openAiAsyncJobUpdate._id).to.not.eql("");
    newJob._id = response.body.data.openAiAsyncJobUpdate._id;
    expect(response.body.data.openAiAsyncJobUpdate).to.eql(newJob);
  });

  it("can update existing async job", async () => {
    const existingJobUpdate = {
      _id: "5ffdf1231ee2c62320b49e4c",
      answer: "answer",
    };
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `mutation OpenAiAsyncJobUpdate($_id: ID!, $openAiData: [OpenAiStepsInputType], $status: String, $answer: String) {
          openAiAsyncJobUpdate(_id: $_id, openAiData: $openAiData, status: $status, answer: $answer){
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
          _id: existingJobUpdate._id,
          answer: existingJobUpdate.answer,
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.openAiAsyncJobUpdate).to.eql({
      ...existingJobUpdate,
      status: "QUEUED",
      openAiData: [
        {
          openAiPromptStringify: "open_ai_prompt_stringify",
          openAiResponseStringify: "open_ai_response_stringify",
        },
      ],
    });
  });
});
