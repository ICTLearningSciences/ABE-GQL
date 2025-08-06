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

describe("fetch students in my courses", () => {
  let app: Express;
  let instructorUserId: string;
  let student1UserId: string;
  let student2UserId: string;
  let student3UserId: string;
  let courseId1: string;
  let courseId2: string;
  let courseId3: string;

  beforeEach(async () => {
    await mongoUnit.load(require("../../fixtures/mongodb/data-default.js"));
    app = await createApp();
    await appStart();

    instructorUserId = new ObjectId().toString();
    student1UserId = new ObjectId().toString();
    student2UserId = new ObjectId().toString();
    student3UserId = new ObjectId().toString();
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

    // Create student users
    await UserModel.create({
      _id: student1UserId,
      googleId: "student1-google-id",
      name: "Student One",
      email: "student1@test.com",
      userRole: "USER",
      loginService: "GOOGLE",
      educationalRole: EducationalRole.STUDENT,
    });

    await UserModel.create({
      _id: student2UserId,
      googleId: "student2-google-id",
      name: "Student Two",
      email: "student2@test.com",
      userRole: "USER",
      loginService: "GOOGLE",
      educationalRole: EducationalRole.STUDENT,
    });

    await UserModel.create({
      _id: student3UserId,
      googleId: "student3-google-id",
      name: "Student Three",
      email: "student3@test.com",
      userRole: "USER",
      loginService: "GOOGLE",
      educationalRole: EducationalRole.STUDENT,
    });

    // Create instructor data with courses
    await InstructorDataModel.create({
      userId: instructorUserId,
      courseIds: [courseId1, courseId2],
    });

    // Create student data with enrolled courses
    // Student 1 enrolled in course 1
    await StudentDataModel.create({
      userId: student1UserId,
      enrolledCourses: [courseId1],
      enrolledSections: [],
      assignmentProgress: [],
      deleted: false,
    });

    // Student 2 enrolled in course 1 and 2
    await StudentDataModel.create({
      userId: student2UserId,
      enrolledCourses: [courseId1, courseId2],
      enrolledSections: [],
      assignmentProgress: [],
      deleted: false,
    });

    // Student 3 enrolled in course 3 (not instructor's course)
    await StudentDataModel.create({
      userId: student3UserId,
      enrolledCourses: [courseId3],
      enrolledSections: [],
      assignmentProgress: [],
      deleted: false,
    });
  });

  afterEach(async () => {
    await appStop();
    await mongoUnit.drop();
  });

  it("allows instructor to fetch students in their courses", async () => {
    const token = await getToken(instructorUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `query FetchStudentsInMyCourses($instructorId: ID!) {
          fetchStudentsInMyCourses(instructorId: $instructorId) {
            _id
            userId
            enrolledCourses
            enrolledSections
            deleted
          }
        }`,
        variables: {
          instructorId: instructorUserId,
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const studentData = response.body.data.fetchStudentsInMyCourses;
    expect(studentData).to.be.an("array").with.length(2);

    const studentUserIds = studentData.map((s: any) => s.userId);
    expect(studentUserIds).to.include(student1UserId);
    expect(studentUserIds).to.include(student2UserId);
    expect(studentUserIds).to.not.include(student3UserId);

    studentData.forEach((student: any) => {
      expect(student.deleted).to.equal(false);
      expect(student.enrolledCourses).to.be.an("array");
      expect(student.enrolledSections).to.be.an("array");
    });
  });

  it("allows admin to fetch students for any instructor", async () => {
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
        query: `query FetchStudentsInMyCourses($instructorId: ID!) {
          fetchStudentsInMyCourses(instructorId: $instructorId) {
            _id
            userId
            enrolledCourses
          }
        }`,
        variables: {
          instructorId: instructorUserId,
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const studentData = response.body.data.fetchStudentsInMyCourses;
    expect(studentData).to.be.an("array").with.length(2);

    const studentUserIds = studentData.map((s: any) => s.userId);
    expect(studentUserIds).to.include(student1UserId);
    expect(studentUserIds).to.include(student2UserId);
  });

  it("returns empty array for admin when instructor has no instructor data", async () => {
    const adminUserId = new ObjectId().toString();
    const instructorWithoutDataId = new ObjectId().toString();

    await UserModel.create({
      _id: adminUserId,
      googleId: "admin-google-id",
      name: "Test Admin",
      email: "admin@test.com",
      userRole: "ADMIN",
      loginService: "GOOGLE",
      educationalRole: EducationalRole.INSTRUCTOR,
    });

    await UserModel.create({
      _id: instructorWithoutDataId,
      googleId: "instructor-no-data-google-id",
      name: "Instructor Without Data",
      email: "instructornodata@test.com",
      userRole: "USER",
      loginService: "GOOGLE",
      educationalRole: EducationalRole.INSTRUCTOR,
    });

    const token = await getToken(adminUserId, UserRole.ADMIN);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `query FetchStudentsInMyCourses($instructorId: ID!) {
          fetchStudentsInMyCourses(instructorId: $instructorId) {
            _id
            userId
          }
        }`,
        variables: {
          instructorId: instructorWithoutDataId,
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const studentData = response.body.data.fetchStudentsInMyCourses;
    expect(studentData).to.be.an("array").that.is.empty;
  });

  it("returns empty array when instructor has no courses", async () => {
    const instructorWithoutCoursesId = new ObjectId().toString();

    await UserModel.create({
      _id: instructorWithoutCoursesId,
      googleId: "instructor-no-courses-google-id",
      name: "Instructor Without Courses",
      email: "instructornocourses@test.com",
      userRole: "USER",
      loginService: "GOOGLE",
      educationalRole: EducationalRole.INSTRUCTOR,
    });

    await InstructorDataModel.create({
      userId: instructorWithoutCoursesId,
      courseIds: [],
    });

    const token = await getToken(instructorWithoutCoursesId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `query FetchStudentsInMyCourses($instructorId: ID!) {
          fetchStudentsInMyCourses(instructorId: $instructorId) {
            _id
            userId
          }
        }`,
        variables: {
          instructorId: instructorWithoutCoursesId,
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const studentData = response.body.data.fetchStudentsInMyCourses;
    expect(studentData).to.be.an("array").that.is.empty;
  });

  it("returns empty array when no students are enrolled in instructor's courses", async () => {
    const instructorWithoutStudentsId = new ObjectId().toString();
    const unusedCourseId = new ObjectId().toString();

    await UserModel.create({
      _id: instructorWithoutStudentsId,
      googleId: "instructor-no-students-google-id",
      name: "Instructor Without Students",
      email: "instructornostudents@test.com",
      userRole: "USER",
      loginService: "GOOGLE",
      educationalRole: EducationalRole.INSTRUCTOR,
    });

    await InstructorDataModel.create({
      userId: instructorWithoutStudentsId,
      courseIds: [unusedCourseId],
    });

    const token = await getToken(instructorWithoutStudentsId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `query FetchStudentsInMyCourses($instructorId: ID!) {
          fetchStudentsInMyCourses(instructorId: $instructorId) {
            _id
            userId
          }
        }`,
        variables: {
          instructorId: instructorWithoutStudentsId,
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const studentData = response.body.data.fetchStudentsInMyCourses;
    expect(studentData).to.be.an("array").that.is.empty;
  });

  it("throws error when non-admin user tries to fetch another instructor's students", async () => {
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

    const token = await getToken(anotherInstructorId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `query FetchStudentsInMyCourses($instructorId: ID!) {
          fetchStudentsInMyCourses(instructorId: $instructorId) {
            _id
            userId
          }
        }`,
        variables: {
          instructorId: instructorUserId,
        },
      });
    console.log(JSON.stringify(response.body, null, 2));
    expect(response.status).to.equal(200);
    expect(
      response.body.errors.find((e: any) =>
        e.message.includes("Only for instructors/admins")
      )
    ).to.exist;
  });

  it("throws error when student tries to use the query", async () => {
    const token = await getToken(student1UserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `query FetchStudentsInMyCourses($instructorId: ID!) {
          fetchStudentsInMyCourses(instructorId: $instructorId) {
            _id
            userId
          }
        }`,
        variables: {
          instructorId: instructorUserId,
        },
      });

    expect(response.status).to.equal(200);
    expect(
      response.body.errors.find((e: any) =>
        e.message.includes("Only for instructors/admins")
      )
    ).to.exist;
  });

  it("throws error when non-authenticated user tries to fetch students", async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `query FetchStudentsInMyCourses($instructorId: ID!) {
          fetchStudentsInMyCourses(instructorId: $instructorId) {
            _id
            userId
          }
        }`,
        variables: {
          instructorId: instructorUserId,
        },
      });

    expect(response.status).to.equal(200);
    expect(
      response.body.errors.find((e: any) =>
        e.message.includes("authenticated user required")
      )
    ).to.exist;
  });

  it("handles case where some students have been deleted", async () => {
    // Mark student1's data as deleted
    await StudentDataModel.updateOne(
      { userId: student1UserId },
      { deleted: true }
    );

    const token = await getToken(instructorUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `query FetchStudentsInMyCourses($instructorId: ID!) {
          fetchStudentsInMyCourses(instructorId: $instructorId) {
            _id
            userId
          }
        }`,
        variables: {
          instructorId: instructorUserId,
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const studentData = response.body.data.fetchStudentsInMyCourses;
    expect(studentData).to.be.an("array").with.length(1);

    const studentUserIds = studentData.map((s: any) => s.userId);
    expect(studentUserIds).to.include(student2UserId);
    expect(studentUserIds).to.not.include(student1UserId);
  });
});
