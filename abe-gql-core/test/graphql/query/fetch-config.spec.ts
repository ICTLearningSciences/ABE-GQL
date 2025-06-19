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
            bannerConfig {
              bannerText
              bannerTextColor
              bannerBgColor
            }
            aiServiceModelConfigs {
              serviceName
              modelList {
                name
                maxTokens
                supportsWebSearch
                onlyAdminUse
                disabled
              }
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
      bannerConfig: {
        bannerText: "",
        bannerTextColor: "",
        bannerBgColor: "",
      },
      aiServiceModelConfigs: [
        {
          serviceName: "OPEN_AI",
          modelList: [
            {
              name: "gpt-3.5-turbo",
              maxTokens: 1000,
              supportsWebSearch: true,
              onlyAdminUse: false,
              disabled: false,
            },
          ],
        },
      ],
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
      bannerConfig: {
        bannerText: "Hello, world!",
        bannerTextColor: "#000000",
        bannerBgColor: "#FFFFFF",
      },
      aiServiceModelConfigs: [
        {
          serviceName: AiServiceNames.OPEN_AI,
          modelList: [
            {
              name: "gpt-3.5-turbo",
              maxTokens: 1000,
              supportsWebSearch: true,
              onlyAdminUse: true,
              disabled: false,
            },
          ],
        },
      ],
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
            bannerConfig {
              bannerText
              bannerTextColor
              bannerBgColor
            }
            aiServiceModelConfigs {
              serviceName
              modelList {
                name
                maxTokens
                supportsWebSearch
                onlyAdminUse
                disabled
              }
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
            approvedEmailsForAiModels
            headerTitle
            orgName
            loginScreenTitle
            aiServiceModelConfigs {
              serviceName
              modelList {
                name
                maxTokens
                supportsWebSearch
                onlyAdminUse
                disabled
              }
            }
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
      approvedEmailsForAiModels: ["test@test.com"],
      headerTitle: "header title",
      orgName: "org name",
      loginScreenTitle: "login screen title",
      aiServiceModelConfigs: [
        {
          serviceName: AiServiceNames.OPEN_AI,
          modelList: [
            {
              name: "gpt-3.5-turbo",
              maxTokens: 1000,
              supportsWebSearch: true,
              onlyAdminUse: false,
              disabled: false,
            },
          ],
        },
      ],
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
      approvedEmailsForAiModels: ["test@test.com"],
      headerTitle: "header title",
      orgName: "org name",
      loginScreenTitle: "login screen title",
    });
  });

  it(`Does not serve disabled models`, async () => {
    const enabledModel = {
      name: "gpt-4o",
      maxTokens: 1000,
      supportsWebSearch: true,
      onlyAdminUse: true,
      disabled: false,
    };
    const disabledModel = {
      name: "gpt-3.5-turbo",
      maxTokens: 1000,
      supportsWebSearch: true,
      onlyAdminUse: true,
      disabled: true,
    };
    const config = {
      aiServiceModelConfigs: [
        {
          serviceName: AiServiceNames.OPEN_AI,
          modelList: [enabledModel, disabledModel],
        },
      ],
    };
    await ConfigModel.saveConfig(config);
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `query {
          fetchConfig {
            aiServiceModelConfigs {
              serviceName
              modelList {
                name
                maxTokens
                supportsWebSearch
                onlyAdminUse
                disabled
              }
            }
          }
        }`,
      });
    expect(response.status).to.equal(200);
    expect(
      response.body.data.fetchConfig.aiServiceModelConfigs[0].modelList
    ).to.deep.include.members([enabledModel]);
    expect(
      response.body.data.fetchConfig.aiServiceModelConfigs[0].modelList
    ).to.not.deep.include.members([disabledModel]);
  });
});
