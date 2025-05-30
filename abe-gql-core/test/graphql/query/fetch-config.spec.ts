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
import ConfigModel, {
  AiServiceNames,
  Config,
} from "../../../src/schemas/models/Config";

describe("config", () => {
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

  it(`serves default config when no settings`, async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `query {
          fetchConfig {
            aiSystemPrompt
            surveyConfig {
              surveyLink
              surveyQueryParam
              surveyClassroomParam
            }
          }
        }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.fetchConfig).to.eql({
      aiSystemPrompt: [],
      surveyConfig: {
        surveyLink: "",
        surveyQueryParam: "",
        surveyClassroomParam: "",
      },
    });
  });

  it(`serves config from Settings`, async () => {
    const config: Config = {
      aiSystemPrompt: ["Hello, world!"],
      surveyConfig: {
        surveyLink: "https://example.com",
        surveyQueryParam: "param",
        surveyClassroomParam: "classroomParam",
      },
    };
    await ConfigModel.saveConfig(config);
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `query {
          fetchConfig {
            aiSystemPrompt
            surveyConfig {
              surveyLink
              surveyQueryParam
              surveyClassroomParam
            } 
          }
        }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.fetchConfig).to.eql(config);
  });

  it("ORIGIN: serves config from Settings with subdomain", async () => {
    const config: Config = {
      aiSystemPrompt: ["Hello, world!"],
      displayedGoalActivities: [
        {
          goal: "goal 1",
          activities: [
            {
              activity: "activity 1",
              disabled: false,
            },
          ],
          builtActivities: [
            {
              activity: "built activity 1",
              disabled: false,
            },
          ],
        },
      ],
      colorTheme: {
        headerColor: "#000000",
      },
      exampleGoogleDocs: ["hello"],
      overrideAiModel: {
        serviceName: AiServiceNames.AZURE,
        model: "model",
      },
      emailAiServiceModels: {
        [AiServiceNames.CAMO_GPT]: ["Minstrel7B"],
      },
      approvedEmailsForAiModels: ["test@test.com"],
      headerTitle: "header title",
      orgName: "org name",
      loginScreenTitle: "login screen title",
    };
    await ConfigModel.saveConfig(config);
    const response = await request(app)
      .post("/graphql")
      .set("origin", "https://army.abewriting.org")
      .send({
        query: `query {
          fetchConfig {
            aiSystemPrompt
            displayedGoalActivities{
              goal
              activities{
                activity
                disabled
              }
              builtActivities{
                activity
                disabled  
              }
            }
            colorTheme{
              headerColor
            }
            exampleGoogleDocs
            overrideAiModel{
              serviceName
              model
            }
            availableAiServiceModels{
              serviceName
              models
            }
            emailAiServiceModels{
              serviceName
              models
            }
            approvedEmailsForAiModels
            headerTitle
            orgName
            loginScreenTitle
          }
        }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.fetchConfig).to.eql({
      ...config,
      aiSystemPrompt: ["army system prompt"],
      displayedGoalActivities: [
        {
          goal: "goal 1",
          activities: [
            {
              activity: "activity 1",
              disabled: false,
            },
          ],
          builtActivities: [
            {
              activity: "built activity 1",
              disabled: false,
            },
          ],
        },
      ],
      colorTheme: {
        headerColor: "#000000",
      },
      exampleGoogleDocs: ["hello"],
      overrideAiModel: {
        serviceName: AiServiceNames.AZURE,
        model: "model",
      },
      availableAiServiceModels: [
        {
          serviceName: AiServiceNames.OPEN_AI,
          models: ["gpt-3.5-turbo"],
        },
      ],
      emailAiServiceModels: [
        {
          serviceName: AiServiceNames.CAMO_GPT,
          models: ["Minstrel7B"],
        },
      ],
      approvedEmailsForAiModels: ["test@test.com"],
      headerTitle: "header title",
      orgName: "org name",
      loginScreenTitle: "login screen title",
    });
  });

  it("PARAM: serves config from Settings with subdomain", async () => {
    const config: Config = {
      aiSystemPrompt: ["Hello, world!"],
      displayedGoalActivities: [
        {
          goal: "goal 1",
          activities: [
            {
              activity: "activity 1",
              disabled: false,
            },
          ],
          builtActivities: [
            {
              activity: "built activity 1",
              disabled: false,
            },
          ],
        },
      ],
      colorTheme: {
        headerColor: "#000000",
      },
      exampleGoogleDocs: ["hello"],
      overrideAiModel: {
        serviceName: AiServiceNames.AZURE,
        model: "model",
      },
      headerTitle: "header title",
      orgName: "org name",
      loginScreenTitle: "login screen title",
    };
    await ConfigModel.saveConfig(config);
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `query {
          fetchConfig(subdomain: "army") {
            aiSystemPrompt
            displayedGoalActivities{
              goal
              activities{
                activity
                disabled
              }
              builtActivities{
                activity
                disabled  
              }
            }
            colorTheme{
              headerColor
            }
            exampleGoogleDocs
            overrideAiModel{
              serviceName
              model
            }
            availableAiServiceModels{
              serviceName
              models
            }
            emailAiServiceModels{
              serviceName
              models
            }
            approvedEmailsForAiModels
            headerTitle
            orgName
            loginScreenTitle
          }
        }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.fetchConfig).to.eql({
      ...config,
      aiSystemPrompt: ["army system prompt"],
      displayedGoalActivities: [
        {
          goal: "goal 1",
          activities: [
            {
              activity: "activity 1",
              disabled: false,
            },
          ],
          builtActivities: [
            {
              activity: "built activity 1",
              disabled: false,
            },
          ],
        },
      ],
      colorTheme: {
        headerColor: "#000000",
      },
      exampleGoogleDocs: ["hello"],
      overrideAiModel: {
        serviceName: AiServiceNames.AZURE,
        model: "model",
      },
      availableAiServiceModels: [
        {
          serviceName: AiServiceNames.OPEN_AI,
          models: ["gpt-3.5-turbo"],
        },
      ],
      emailAiServiceModels: [
        {
          serviceName: AiServiceNames.CAMO_GPT,
          models: ["Minstrel7B"],
        },
      ],
      approvedEmailsForAiModels: ["test@test.com"],
      headerTitle: "header title",
      orgName: "org name",
      loginScreenTitle: "login screen title",
    });
  });
});
