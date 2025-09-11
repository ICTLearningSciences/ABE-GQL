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
import StudentDataModel from "../../../src/schemas/models/StudentData";
import CourseModel from "../../../src/schemas/models/Course";
import mongoose from "mongoose";
import InstructorDataModel from "../../../src/schemas/models/InstructorData";

const { ObjectId } = mongoose.Types;

describe("modify course enrollment", () => {
  let app: Express;
  let courseId: string;
  let instructorUserId: string;
  let studentUserId: string;

  beforeEach(async () => {
    await mongoUnit.load(require("../../fixtures/mongodb/data-default.js"));
    app = await createApp();
    await appStart();

    instructorUserId = "5ffdf1231ee2c62320b49a99";
    studentUserId = "5ffdf1231ee2c62320b49b99";
    courseId = new ObjectId().toString();

    await InstructorDataModel.create({
      userId: instructorUserId,
    });

    await StudentDataModel.create({
      userId: studentUserId,
      enrolledCourses: [],
      enrolledSections: [],
      assignmentProgress: [],
      deleted: false,
    });

    await CourseModel.create({
      _id: courseId,
      title: "Test Course",
      description: "Test Description",
      instructorId: instructorUserId,
      sectionIds: [],
      deleted: false,
    });
  });

  afterEach(async () => {
    await appStop();
    await mongoUnit.drop();
  });

  it("allows instructor to enroll a student in their course", async () => {
    const token = await getToken(instructorUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation ModifyCourseEnrollment($targetUserId: ID!, $courseId: ID!, $action: EnrollmentAction!) {
          modifyCourseEnrollment(targetUserId: $targetUserId, courseId: $courseId, action: $action) {
            _id
            userId
            enrolledCourses
          }
        }`,
        variables: {
          targetUserId: studentUserId,
          courseId: courseId,
          action: "ENROLL",
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const enrollmentData = response.body.data.modifyCourseEnrollment;
    expect(enrollmentData.userId).to.equal(studentUserId);
    expect(enrollmentData.enrolledCourses).to.include(courseId);

    const studentData = await StudentDataModel.findOne({
      userId: studentUserId,
    });
    expect(studentData?.enrolledCourses).to.include(courseId);
  });

  it("allows student to enroll themselves in a course", async () => {
    const token = await getToken(studentUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation ModifyCourseEnrollment($targetUserId: ID!, $courseId: ID!, $action: EnrollmentAction!) {
          modifyCourseEnrollment(targetUserId: $targetUserId, courseId: $courseId, action: $action) {
            _id
            userId
            enrolledCourses
          }
        }`,
        variables: {
          targetUserId: studentUserId,
          courseId: courseId,
          action: "ENROLL",
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const enrollmentData = response.body.data.modifyCourseEnrollment;
    expect(enrollmentData.userId).to.equal(studentUserId);
    expect(enrollmentData.enrolledCourses).to.include(courseId);

    const studentData = await StudentDataModel.findOne({
      userId: studentUserId,
    });
    expect(studentData?.enrolledCourses).to.include(courseId);
  });

  it("allows instructor to remove a student from their course", async () => {
    await StudentDataModel.findOneAndUpdate(
      { userId: studentUserId },
      { $push: { enrolledCourses: courseId } }
    );

    const token = await getToken(instructorUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation ModifyCourseEnrollment($targetUserId: ID!, $courseId: ID!, $action: EnrollmentAction!) {
          modifyCourseEnrollment(targetUserId: $targetUserId, courseId: $courseId, action: $action) {
            _id
            userId
            enrolledCourses
          }
        }`,
        variables: {
          targetUserId: studentUserId,
          courseId: courseId,
          action: "REMOVE",
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const enrollmentData = response.body.data.modifyCourseEnrollment;
    expect(enrollmentData.userId).to.equal(studentUserId);
    expect(enrollmentData.enrolledCourses).to.not.include(courseId);

    const updatedStudentData = await StudentDataModel.findOne({
      userId: studentUserId,
    });
    expect(updatedStudentData?.enrolledCourses).to.not.include(courseId);
  });

  it("allows admin to modify any user's course enrollment", async () => {
    const token = await getToken(instructorUserId, UserRole.ADMIN);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation ModifyCourseEnrollment($targetUserId: ID!, $courseId: ID!, $action: EnrollmentAction!) {
          modifyCourseEnrollment(targetUserId: $targetUserId, courseId: $courseId, action: $action) {
            _id
            userId
            enrolledCourses
          }
        }`,
        variables: {
          targetUserId: studentUserId,
          courseId: courseId,
          action: "ENROLL",
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const enrollmentData = response.body.data.modifyCourseEnrollment;
    expect(enrollmentData.userId).to.equal(studentUserId);
    expect(enrollmentData.enrolledCourses).to.include(courseId);

    const studentData = await StudentDataModel.findOne({
      userId: studentUserId,
    });
    expect(studentData?.enrolledCourses).to.include(courseId);
  });

  it("throws error when non-authenticated user tries to modify enrollment", async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `mutation ModifyCourseEnrollment($targetUserId: ID!, $courseId: ID!, $action: EnrollmentAction!) {
          modifyCourseEnrollment(targetUserId: $targetUserId, courseId: $courseId, action: $action) {
            _id
          }
        }`,
        variables: {
          targetUserId: studentUserId,
          courseId: courseId,
          action: "ENROLL",
        },
      });

    expect(response.status).to.equal(200);
    expect(
      response.body.errors.find((e: any) =>
        e.message.includes("authenticated user required")
      )
    ).to.exist;
  });

  it("throws error when unauthorized user tries to modify another user's enrollment", async () => {
    const unauthorizedUserId = "5ffdf1231ee2c62320b49c99";
    const token = await getToken(unauthorizedUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation ModifyCourseEnrollment($targetUserId: ID!, $courseId: ID!, $action: EnrollmentAction!) {
          modifyCourseEnrollment(targetUserId: $targetUserId, courseId: $courseId, action: $action) {
            _id
          }
        }`,
        variables: {
          targetUserId: studentUserId,
          courseId: courseId,
          action: "ENROLL",
        },
      });

    expect(response.status).to.equal(200);
    expect(
      response.body.errors.find((e: any) =>
        e.message.includes(
          "unauthorized: requesting user must be target user, course instructor or admin"
        )
      )
    ).to.exist;
  });

  it("throws error when target user not found", async () => {
    const token = await getToken(instructorUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation ModifyCourseEnrollment($targetUserId: ID!, $courseId: ID!, $action: EnrollmentAction!) {
          modifyCourseEnrollment(targetUserId: $targetUserId, courseId: $courseId, action: $action) {
            _id
          }
        }`,
        variables: {
          targetUserId: "000000000000000000000000",
          courseId: courseId,
          action: "ENROLL",
        },
      });

    expect(response.status).to.equal(200);
    expect(
      response.body.errors.find((e: any) =>
        e.message.includes("student data not found for target user")
      )
    ).to.exist;
  });

  it("throws error when course not found", async () => {
    const token = await getToken(instructorUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation ModifyCourseEnrollment($targetUserId: ID!, $courseId: ID!, $action: EnrollmentAction!) {
          modifyCourseEnrollment(targetUserId: $targetUserId, courseId: $courseId, action: $action) {
            _id
          }
        }`,
        variables: {
          targetUserId: studentUserId,
          courseId: "000000000000000000000000",
          action: "ENROLL",
        },
      });

    expect(response.status).to.equal(200);
    expect(
      response.body.errors.find((e: any) =>
        e.message.includes("course not found")
      )
    ).to.exist;
  });

  it("throws error when student data not found", async () => {
    const userWithoutStudentData = "5ffdf1231ee2c62320b49d99";
    const token = await getToken(instructorUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation ModifyCourseEnrollment($targetUserId: ID!, $courseId: ID!, $action: EnrollmentAction!) {
          modifyCourseEnrollment(targetUserId: $targetUserId, courseId: $courseId, action: $action) {
            _id
          }
        }`,
        variables: {
          targetUserId: userWithoutStudentData,
          courseId: courseId,
          action: "ENROLL",
        },
      });

    expect(response.status).to.equal(200);
    expect(
      response.body.errors.find((e: any) =>
        e.message.includes("student data not found for target user")
      )
    ).to.exist;
  });

  it("throws error when trying to enroll user already enrolled", async () => {
    await StudentDataModel.findOneAndUpdate(
      { userId: studentUserId },
      { $push: { enrolledCourses: courseId } }
    );

    const token = await getToken(instructorUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation ModifyCourseEnrollment($targetUserId: ID!, $courseId: ID!, $action: EnrollmentAction!) {
          modifyCourseEnrollment(targetUserId: $targetUserId, courseId: $courseId, action: $action) {
            _id
          }
        }`,
        variables: {
          targetUserId: studentUserId,
          courseId: courseId,
          action: "ENROLL",
        },
      });

    expect(response.status).to.equal(200);
    expect(
      response.body.errors.find((e: any) =>
        e.message.includes("user is already enrolled in this course")
      )
    ).to.exist;
  });

  it("throws error when trying to remove user not enrolled", async () => {
    const token = await getToken(instructorUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation ModifyCourseEnrollment($targetUserId: ID!, $courseId: ID!, $action: EnrollmentAction!) {
          modifyCourseEnrollment(targetUserId: $targetUserId, courseId: $courseId, action: $action) {
            _id
          }
        }`,
        variables: {
          targetUserId: studentUserId,
          courseId: courseId,
          action: "REMOVE",
        },
      });

    expect(response.status).to.equal(200);
    expect(
      response.body.errors.find((e: any) =>
        e.message.includes("user is not enrolled in this course")
      )
    ).to.exist;
  });
});
