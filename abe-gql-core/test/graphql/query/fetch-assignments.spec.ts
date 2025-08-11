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
import AssignmentModel from "../../../src/schemas/models/Assignment";
import SectionModel from "../../../src/schemas/models/Section";
import StudentDataModel from "../../../src/schemas/models/StudentData";
import mongoose from "mongoose";
import InstructorDataModel from "../../../src/schemas/models/InstructorData";

const { ObjectId } = mongoose.Types;

describe("fetch assignments", () => {
  let app: Express;
  let instructorUserId: string;
  let studentUserId: string;
  let assignmentId1: string;
  let assignmentId2: string;
  let assignmentId3: string;
  let sectionId1: string;
  let sectionId2: string;
  let sectionId3: string;

  beforeEach(async () => {
    await mongoUnit.load(require("../../fixtures/mongodb/data-default.js"));
    app = await createApp();
    await appStart();

    instructorUserId = new ObjectId().toString();
    studentUserId = new ObjectId().toString();
    assignmentId1 = new ObjectId().toString();
    assignmentId2 = new ObjectId().toString();
    assignmentId3 = new ObjectId().toString();
    sectionId1 = new ObjectId().toString();
    sectionId2 = new ObjectId().toString();
    sectionId3 = new ObjectId().toString();

    await UserModel.create({
      _id: instructorUserId,
      googleId: "instructor-google-id",
      name: "Test Instructor",
      email: "instructor@test.com",
      userRole: "USER",
      loginService: "GOOGLE",
      educationalRole: EducationalRole.INSTRUCTOR,
    });

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

    await InstructorDataModel.create({
      userId: instructorUserId,
      courseIds: [],
    });

    // Create assignments for instructor
    await AssignmentModel.create({
      _id: assignmentId1,
      title: "Instructor Assignment 1",
      description: "First assignment by instructor",
      activityIds: [],
      instructorId: instructorUserId,
      deleted: false,
    });

    await AssignmentModel.create({
      _id: assignmentId2,
      title: "Instructor Assignment 2",
      description: "Second assignment by instructor",
      activityIds: [],
      instructorId: instructorUserId,
      deleted: false,
    });

    // Create assignment by another instructor
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

    await AssignmentModel.create({
      _id: assignmentId3,
      title: "Another Instructor Assignment",
      description: "Assignment by another instructor",
      activityIds: [],
      instructorId: anotherInstructorId,
      deleted: false,
    });

    // Create sections with assignments
    await SectionModel.create({
      _id: sectionId1,
      title: "Section 1",
      sectionCode: "SEC001",
      description: "First section",
      instructorId: instructorUserId,
      assignments: [
        {
          assignmentId: assignmentId1,
          mandatory: true,
        },
        {
          assignmentId: assignmentId2,
          mandatory: false,
        },
      ],
      numOptionalAssignmentsRequired: 1,
      deleted: false,
    });

    await SectionModel.create({
      _id: sectionId2,
      title: "Section 2",
      sectionCode: "SEC002",
      description: "Second section",
      instructorId: instructorUserId,
      assignments: [
        {
          assignmentId: assignmentId1,
          mandatory: true,
        },
      ],
      numOptionalAssignmentsRequired: 0,
      deleted: false,
    });

    await SectionModel.create({
      _id: sectionId3,
      title: "Section 3",
      sectionCode: "SEC003",
      description: "Third section by another instructor",
      instructorId: anotherInstructorId,
      assignments: [
        {
          assignmentId: assignmentId3,
          mandatory: true,
        },
      ],
      numOptionalAssignmentsRequired: 0,
      deleted: false,
    });

    await StudentDataModel.findOneAndUpdate(
      { userId: studentUserId },
      {
        $push: {
          enrolledSections: [sectionId1, sectionId3],
        },
      }
    );
  });

  afterEach(async () => {
    await appStop();
    await mongoUnit.drop();
  });

  it("allows instructor to fetch their own assignments", async () => {
    const token = await getToken(instructorUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `query FetchAssignments($forUserId: ID!) {
          fetchAssignments(forUserId: $forUserId) {
            _id
            title
            description
            activityIds
            instructorId
            deleted
          }
        }`,
        variables: {
          forUserId: instructorUserId,
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const assignments = response.body.data.fetchAssignments;
    expect(assignments).to.be.an("array").with.length(2);

    const assignmentTitles = assignments.map((a: any) => a.title);
    expect(assignmentTitles).to.include("Instructor Assignment 1");
    expect(assignmentTitles).to.include("Instructor Assignment 2");
    expect(assignmentTitles).to.not.include("Another Instructor Assignment");

    assignments.forEach((assignment: any) => {
      expect(assignment.instructorId).to.equal(instructorUserId);
    });
  });

  it("allows student to fetch assignments from their enrolled sections", async () => {
    const token = await getToken(studentUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `query FetchAssignments($forUserId: ID!) {
          fetchAssignments(forUserId: $forUserId) {
            _id
            title
            description
            activityIds
            instructorId
            deleted
          }
        }`,
        variables: {
          forUserId: studentUserId,
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const assignments = response.body.data.fetchAssignments;
    expect(assignments).to.be.an("array").with.length(3);

    const assignmentTitles = assignments.map((a: any) => a.title);
    expect(assignmentTitles).to.include("Instructor Assignment 1");
    expect(assignmentTitles).to.include("Instructor Assignment 2");
    expect(assignmentTitles).to.include("Another Instructor Assignment");

    const assignmentIds = assignments.map((a: any) => a._id);
    expect(assignmentIds).to.include(assignmentId1);
    expect(assignmentIds).to.include(assignmentId2);
    expect(assignmentIds).to.include(assignmentId3);
  });

  it("allows admin to fetch assignments for any user", async () => {
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
        query: `query FetchAssignments($forUserId: ID!) {
          fetchAssignments(forUserId: $forUserId) {
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

    const assignments = response.body.data.fetchAssignments;
    expect(assignments).to.be.an("array").with.length(2);

    assignments.forEach((assignment: any) => {
      expect(assignment.instructorId).to.equal(instructorUserId);
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
        query: `query FetchAssignments($forUserId: ID!) {
          fetchAssignments(forUserId: $forUserId) {
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

    const assignments = response.body.data.fetchAssignments;
    expect(assignments).to.be.an("array").that.is.empty;
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
        query: `query FetchAssignments($forUserId: ID!) {
          fetchAssignments(forUserId: $forUserId) {
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

    const assignments = response.body.data.fetchAssignments;
    expect(assignments).to.be.an("array").that.is.empty;
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
        query: `query FetchAssignments($forUserId: ID!) {
          fetchAssignments(forUserId: $forUserId) {
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

    const assignments = response.body.data.fetchAssignments;
    expect(assignments).to.be.an("array").that.is.empty;
  });

  it("returns empty array for student enrolled in sections with no assignments", async () => {
    const studentNoAssignments = new ObjectId().toString();
    const emptySectionId = new ObjectId().toString();

    await UserModel.create({
      _id: studentNoAssignments,
      googleId: "student-no-assignments-google-id",
      name: "Student No Assignments",
      email: "studentnoassignments@test.com",
      userRole: "USER",
      loginService: "GOOGLE",
      educationalRole: EducationalRole.STUDENT,
    });

    await SectionModel.create({
      _id: emptySectionId,
      title: "Empty Section",
      sectionCode: "EMPTY001",
      description: "Section with no assignments",
      instructorId: instructorUserId,
      assignments: [],
      numOptionalAssignmentsRequired: 0,
      deleted: false,
    });

    await StudentDataModel.create({
      userId: studentNoAssignments,
      enrolledCourses: [],
      enrolledSections: [emptySectionId],
      assignmentProgress: [],
      deleted: false,
    });

    const token = await getToken(studentNoAssignments, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `query FetchAssignments($forUserId: ID!) {
          fetchAssignments(forUserId: $forUserId) {
            _id
            title
          }
        }`,
        variables: {
          forUserId: studentNoAssignments,
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const assignments = response.body.data.fetchAssignments;
    expect(assignments).to.be.an("array").that.is.empty;
  });

  it("throws error when non-authenticated user tries to fetch assignments", async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `query FetchAssignments($forUserId: ID!) {
          fetchAssignments(forUserId: $forUserId) {
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

  it("throws error when user tries to fetch another user's assignments", async () => {
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
        query: `query FetchAssignments($forUserId: ID!) {
          fetchAssignments(forUserId: $forUserId) {
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
        e.message.includes(
          "Unauthorized: You may only view your own assignments"
        )
      )
    ).to.exist;
  });

  it("throws error when user not found", async () => {
    const token = await getToken("000000000000000000000000", UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `query FetchAssignments($forUserId: ID!) {
          fetchAssignments(forUserId: $forUserId) {
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
