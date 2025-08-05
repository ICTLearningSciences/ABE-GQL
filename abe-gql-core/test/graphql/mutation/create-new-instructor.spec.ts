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
import { UserRole, EducationalRole } from "../../../src/schemas/models/User";
import UserModel from "../../../src/schemas/models/User";
import InstructorDataModel from "../../../src/schemas/models/InstructorData";

describe("create new instructor", () => {
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

  it("creates new instructor data and updates user educational role", async () => {
    const token = await getToken("5ffdf1231ee2c62320b49a99", UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation CreateNewInstructor($userId: ID!) {
          createNewInstructor(userId: $userId) {
            _id
            userId
            courseIds
          }
        }`,
        variables: {
          userId: "5ffdf1231ee2c62320b49a99",
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const instructorData = response.body.data.createNewInstructor;
    expect(instructorData.userId).to.equal("5ffdf1231ee2c62320b49a99");
    expect(instructorData.courseIds).to.be.an("array").that.is.empty;

    const updatedUser = await UserModel.findById("5ffdf1231ee2c62320b49a99");
    expect(updatedUser?.educationalRole).to.equal(EducationalRole.INSTRUCTOR);
  });

  it("throws error when user not found", async () => {
    const token = await getToken("5ffdf1231ee2c62320b49a99", UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation CreateNewInstructor($userId: ID!) {
          createNewInstructor(userId: $userId) {
            _id
            userId
          }
        }`,
        variables: {
          userId: "000000000000000000000000",
        },
      });

    expect(response.status).to.equal(200);
    expect(
      response.body.errors.find((e: any) =>
        e.message.includes("user not found")
      )
    ).to.exist;
  });

  it("returns existing instructor data when instructor data already exists", async () => {
    const token = await getToken("5ffdf1231ee2c62320b49a99", UserRole.USER);

    const existingInstructorData = await InstructorDataModel.create({
      userId: "5ffdf1231ee2c62320b49a99",
      courseIds: [],
    });

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation CreateNewInstructor($userId: ID!) {
          createNewInstructor(userId: $userId) {
            _id
            userId
            courseIds
          }
        }`,
        variables: {
          userId: "5ffdf1231ee2c62320b49a99",
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const instructorData = response.body.data.createNewInstructor;
    expect(instructorData._id).to.equal(existingInstructorData._id.toString());
    expect(instructorData.userId).to.equal("5ffdf1231ee2c62320b49a99");
    expect(instructorData.courseIds).to.be.an("array").that.is.empty;

    const updatedUser = await UserModel.findById("5ffdf1231ee2c62320b49a99");
    expect(updatedUser?.educationalRole).to.equal(EducationalRole.INSTRUCTOR);
  });
});
