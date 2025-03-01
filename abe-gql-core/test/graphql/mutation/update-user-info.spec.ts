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
import { ClassroomCode, UserRole } from "../../../src/schemas/models/User";

export const fullUserQueryData = `
  name
  email
  classroomCode{
    code
    createdAt
  }
  previousClassroomCodes{
    code
    createdAt
  }
`;

describe("update user info", () => {
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

  it("non-authenticated users cannot update user info", async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `mutation UpdateUserInfo($userInfo: UserInputType!) {
          updateUserInfo(userInfo: $userInfo) {
                ${fullUserQueryData}
              }
         }`,
        variables: {
          userInfo: {
            name: "test",
            email: "test@test.com",
            classroomCode: "5ffdf1231ee2c62320b49e2f",
          },
        },
      });
    expect(response.status).to.equal(200);
    expect(
      response.body.errors.find((e: any) =>
        e.message.includes("authenticated user required")
      )
    ).to.exist;
  });

  it("users can update their own user info", async () => {
    const token = await getToken("5ffdf1231ee2c62320b49a99", UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation UpdateUserInfo($userInfo: UserInputType!) {
          updateUserInfo(userInfo: $userInfo) {
                ${fullUserQueryData}
              }
         }`,
        variables: {
          userInfo: {
            classroomCode: "5ffdf1231ee2c62320b49e2f",
          },
        },
      });
    expect(response.status).to.equal(200);
    const updatedUser = response.body.data.updateUserInfo;
    expect(updatedUser.classroomCode.code).to.equal("5ffdf1231ee2c62320b49e2f");
    expect(updatedUser.name).to.equal("John Admin Doe");
    expect(updatedUser.email).to.equal("johnadmindoe@gmail.com");
    const previousClassroomCode = updatedUser.previousClassroomCodes.find(
      (code: ClassroomCode) => code.code === "previous-classroom-code"
    );
    expect(previousClassroomCode).to.exist;
    expect(previousClassroomCode.createdAt).to.exist;
  });
});
