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
import SectionModel from "../../../src/schemas/models/Section";
import StudentDataModel from "../../../src/schemas/models/StudentData";
import mongoose from "mongoose";

const { ObjectId } = mongoose.Types;

describe("fetch sections", () => {
  let app: Express;
  let instructorUserId: string;
  let studentUserId: string;
  let sectionId1: string;
  let sectionId2: string;
  let sectionId3: string;

  beforeEach(async () => {
    await mongoUnit.load(require("../../fixtures/mongodb/data-default.js"));
    app = await createApp();
    await appStart();

    instructorUserId = new ObjectId().toString();
    studentUserId = new ObjectId().toString();
    sectionId1 = new ObjectId().toString();
    sectionId2 = new ObjectId().toString();
    sectionId3 = new ObjectId().toString();

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

    // Create sections for instructor
    await SectionModel.create({
      _id: sectionId1,
      title: "Instructor Section 1",
      sectionCode: "INST001",
      description: "First section by instructor",
      instructorId: instructorUserId,
      assignments: [],
      numOptionalAssignmentsRequired: 0,
      deleted: false,
    });

    await SectionModel.create({
      _id: sectionId2,
      title: "Instructor Section 2",
      sectionCode: "INST002",
      description: "Second section by instructor",
      instructorId: instructorUserId,
      assignments: [],
      numOptionalAssignmentsRequired: 0,
      deleted: false,
    });

    // Create section by another instructor
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

    await SectionModel.create({
      _id: sectionId3,
      title: "Another Instructor Section",
      sectionCode: "OTHER001",
      description: "Section by another instructor",
      instructorId: anotherInstructorId,
      assignments: [],
      numOptionalAssignmentsRequired: 0,
      deleted: false,
    });

    // Create student data with enrolled sections
    await StudentDataModel.create({
      userId: studentUserId,
      enrolledCourses: [],
      enrolledSections: [sectionId1, sectionId3],
      assignmentProgress: [],
      deleted: false,
    });
  });

  afterEach(async () => {
    await appStop();
    await mongoUnit.drop();
  });

  it("allows instructor to fetch their own sections", async () => {
    const token = await getToken(instructorUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `query FetchSections($forUserId: ID!) {
          fetchSections(forUserId: $forUserId) {
            _id
            title
            sectionCode
            description
            instructorId
            assignments {
              assignmentId
              mandatory
            }
            numOptionalAssignmentsRequired
            deleted
          }
        }`,
        variables: {
          forUserId: instructorUserId,
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const sections = response.body.data.fetchSections;
    expect(sections).to.be.an("array").with.length(2);

    const sectionTitles = sections.map((s: any) => s.title);
    expect(sectionTitles).to.include("Instructor Section 1");
    expect(sectionTitles).to.include("Instructor Section 2");
    expect(sectionTitles).to.not.include("Another Instructor Section");

    sections.forEach((section: any) => {
      expect(section.instructorId).to.equal(instructorUserId);
    });
  });

  it("allows student to fetch their enrolled sections", async () => {
    const token = await getToken(studentUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `query FetchSections($forUserId: ID!) {
          fetchSections(forUserId: $forUserId) {
            _id
            title
            sectionCode
            description
            instructorId
            assignments {
              assignmentId
              mandatory
            }
            numOptionalAssignmentsRequired
            deleted
          }
        }`,
        variables: {
          forUserId: studentUserId,
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const sections = response.body.data.fetchSections;
    expect(sections).to.be.an("array").with.length(2);

    const sectionTitles = sections.map((s: any) => s.title);
    expect(sectionTitles).to.include("Instructor Section 1");
    expect(sectionTitles).to.include("Another Instructor Section");
    expect(sectionTitles).to.not.include("Instructor Section 2");

    const sectionIds = sections.map((s: any) => s._id);
    expect(sectionIds).to.include(sectionId1);
    expect(sectionIds).to.include(sectionId3);
    expect(sectionIds).to.not.include(sectionId2);
  });

  it("allows admin to fetch sections for any user", async () => {
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
        query: `query FetchSections($forUserId: ID!) {
          fetchSections(forUserId: $forUserId) {
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

    const sections = response.body.data.fetchSections;
    expect(sections).to.be.an("array").with.length(2);

    sections.forEach((section: any) => {
      expect(section.instructorId).to.equal(instructorUserId);
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
        query: `query FetchSections($forUserId: ID!) {
          fetchSections(forUserId: $forUserId) {
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

    const sections = response.body.data.fetchSections;
    expect(sections).to.be.an("array").that.is.empty;
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
        query: `query FetchSections($forUserId: ID!) {
          fetchSections(forUserId: $forUserId) {
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

    const sections = response.body.data.fetchSections;
    expect(sections).to.be.an("array").that.is.empty;
  });

  it("returns empty array for student with no enrolled sections", async () => {
    const studentWithoutSections = new ObjectId().toString();
    await UserModel.create({
      _id: studentWithoutSections,
      googleId: "student-no-sections-google-id",
      name: "Student Without Sections",
      email: "studentnosections@test.com",
      userRole: "USER",
      loginService: "GOOGLE",
      educationalRole: EducationalRole.STUDENT,
    });

    await StudentDataModel.create({
      userId: studentWithoutSections,
      enrolledCourses: [],
      enrolledSections: [],
      assignmentProgress: [],
      deleted: false,
    });

    const token = await getToken(studentWithoutSections, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `query FetchSections($forUserId: ID!) {
          fetchSections(forUserId: $forUserId) {
            _id
            title
          }
        }`,
        variables: {
          forUserId: studentWithoutSections,
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const sections = response.body.data.fetchSections;
    expect(sections).to.be.an("array").that.is.empty;
  });

  it("throws error when non-authenticated user tries to fetch sections", async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `query FetchSections($forUserId: ID!) {
          fetchSections(forUserId: $forUserId) {
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

  it("throws error when user tries to fetch another user's sections", async () => {
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
        query: `query FetchSections($forUserId: ID!) {
          fetchSections(forUserId: $forUserId) {
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
        e.message.includes("Unauthorized: You may only view your own sections")
      )
    ).to.exist;
  });

  it("throws error when user not found", async () => {
    const token = await getToken("000000000000000000000000", UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `query FetchSections($forUserId: ID!) {
          fetchSections(forUserId: $forUserId) {
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
