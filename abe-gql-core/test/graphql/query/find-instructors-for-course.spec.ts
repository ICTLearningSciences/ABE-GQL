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
import { UserRole } from "../../../src/schemas/types/types";
import { EducationalRole } from "../../../src/schemas/models/User";
import UserModel from "../../../src/schemas/models/User";
import InstructorDataModel from "../../../src/schemas/models/InstructorData";
import StudentDataModel from "../../../src/schemas/models/StudentData";
import mongoose from "mongoose";
import CourseModel from "../../../src/schemas/models/Course";

const { ObjectId } = mongoose.Types;

const findInstructorsForCourseQuery = `
query FindInstructorsForCourse($courseId: ID!){
            findInstructorsForCourse(courseId: $courseId) {
                userId
                name
                userData {
                    email
                }
                courses {
                    courseId
                    ownership
                }
            }
        }
`;

describe("find instructors for course", () => {
  let app: Express;
  let instructorUserId1: string;
  let instructorUserId2: string;
  let instructorUserId3: string;
  let studentUserId: string;
  let adminUserId: string;
  let courseId1: string;
  beforeEach(async () => {
    await mongoUnit.load(require("../../fixtures/mongodb/data-default.js"));
    app = await createApp();
    await appStart();

    instructorUserId1 = new ObjectId().toString();
    instructorUserId2 = new ObjectId().toString();
    instructorUserId3 = new ObjectId().toString();
    courseId1 = new ObjectId().toString();
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
      courses: [],
    });

    await CourseModel.create({
      _id: courseId1,
      title: "Test Course 1",
      description: "Test Course 1 Description",
      instructorId: instructorUserId1,
      sectionIds: [],
      deleted: false,
    });

    await InstructorDataModel.updateOne(
      { userId: instructorUserId1 },
      { $push: { courses: { courseId: courseId1, ownership: "OWNER" } } }
    );

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

  it("allows instructor to fetch instructors for course", async () => {
    const token = await getToken(instructorUserId1, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: findInstructorsForCourseQuery,
        variables: {
          courseId: courseId1,
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;
    const instructors = response.body.data.findInstructorsForCourse;
    expect(instructors).to.be.an("array").with.length(1);
    expect(instructors[0].userId).to.equal(instructorUserId1);
    expect(instructors[0].name).to.equal("Test Instructor 1");
    expect(instructors[0].userData.email).to.equal("instructor1@test.com");
  });

  it("allows admin to fetch instructors for any course", async () => {
    const token = await getToken(adminUserId, UserRole.ADMIN);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: findInstructorsForCourseQuery,
        variables: {
          courseId: courseId1,
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const instructors = response.body.data.findInstructorsForCourse;
    expect(instructors).to.be.an("array").with.length(1);
    expect(instructors[0].userId).to.equal(instructorUserId1);
    expect(instructors[0].name).to.equal("Test Instructor 1");
  });

  it("allows student to fetch instructors for course", async () => {
    const token = await getToken(studentUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: findInstructorsForCourseQuery,
        variables: {
          courseId: courseId1,
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;
    const instructors = response.body.data.findInstructorsForCourse;
    expect(instructors).to.be.an("array").with.length(1);
    expect(instructors[0].userId).to.equal(instructorUserId1);
    expect(instructors[0].name).to.equal("Test Instructor 1");
    expect(instructors[0].userData.email).to.equal("instructor1@test.com");
  });

  it("throws error when non-authenticated user tries to fetch instructors for course", async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: findInstructorsForCourseQuery,
        variables: {
          courseId: courseId1,
        },
      });

    expect(response.status).to.equal(200);
    expect(
      response.body.errors.find((e: any) =>
        e.message.includes("authenticated user required")
      )
    ).to.exist;
  });

  it("returns empty array when no instructors are assigned to course", async () => {
    const courseId2 = new ObjectId().toString();
    await CourseModel.create({
      _id: courseId2,
      title: "Test Course 2",
      description: "Test Course 2 Description",
      instructorId: instructorUserId1,
      sectionIds: [],
      deleted: false,
    });

    const token = await getToken(instructorUserId1, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: findInstructorsForCourseQuery,
        variables: {
          courseId: courseId2,
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const instructors = response.body.data.findInstructorsForCourse;
    expect(instructors).to.be.an("array").that.is.empty;
  });

  it("throws error when course does not exist", async () => {
    const nonExistentCourseId = new ObjectId().toString();
    const token = await getToken(adminUserId, UserRole.ADMIN);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: findInstructorsForCourseQuery,
        variables: {
          courseId: nonExistentCourseId,
        },
      });
    expect(response.status).to.equal(200);
    expect(
      response.body.errors.find((e: any) =>
        e.message.includes("course not found")
      )
    ).to.exist;
  });
});
