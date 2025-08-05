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
import StudentDataModel from "../../../src/schemas/models/StudentData";

describe("create new student", () => {
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

  it("creates new student data and updates user educational role", async () => {
    const token = await getToken("5ffdf1231ee2c62320b49a99", UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation CreateNewStudent($userId: ID!) {
          createNewStudent(userId: $userId) {
            _id
            userId
            enrolledCourses
            enrolledSections
            assignmentProgress {
              assignmentId
              complete
            }
            deleted
          }
        }`,
        variables: {
          userId: "5ffdf1231ee2c62320b49a99",
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const studentData = response.body.data.createNewStudent;
    expect(studentData.userId).to.equal("5ffdf1231ee2c62320b49a99");
    expect(studentData.enrolledCourses).to.be.an("array").that.is.empty;
    expect(studentData.enrolledSections).to.be.an("array").that.is.empty;
    expect(studentData.assignmentProgress).to.be.an("array").that.is.empty;
    expect(studentData.deleted).to.be.false;

    const updatedUser = await UserModel.findById("5ffdf1231ee2c62320b49a99");
    expect(updatedUser?.educationalRole).to.equal(EducationalRole.STUDENT);
  });

  it("throws error when user not found", async () => {
    const token = await getToken("5ffdf1231ee2c62320b49a99", UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation CreateNewStudent($userId: ID!) {
          createNewStudent(userId: $userId) {
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

  it("returns existing student data when student data already exists", async () => {
    const token = await getToken("5ffdf1231ee2c62320b49a99", UserRole.USER);

    const existingStudentData = await StudentDataModel.create({
      userId: "5ffdf1231ee2c62320b49a99",
      enrolledCourses: [],
      enrolledSections: [],
      assignmentProgress: [],
      deleted: false,
    });

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation CreateNewStudent($userId: ID!) {
          createNewStudent(userId: $userId) {
            _id
            userId
            enrolledCourses
            enrolledSections
            assignmentProgress {
              assignmentId
              complete
            }
            deleted
          }
        }`,
        variables: {
          userId: "5ffdf1231ee2c62320b49a99",
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const studentData = response.body.data.createNewStudent;
    expect(studentData._id).to.equal(existingStudentData._id.toString());
    expect(studentData.userId).to.equal("5ffdf1231ee2c62320b49a99");
    expect(studentData.enrolledCourses).to.be.an("array").that.is.empty;
    expect(studentData.enrolledSections).to.be.an("array").that.is.empty;
    expect(studentData.assignmentProgress).to.be.an("array").that.is.empty;
    expect(studentData.deleted).to.be.false;

    const updatedUser = await UserModel.findById("5ffdf1231ee2c62320b49a99");
    expect(updatedUser?.educationalRole).to.equal(EducationalRole.STUDENT);
  });
});
