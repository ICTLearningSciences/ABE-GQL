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
import StudentDataModel from "../../../src/schemas/models/StudentData";
import mongoose from "mongoose";

const { ObjectId } = mongoose.Types;

describe("fetch instructors", () => {
  let app: Express;
  let instructorUserId1: string;
  let instructorUserId2: string;
  let instructorUserId3: string;
  let studentUserId: string;
  let adminUserId: string;

  beforeEach(async () => {
    await mongoUnit.load(require("../../fixtures/mongodb/data-default.js"));
    app = await createApp();
    await appStart();

    instructorUserId1 = new ObjectId().toString();
    instructorUserId2 = new ObjectId().toString();
    instructorUserId3 = new ObjectId().toString();
    studentUserId = new ObjectId().toString();
    adminUserId = new ObjectId().toString();

    // Create instructor users
    await UserModel.create({
      _id: instructorUserId1,
      googleId: "instructor1-google-id",
      name: "Test Instructor 1",
      email: "instructor1@test.com",
      userRole: UserRole.USER,
      loginService: "GOOGLE",
      educationalRole: EducationalRole.INSTRUCTOR,
    });

    await InstructorDataModel.create({
      userId: instructorUserId1,
      name: "Test Instructor 1",
    });

    await UserModel.create({
      _id: instructorUserId2,
      googleId: "instructor2-google-id",
      name: "Test Instructor 2",
      email: "instructor2@test.com",
      userRole: UserRole.USER,
      loginService: "GOOGLE",
      educationalRole: EducationalRole.INSTRUCTOR,
    });

    await InstructorDataModel.create({
      userId: instructorUserId2,
      name: "Test Instructor 2",
    });

    await UserModel.create({
      _id: instructorUserId3,
      googleId: "instructor3-google-id",
      name: "Test Instructor 3",
      email: "instructor3@test.com",
      userRole: UserRole.USER,
      loginService: "GOOGLE",
      educationalRole: EducationalRole.INSTRUCTOR,
    });

    await InstructorDataModel.create({
      userId: instructorUserId3,
      name: "Test Instructor 3",
    });

    // Create student user
    await UserModel.create({
      _id: studentUserId,
      googleId: "student-google-id",
      name: "Test Student",
      email: "student@test.com",
      userRole: UserRole.USER,
      loginService: "GOOGLE",
      educationalRole: EducationalRole.STUDENT,
    });

    await StudentDataModel.create({
      userId: studentUserId,
      enrolledCourses: [],
      enrolledSections: [],
      assignmentProgress: [],
      deleted: false,
    });

    // Create admin user
    await UserModel.create({
      _id: adminUserId,
      googleId: "admin-google-id",
      name: "Test Admin",
      email: "admin@test.com",
      userRole: UserRole.ADMIN,
      loginService: "GOOGLE",
      educationalRole: EducationalRole.INSTRUCTOR,
    });
  });

  afterEach(async () => {
    await appStop();
    await mongoUnit.drop();
  });

  it("allows instructor to fetch other instructors", async () => {
    const token = await getToken(instructorUserId1, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `query FetchInstructors {
          fetchInstructors {
            _id
            userId
            name
            courses {
              courseId
              ownership
            }
          }
        }`,
      });

    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const instructors = response.body.data.fetchInstructors;
    expect(instructors).to.be.an("array").with.length(2);

    const instructorNames = instructors.map((i: any) => i.name);
    expect(instructorNames).to.include("Test Instructor 2");
    expect(instructorNames).to.include("Test Instructor 3");
    expect(instructorNames).to.not.include("Test Instructor 1"); // Should not include self

    const instructorUserIds = instructors.map((i: any) => i.userId);
    expect(instructorUserIds).to.include(instructorUserId2);
    expect(instructorUserIds).to.include(instructorUserId3);
    expect(instructorUserIds).to.not.include(instructorUserId1); // Should not include self
  });

  it("allows admin to fetch all instructors", async () => {
    const token = await getToken(adminUserId, UserRole.ADMIN);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `query FetchInstructors {
          fetchInstructors {
            _id
            userId
            name
            courses {
              courseId
              ownership
            }
          }
        }`,
      });

    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const instructors = response.body.data.fetchInstructors;
    expect(instructors).to.be.an("array").with.length(3);

    const instructorNames = instructors.map((i: any) => i.name);
    expect(instructorNames).to.include("Test Instructor 1");
    expect(instructorNames).to.include("Test Instructor 2");
    expect(instructorNames).to.include("Test Instructor 3");

    const instructorUserIds = instructors.map((i: any) => i.userId);
    expect(instructorUserIds).to.include(instructorUserId1);
    expect(instructorUserIds).to.include(instructorUserId2);
    expect(instructorUserIds).to.include(instructorUserId3);
    expect(instructorUserIds).to.not.include(adminUserId); // Admin should not include self since admin doesn't have InstructorData
  });

  it("throws error when student tries to fetch instructors", async () => {
    const token = await getToken(studentUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `query FetchInstructors {
          fetchInstructors {
            _id
            userId
            name
          }
        }`,
      });

    expect(response.status).to.equal(200);
    expect(
      response.body.errors.find((e: any) =>
        e.message.includes(
          "unauthorized: only admins and instructors can fetch instructors"
        )
      )
    ).to.exist;
  });

  it("throws error when non-authenticated user tries to fetch instructors", async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `query FetchInstructors {
          fetchInstructors {
            _id
            userId
            name
          }
        }`,
      });

    expect(response.status).to.equal(200);
    expect(
      response.body.errors.find((e: any) =>
        e.message.includes("authenticated user required")
      )
    ).to.exist;
  });

  it("returns empty array when no other instructors exist", async () => {
    // Remove all other instructors except the requesting one
    await InstructorDataModel.deleteMany({
      userId: { $ne: instructorUserId1 },
    });

    const token = await getToken(instructorUserId1, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `query FetchInstructors {
          fetchInstructors {
            _id
            userId
            name
          }
        }`,
      });

    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const instructors = response.body.data.fetchInstructors;
    expect(instructors).to.be.an("array").that.is.empty;
  });

  it("throws error when user without instructor data tries to fetch instructors", async () => {
    const userWithoutInstructorData = new ObjectId().toString();
    await UserModel.create({
      _id: userWithoutInstructorData,
      googleId: "no-instructor-data-google-id",
      name: "User Without Instructor Data",
      email: "noinstructordata@test.com",
      userRole: UserRole.USER,
      loginService: "GOOGLE",
      educationalRole: EducationalRole.INSTRUCTOR,
    });

    const token = await getToken(userWithoutInstructorData, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `query FetchInstructors {
          fetchInstructors {
            _id
            userId
            name
          }
        }`,
      });

    expect(response.status).to.equal(200);
    expect(
      response.body.errors.find((e: any) =>
        e.message.includes(
          "unauthorized: only admins and instructors can fetch instructors"
        )
      )
    ).to.exist;
  });
});
