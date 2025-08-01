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
import { UserRole } from "../../../src/schemas/models/User";
import StudentDataModel from "../../../src/schemas/models/StudentData";
import CourseModel from "../../../src/schemas/models/Course";
import SectionModel from "../../../src/schemas/models/Section";
import mongoose from "mongoose";

const { ObjectId } = mongoose.Types;

describe("modify section enrollment", () => {
  let app: Express;
  let courseId: string;
  let sectionId: string;
  let instructorUserId: string;
  let studentUserId: string;

  beforeEach(async () => {
    await mongoUnit.load(require("../../fixtures/mongodb/data-default.js"));
    app = await createApp();
    await appStart();

    instructorUserId = "5ffdf1231ee2c62320b49a99";
    studentUserId = "5ffdf1231ee2c62320b49b99";
    courseId = new ObjectId().toString();
    sectionId = new ObjectId().toString();

    await SectionModel.create({
      _id: sectionId,
      title: "Test Section",
      sectionCode: "TEST001",
      description: "Test Section Description",
      instructorId: instructorUserId,
      assignments: [],
      numOptionalAssignmentsRequired: 0,
      deleted: false,
    });

    await CourseModel.create({
      _id: courseId,
      title: "Test Course",
      description: "Test Description",
      instructorId: instructorUserId,
      sectionIds: [sectionId],
      deleted: false,
    });

    await StudentDataModel.create({
      userId: studentUserId,
      enrolledCourses: [],
      enrolledSections: [],
      assignmentProgress: [],
      deleted: false,
    });
  });

  afterEach(async () => {
    await appStop();
    await mongoUnit.drop();
  });

  it("allows instructor to enroll a student in a section", async () => {
    const token = await getToken(instructorUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation ModifySectionEnrollment($targetUserId: ID!, $courseId: ID!, $sectionId: ID!, $action: SectionEnrollmentAction!) {
          modifySectionEnrollment(targetUserId: $targetUserId, courseId: $courseId, sectionId: $sectionId, action: $action) {
            _id
            userId
            enrolledSections
          }
        }`,
        variables: {
          targetUserId: studentUserId,
          courseId: courseId,
          sectionId: sectionId,
          action: "ENROLL",
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const enrollmentData = response.body.data.modifySectionEnrollment;
    expect(enrollmentData.userId).to.equal(studentUserId);
    expect(enrollmentData.enrolledSections).to.include(sectionId);

    const studentData = await StudentDataModel.findOne({ userId: studentUserId });
    expect(studentData?.enrolledSections).to.include(sectionId);
  });

  it("allows student to enroll themselves in a section", async () => {
    const token = await getToken(studentUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation ModifySectionEnrollment($targetUserId: ID!, $courseId: ID!, $sectionId: ID!, $action: SectionEnrollmentAction!) {
          modifySectionEnrollment(targetUserId: $targetUserId, courseId: $courseId, sectionId: $sectionId, action: $action) {
            _id
            userId
            enrolledSections
          }
        }`,
        variables: {
          targetUserId: studentUserId,
          courseId: courseId,
          sectionId: sectionId,
          action: "ENROLL",
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const enrollmentData = response.body.data.modifySectionEnrollment;
    expect(enrollmentData.userId).to.equal(studentUserId);
    expect(enrollmentData.enrolledSections).to.include(sectionId);

    const studentData = await StudentDataModel.findOne({ userId: studentUserId });
    expect(studentData?.enrolledSections).to.include(sectionId);
  });

  it("allows instructor to remove a student from a section", async () => {
    const studentData = await StudentDataModel.findOne({ userId: studentUserId });
    studentData?.enrolledSections.push(sectionId);
    await studentData?.save();

    const token = await getToken(instructorUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation ModifySectionEnrollment($targetUserId: ID!, $courseId: ID!, $sectionId: ID!, $action: SectionEnrollmentAction!) {
          modifySectionEnrollment(targetUserId: $targetUserId, courseId: $courseId, sectionId: $sectionId, action: $action) {
            _id
            userId
            enrolledSections
          }
        }`,
        variables: {
          targetUserId: studentUserId,
          courseId: courseId,
          sectionId: sectionId,
          action: "REMOVE",
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const enrollmentData = response.body.data.modifySectionEnrollment;
    expect(enrollmentData.userId).to.equal(studentUserId);
    expect(enrollmentData.enrolledSections).to.not.include(sectionId);

    const updatedStudentData = await StudentDataModel.findOne({ userId: studentUserId });
    expect(updatedStudentData?.enrolledSections).to.not.include(sectionId);
  });

  it("allows admin to modify any user's section enrollment", async () => {
    const token = await getToken(instructorUserId, UserRole.ADMIN);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation ModifySectionEnrollment($targetUserId: ID!, $courseId: ID!, $sectionId: ID!, $action: SectionEnrollmentAction!) {
          modifySectionEnrollment(targetUserId: $targetUserId, courseId: $courseId, sectionId: $sectionId, action: $action) {
            _id
            userId
            enrolledSections
          }
        }`,
        variables: {
          targetUserId: studentUserId,
          courseId: courseId,
          sectionId: sectionId,
          action: "ENROLL",
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const enrollmentData = response.body.data.modifySectionEnrollment;
    expect(enrollmentData.userId).to.equal(studentUserId);
    expect(enrollmentData.enrolledSections).to.include(sectionId);

    const studentData = await StudentDataModel.findOne({ userId: studentUserId });
    expect(studentData?.enrolledSections).to.include(sectionId);
  });

  it("throws error when non-authenticated user tries to modify enrollment", async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `mutation ModifySectionEnrollment($targetUserId: ID!, $courseId: ID!, $sectionId: ID!, $action: SectionEnrollmentAction!) {
          modifySectionEnrollment(targetUserId: $targetUserId, courseId: $courseId, sectionId: $sectionId, action: $action) {
            _id
          }
        }`,
        variables: {
          targetUserId: studentUserId,
          courseId: courseId,
          sectionId: sectionId,
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
        query: `mutation ModifySectionEnrollment($targetUserId: ID!, $courseId: ID!, $sectionId: ID!, $action: SectionEnrollmentAction!) {
          modifySectionEnrollment(targetUserId: $targetUserId, courseId: $courseId, sectionId: $sectionId, action: $action) {
            _id
          }
        }`,
        variables: {
          targetUserId: studentUserId,
          courseId: courseId,
          sectionId: sectionId,
          action: "ENROLL",
        },
      });

    expect(response.status).to.equal(200);
    expect(
      response.body.errors.find((e: any) =>
        e.message.includes("unauthorized: requesting user must be target user, course instructor or admin")
      )
    ).to.exist;
  });

  it("throws error when course not found", async () => {
    const token = await getToken(instructorUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation ModifySectionEnrollment($targetUserId: ID!, $courseId: ID!, $sectionId: ID!, $action: SectionEnrollmentAction!) {
          modifySectionEnrollment(targetUserId: $targetUserId, courseId: $courseId, sectionId: $sectionId, action: $action) {
            _id
          }
        }`,
        variables: {
          targetUserId: studentUserId,
          courseId: "000000000000000000000000",
          sectionId: sectionId,
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

  it("throws error when section not found", async () => {
    const token = await getToken(instructorUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation ModifySectionEnrollment($targetUserId: ID!, $courseId: ID!, $sectionId: ID!, $action: SectionEnrollmentAction!) {
          modifySectionEnrollment(targetUserId: $targetUserId, courseId: $courseId, sectionId: $sectionId, action: $action) {
            _id
          }
        }`,
        variables: {
          targetUserId: studentUserId,
          courseId: courseId,
          sectionId: "000000000000000000000000",
          action: "ENROLL",
        },
      });

    expect(response.status).to.equal(200);
    expect(
      response.body.errors.find((e: any) =>
        e.message.includes("section not found")
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
        query: `mutation ModifySectionEnrollment($targetUserId: ID!, $courseId: ID!, $sectionId: ID!, $action: SectionEnrollmentAction!) {
          modifySectionEnrollment(targetUserId: $targetUserId, courseId: $courseId, sectionId: $sectionId, action: $action) {
            _id
          }
        }`,
        variables: {
          targetUserId: userWithoutStudentData,
          courseId: courseId,
          sectionId: sectionId,
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

  it("throws error when section does not belong to course", async () => {
    const anotherSectionId = new ObjectId().toString();
    await SectionModel.create({
      _id: anotherSectionId,
      title: "Another Section",
      sectionCode: "TEST002",
      description: "Another Section Description",
      instructorId: instructorUserId,
      assignments: [],
      numOptionalAssignmentsRequired: 0,
      deleted: false,
    });

    const token = await getToken(instructorUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation ModifySectionEnrollment($targetUserId: ID!, $courseId: ID!, $sectionId: ID!, $action: SectionEnrollmentAction!) {
          modifySectionEnrollment(targetUserId: $targetUserId, courseId: $courseId, sectionId: $sectionId, action: $action) {
            _id
          }
        }`,
        variables: {
          targetUserId: studentUserId,
          courseId: courseId,
          sectionId: anotherSectionId,
          action: "ENROLL",
        },
      });

    expect(response.status).to.equal(200);
    expect(
      response.body.errors.find((e: any) =>
        e.message.includes("section does not belong to the specified course")
      )
    ).to.exist;
  });

  it("throws error when trying to enroll user already enrolled", async () => {
    const studentData = await StudentDataModel.findOne({ userId: studentUserId });
    studentData?.enrolledSections.push(sectionId);
    await studentData?.save();

    const token = await getToken(instructorUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation ModifySectionEnrollment($targetUserId: ID!, $courseId: ID!, $sectionId: ID!, $action: SectionEnrollmentAction!) {
          modifySectionEnrollment(targetUserId: $targetUserId, courseId: $courseId, sectionId: $sectionId, action: $action) {
            _id
          }
        }`,
        variables: {
          targetUserId: studentUserId,
          courseId: courseId,
          sectionId: sectionId,
          action: "ENROLL",
        },
      });

    expect(response.status).to.equal(200);
    expect(
      response.body.errors.find((e: any) =>
        e.message.includes("user is already enrolled in this section")
      )
    ).to.exist;
  });

  it("throws error when trying to remove user not enrolled", async () => {
    const token = await getToken(instructorUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation ModifySectionEnrollment($targetUserId: ID!, $courseId: ID!, $sectionId: ID!, $action: SectionEnrollmentAction!) {
          modifySectionEnrollment(targetUserId: $targetUserId, courseId: $courseId, sectionId: $sectionId, action: $action) {
            _id
          }
        }`,
        variables: {
          targetUserId: studentUserId,
          courseId: courseId,
          sectionId: sectionId,
          action: "REMOVE",
        },
      });

    expect(response.status).to.equal(200);
    expect(
      response.body.errors.find((e: any) =>
        e.message.includes("user is not enrolled in this section")
      )
    ).to.exist;
  });
});