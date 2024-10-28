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
import { fullBuiltActivityQueryData } from "../mutation/add-or-update-built-activity.spec";
import { UserRole } from "../../../src/schemas/models/User";
import { getToken } from "../../helpers";
import { ActivityBuilderStepType } from "../../../src/schemas/models/BuiltActivity/types";

describe("fetch built activities", () => {
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

  it(`can fetch public activites`, async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `query FetchBuiltActivities{
            fetchBuiltActivities {
                        ${fullBuiltActivityQueryData}
                    }
        }`,
        variables: {
          limit: 1,
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.data.fetchBuiltActivities.length).to.equal(3);
    expect(response.body.data.fetchBuiltActivities[0].title).to.equal(
      "Test AI Response Data"
    );
    expect(response.body.data.fetchBuiltActivities[0].activityType).to.equal(
      "builder"
    );
    expect(response.body.data.fetchBuiltActivities[0].user).to.equal(
      "5ffdf1231ee2c62320b49e99"
    );
    expect(response.body.data.fetchBuiltActivities[0].visibility).to.equal(
      "editable"
    );
    expect(
      response.body.data.fetchBuiltActivities[0].flowsList.length
    ).to.equal(1);
    expect(
      response.body.data.fetchBuiltActivities[0].flowsList[0].steps.length
    ).to.equal(5);
    expect(
      response.body.data.fetchBuiltActivities[0].flowsList[0].steps[0].stepType
    ).to.equal(ActivityBuilderStepType.SYSTEM_MESSAGE);
  });

  it("content managers can only see public activities and their own private activities", async () => {
    const token = await getToken(
      "5ffdf1231ee2c62320b49a99",
      UserRole.CONTENT_MANAGER
    );
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `query FetchBuiltActivities{
          fetchBuiltActivities {
                      ${fullBuiltActivityQueryData}
                  }
      }`,
        variables: {
          limit: 2,
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.fetchBuiltActivities.length).to.equal(4); // can only see editable/read-only activities
    const publicActivity = response.body.data.fetchBuiltActivities.find(
      (a: any) => a._id === "5ffdf1231ee2c62320b49e2f"
    );
    expect(publicActivity).to.not.be.undefined;
    expect(publicActivity.title).to.equal("Test AI Response Data");
    const ownedActivity = response.body.data.fetchBuiltActivities.find(
      (a: any) => a._id === "5ffdf1231ee2c62322c49e3f"
    );
    expect(ownedActivity).to.not.be.undefined;
    expect(ownedActivity.title).to.equal("Private activity 3");

    const otherPrivateActivity = response.body.data.fetchBuiltActivities.find(
      (a: any) => a._id === "5ffdf1231ee2c62320c49e2f"
    );
    expect(otherPrivateActivity).to.be.undefined;
  });

  it("admins can see all activities", async () => {
    const token = await getToken("5ffdf1231ee2c62320b49a99", UserRole.ADMIN);
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `query FetchBuiltActivities{
          fetchBuiltActivities {
                      ${fullBuiltActivityQueryData}
                  }
      }`,
      });
    expect(response.status).to.equal(200);
    const publicActivity = response.body.data.fetchBuiltActivities.find(
      (a: any) => a._id === "5ffdf1231ee2c62320b49e2f"
    );
    expect(publicActivity).to.not.be.undefined;
    expect(publicActivity.title).to.equal("Test AI Response Data");
    const user1PrivateActivity = response.body.data.fetchBuiltActivities.find(
      (a: any) => a._id === "5ffdf1231ee2c62322c49e3f"
    );
    expect(user1PrivateActivity).to.not.be.undefined;
    expect(user1PrivateActivity.title).to.equal("Private activity 3");

    const user2PrivateActivity = response.body.data.fetchBuiltActivities.find(
      (a: any) => a._id === "5ffdf1231ee2c62320c49e3f"
    );
    expect(user2PrivateActivity).to.not.be.undefined;
  });
});
