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
import SectionModel from "../../../src/schemas/models/Section";
import mongoose from "mongoose";
import InstructorDataModel from "../../../src/schemas/models/InstructorData";
import CourseModel from "../../../src/schemas/models/Course";

const { ObjectId } = mongoose.Types;

describe("ban student from section", () => {
  let app: Express;
  let sectionId: string;
  let instructorUserId: string;
  let studentUserId: string;
  let courseId: string;
  beforeEach(async () => {
    await mongoUnit.load(require("../../fixtures/mongodb/data-default.js"));
    app = await createApp();
    await appStart();

    instructorUserId = "5ffdf1231ee2c62320b49a99";
    studentUserId = "5ffdf1231ee2c62320b49b99";
    sectionId = new ObjectId().toString();
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

    await SectionModel.create({
      _id: sectionId,
      title: "Test Section",
      sectionCode: "TEST001",
      description: "Test Section Description",
      instructorId: instructorUserId,
      assignments: [],
      numOptionalAssignmentsRequired: 0,
      bannedStudentUserIds: [],
      deleted: false,
    });

    await CourseModel.create({
      _id: courseId,
      title: "Test Course",
      description: "Test Course Description",
      instructorId: instructorUserId,
      deleted: false,
      sectionIds: [sectionId],
    });

    await StudentDataModel.findOneAndUpdate(
      { userId: studentUserId },
      { $push: { enrolledCourses: courseId, enrolledSections: sectionId } }
    );
  });

  afterEach(async () => {
    await appStop();
    await mongoUnit.drop();
  });

  it("allows instructor to ban a student from section", async () => {
    const token = await getToken(instructorUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation ModifyStudentBanInSection($sectionId: ID!, $studentId: ID!, $action: BanStudentFromSectionAction!) {
          modifyStudentBanInSection(sectionId: $sectionId, studentId: $studentId, action: $action) {
            _id
            bannedStudentUserIds
          }
        }`,
        variables: {
          sectionId: sectionId,
          studentId: studentUserId,
          action: "BAN",
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const sectionData = response.body.data.modifyStudentBanInSection;
    expect(sectionData.bannedStudentUserIds).to.include(studentUserId);

    const updatedSection = await SectionModel.findById(sectionId);
    expect(updatedSection?.bannedStudentUserIds).to.include(studentUserId);

    const updatedStudent = await StudentDataModel.findOne({
      userId: studentUserId,
    });
    expect(updatedStudent?.enrolledSections).to.not.include(sectionId);
  });

  it("allows admin to ban a student from section", async () => {
    const token = await getToken(instructorUserId, UserRole.ADMIN);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation ModifyStudentBanInSection($sectionId: ID!, $studentId: ID!, $action: BanStudentFromSectionAction!) {
          modifyStudentBanInSection(sectionId: $sectionId, studentId: $studentId, action: $action) {
            _id
            bannedStudentUserIds
          }
        }`,
        variables: {
          sectionId: sectionId,
          studentId: studentUserId,
          action: "BAN",
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const sectionData = response.body.data.modifyStudentBanInSection;
    expect(sectionData.bannedStudentUserIds).to.include(studentUserId);
  });

  it("allows instructor to unban a student from section", async () => {
    await SectionModel.findByIdAndUpdate(sectionId, {
      $push: { bannedStudentUserIds: studentUserId },
    });

    const token = await getToken(instructorUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation ModifyStudentBanInSection($sectionId: ID!, $studentId: ID!, $action: BanStudentFromSectionAction!) {
          modifyStudentBanInSection(sectionId: $sectionId, studentId: $studentId, action: $action) {
            _id
            bannedStudentUserIds
          }
        }`,
        variables: {
          sectionId: sectionId,
          studentId: studentUserId,
          action: "UNBAN",
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const sectionData = response.body.data.modifyStudentBanInSection;
    expect(sectionData.bannedStudentUserIds).to.not.include(studentUserId);

    const updatedSection = await SectionModel.findById(sectionId);
    expect(updatedSection?.bannedStudentUserIds).to.not.include(studentUserId);
  });

  it("throws error when non-authenticated user tries to ban student", async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `mutation ModifyStudentBanInSection($sectionId: ID!, $studentId: ID!, $action: BanStudentFromSectionAction!) {
          modifyStudentBanInSection(sectionId: $sectionId, studentId: $studentId, action: $action) {
            _id
          }
        }`,
        variables: {
          sectionId: sectionId,
          studentId: studentUserId,
          action: "BAN",
        },
      });

    expect(response.status).to.equal(200);
    expect(
      response.body.errors.find((e: any) =>
        e.message.includes("authenticated user required")
      )
    ).to.exist;
  });

  it("throws error when non-instructor/non-admin tries to ban student", async () => {
    const unauthorizedUserId = "5ffdf1231ee2c62320b49c99";
    const token = await getToken(unauthorizedUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation ModifyStudentBanInSection($sectionId: ID!, $studentId: ID!, $action: BanStudentFromSectionAction!) {
          modifyStudentBanInSection(sectionId: $sectionId, studentId: $studentId, action: $action) {
            _id
          }
        }`,
        variables: {
          sectionId: sectionId,
          studentId: studentUserId,
          action: "BAN",
        },
      });

    expect(response.status).to.equal(200);
    expect(
      response.body.errors.find((e: any) =>
        e.message.includes("instructors/admins only")
      )
    ).to.exist;
  });

  it("throws error when student not found", async () => {
    const token = await getToken(instructorUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation ModifyStudentBanInSection($sectionId: ID!, $studentId: ID!, $action: BanStudentFromSectionAction!) {
          modifyStudentBanInSection(sectionId: $sectionId, studentId: $studentId, action: $action) {
            _id
          }
        }`,
        variables: {
          sectionId: sectionId,
          studentId: "000000000000000000000000",
          action: "BAN",
        },
      });

    expect(response.status).to.equal(200);
    expect(
      response.body.errors.find((e: any) =>
        e.message.includes("student not found")
      )
    ).to.exist;
  });

  it("throws error when section not found", async () => {
    const token = await getToken(instructorUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation ModifyStudentBanInSection($sectionId: ID!, $studentId: ID!, $action: BanStudentFromSectionAction!) {
          modifyStudentBanInSection(sectionId: $sectionId, studentId: $studentId, action: $action) {
            _id
          }
        }`,
        variables: {
          sectionId: "000000000000000000000000",
          studentId: studentUserId,
          action: "BAN",
        },
      });

    expect(response.status).to.equal(200);
    expect(
      response.body.errors.find((e: any) =>
        e.message.includes("section not found")
      )
    ).to.exist;
  });

  it("banning removes student from section AND course enrollment", async () => {
    const token = await getToken(instructorUserId, UserRole.USER);

    const initialStudent = await StudentDataModel.findOne({
      userId: studentUserId,
    });
    expect(initialStudent?.enrolledSections).to.include(sectionId);
    expect(initialStudent?.enrolledCourses).to.include(courseId);
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation ModifyStudentBanInSection($sectionId: ID!, $studentId: ID!, $action: BanStudentFromSectionAction!) {
          modifyStudentBanInSection(sectionId: $sectionId, studentId: $studentId, action: $action) {
            _id
            bannedStudentUserIds
          }
        }`,
        variables: {
          sectionId: sectionId,
          studentId: studentUserId,
          action: "BAN",
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const updatedStudent = await StudentDataModel.findOne({
      userId: studentUserId,
    });
    expect(updatedStudent?.enrolledSections).to.not.include(sectionId);
    expect(updatedStudent?.enrolledCourses).to.not.include(courseId);
  });

  it("can ban student who is not currently enrolled", async () => {
    await StudentDataModel.findOneAndUpdate(
      { userId: studentUserId },
      { $pull: { enrolledSections: sectionId } }
    );

    const token = await getToken(instructorUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation ModifyStudentBanInSection($sectionId: ID!, $studentId: ID!, $action: BanStudentFromSectionAction!) {
          modifyStudentBanInSection(sectionId: $sectionId, studentId: $studentId, action: $action) {
            _id
            bannedStudentUserIds
          }
        }`,
        variables: {
          sectionId: sectionId,
          studentId: studentUserId,
          action: "BAN",
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const sectionData = response.body.data.modifyStudentBanInSection;
    expect(sectionData.bannedStudentUserIds).to.include(studentUserId);
  });
});
