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
import CourseModel from "../../../src/schemas/models/Course";
import StudentDataModel from "../../../src/schemas/models/StudentData";
import mongoose from "mongoose";
import InstructorDataModel from "../../../src/schemas/models/InstructorData";

const { ObjectId } = mongoose.Types;

describe("fetch courses", () => {
  let app: Express;
  let instructorUserId: string;
  let studentUserId: string;
  let courseId1: string;
  let courseId2: string;
  let courseId3: string;

  beforeEach(async () => {
    await mongoUnit.load(require("../../fixtures/mongodb/data-default.js"));
    app = await createApp();
    await appStart();

    instructorUserId = new ObjectId().toString();
    studentUserId = new ObjectId().toString();
    courseId1 = new ObjectId().toString();
    courseId2 = new ObjectId().toString();
    courseId3 = new ObjectId().toString();

    // Create instructor user
    await UserModel.create({
      _id: instructorUserId,
      googleId: "instructor-google-id",
      name: "Test Instructor",
      email: "instructor@test.com",
      userRole: "USER",
      loginService: "GOOGLE",
      educationalRole: EducationalRole.INSTRUCTOR,
    });

    await InstructorDataModel.create({
      userId: instructorUserId,
      courseIds: [],
    });

    // Create student user
    await UserModel.create({
      _id: studentUserId,
      googleId: "student-google-id",
      name: "Test Student",
      email: "student@test.com",
      userRole: "USER",
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

    // Create courses for instructor
    await CourseModel.create({
      _id: courseId1,
      title: "Instructor Course 1",
      description: "First course by instructor",
      instructorId: instructorUserId,

      deleted: false,
    });

    await CourseModel.create({
      _id: courseId2,
      title: "Instructor Course 2",
      description: "Second course by instructor",
      instructorId: instructorUserId,

      deleted: false,
    });

    // Create course by another instructor
    const anotherInstructorId = new ObjectId().toString();
    await UserModel.create({
      _id: anotherInstructorId,
      googleId: "another-instructor-google-id",
      name: "Another Instructor",
      email: "another@test.com",
      userRole: "USER",
      loginService: "GOOGLE",
      educationalRole: EducationalRole.INSTRUCTOR,
    });

    await InstructorDataModel.create({
      userId: anotherInstructorId,
      courseIds: [],
    });

    await CourseModel.create({
      _id: courseId3,
      title: "Another Instructor Course",
      description: "Course by another instructor",
      instructorId: anotherInstructorId,

      deleted: false,
    });

    await StudentDataModel.findOneAndUpdate(
      { userId: studentUserId },
      {
        $push: {
          enrolledCourses: [courseId1, courseId3],
        },
      }
    );
  });

  afterEach(async () => {
    await appStop();
    await mongoUnit.drop();
  });

  it("allows instructor to fetch their own courses", async () => {
    const token = await getToken(instructorUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `query FetchCourses($forUserId: ID!) {
          fetchCourses(forUserId: $forUserId) {
            _id
            title
            description
            instructorId
            sectionIds
            deleted
          }
        }`,
        variables: {
          forUserId: instructorUserId,
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const courses = response.body.data.fetchCourses;
    expect(courses).to.be.an("array").with.length(2);

    const courseTitles = courses.map((c: any) => c.title);
    expect(courseTitles).to.include("Instructor Course 1");
    expect(courseTitles).to.include("Instructor Course 2");
    expect(courseTitles).to.not.include("Another Instructor Course");

    courses.forEach((course: any) => {
      expect(course.instructorId).to.equal(instructorUserId);
    });
  });

  it("allows student to fetch their enrolled courses", async () => {
    const token = await getToken(studentUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `query FetchCourses($forUserId: ID!) {
          fetchCourses(forUserId: $forUserId) {
            _id
            title
            description
            instructorId
            sectionIds
            deleted
          }
        }`,
        variables: {
          forUserId: studentUserId,
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const courses = response.body.data.fetchCourses;
    expect(courses).to.be.an("array").with.length(2);

    const courseTitles = courses.map((c: any) => c.title);
    expect(courseTitles).to.include("Instructor Course 1");
    expect(courseTitles).to.include("Another Instructor Course");
    expect(courseTitles).to.not.include("Instructor Course 2");

    const courseIds = courses.map((c: any) => c._id);
    expect(courseIds).to.include(courseId1);
    expect(courseIds).to.include(courseId3);
    expect(courseIds).to.not.include(courseId2);
  });

  it("allows admin to fetch courses for any user", async () => {
    const adminUserId = new ObjectId().toString();
    await UserModel.create({
      _id: adminUserId,
      googleId: "admin-google-id",
      name: "Test Admin",
      email: "admin@test.com",
      userRole: "ADMIN",
      loginService: "GOOGLE",
      educationalRole: EducationalRole.INSTRUCTOR,
    });

    const token = await getToken(adminUserId, UserRole.ADMIN);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `query FetchCourses($forUserId: ID!) {
          fetchCourses(forUserId: $forUserId) {
            _id
            title
            instructorId
          }
        }`,
        variables: {
          forUserId: instructorUserId,
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const courses = response.body.data.fetchCourses;
    expect(courses).to.be.an("array").with.length(2);

    courses.forEach((course: any) => {
      expect(course.instructorId).to.equal(instructorUserId);
    });
  });

  it("returns empty array for user with no educational role", async () => {
    const userWithoutRole = new ObjectId().toString();
    await UserModel.create({
      _id: userWithoutRole,
      googleId: "no-role-google-id",
      name: "User Without Role",
      email: "norole@test.com",
      userRole: "USER",
      loginService: "GOOGLE",
      // no educationalRole field
    });

    const token = await getToken(userWithoutRole, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `query FetchCourses($forUserId: ID!) {
          fetchCourses(forUserId: $forUserId) {
            _id
            title
          }
        }`,
        variables: {
          forUserId: userWithoutRole,
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const courses = response.body.data.fetchCourses;
    expect(courses).to.be.an("array").that.is.empty;
  });

  it("returns empty array for student with no student data", async () => {
    const studentWithoutData = new ObjectId().toString();
    await UserModel.create({
      _id: studentWithoutData,
      googleId: "student-no-data-google-id",
      name: "Student Without Data",
      email: "studentnodata@test.com",
      userRole: "USER",
      loginService: "GOOGLE",
      educationalRole: EducationalRole.STUDENT,
    });

    const token = await getToken(studentWithoutData, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `query FetchCourses($forUserId: ID!) {
          fetchCourses(forUserId: $forUserId) {
            _id
            title
          }
        }`,
        variables: {
          forUserId: studentWithoutData,
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const courses = response.body.data.fetchCourses;
    expect(courses).to.be.an("array").that.is.empty;
  });

  it("returns empty array for student with no enrolled courses", async () => {
    const studentWithoutCourses = new ObjectId().toString();
    await UserModel.create({
      _id: studentWithoutCourses,
      googleId: "student-no-courses-google-id",
      name: "Student Without Courses",
      email: "studentnocourses@test.com",
      userRole: "USER",
      loginService: "GOOGLE",
      educationalRole: EducationalRole.STUDENT,
    });

    await StudentDataModel.create({
      userId: studentWithoutCourses,
      enrolledCourses: [],
      enrolledSections: [],
      assignmentProgress: [],
      deleted: false,
    });

    const token = await getToken(studentWithoutCourses, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `query FetchCourses($forUserId: ID!) {
          fetchCourses(forUserId: $forUserId) {
            _id
            title
          }
        }`,
        variables: {
          forUserId: studentWithoutCourses,
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const courses = response.body.data.fetchCourses;
    expect(courses).to.be.an("array").that.is.empty;
  });

  it("throws error when non-authenticated user tries to fetch courses", async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `query FetchCourses($forUserId: ID!) {
          fetchCourses(forUserId: $forUserId) {
            _id
          }
        }`,
        variables: {
          forUserId: instructorUserId,
        },
      });

    expect(response.status).to.equal(200);
    expect(
      response.body.errors.find((e: any) =>
        e.message.includes("authenticated user required")
      )
    ).to.exist;
  });

  it("throws error when user tries to fetch another user's courses", async () => {
    const unauthorizedUserId = new ObjectId().toString();
    await UserModel.create({
      _id: unauthorizedUserId,
      googleId: "unauthorized-google-id",
      name: "Unauthorized User",
      email: "unauthorized@test.com",
      userRole: "USER",
      loginService: "GOOGLE",
      educationalRole: EducationalRole.STUDENT,
    });

    const token = await getToken(unauthorizedUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `query FetchCourses($forUserId: ID!) {
          fetchCourses(forUserId: $forUserId) {
            _id
          }
        }`,
        variables: {
          forUserId: instructorUserId,
        },
      });

    expect(response.status).to.equal(200);
    expect(
      response.body.errors.find((e: any) =>
        e.message.includes("Unauthorized: You may only view your own courses")
      )
    ).to.exist;
  });

  it("throws error when user not found", async () => {
    const token = await getToken("000000000000000000000000", UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `query FetchCourses($forUserId: ID!) {
          fetchCourses(forUserId: $forUserId) {
            _id
          }
        }`,
        variables: {
          forUserId: "000000000000000000000000",
        },
      });
    expect(response.status).to.equal(200);
    expect(
      response.body.errors.find((e: any) =>
        e.message.includes("user not found")
      )
    ).to.exist;
  });
});
