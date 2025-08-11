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
import AssignmentModel from "../../../src/schemas/models/Assignment";
import CourseModel from "../../../src/schemas/models/Course";
import SectionModel from "../../../src/schemas/models/Section";
import InstructorDataModel from "../../../src/schemas/models/InstructorData";
import UserModel from "../../../src/schemas/models/User";
import mongoose from "mongoose";

const { ObjectId } = mongoose.Types;

describe("add or update assignment", () => {
  let app: Express;
  let instructorUserId: string;
  let courseId: string;
  let assignmentId: string;
  let sectionId: string;
  let adminUserId: string;

  beforeEach(async () => {
    await mongoUnit.load(require("../../fixtures/mongodb/data-default.js"));
    app = await createApp();
    await appStart();

    instructorUserId = "5ffdf1231ee2c62320b49a99";
    courseId = new ObjectId().toString();
    assignmentId = new ObjectId().toString();
    sectionId = new ObjectId().toString();
    adminUserId = "5ffdf1231ee2c62320b49c99";

    await UserModel.create({
      _id: adminUserId,
      name: "John Admin Doe",
      email: "johnadmindoe@gmail.com",
      userRole: "ADMIN",
    });

    await InstructorDataModel.create({
      userId: instructorUserId,
      courseIds: [],
    });

    await AssignmentModel.create({
      _id: assignmentId,
      title: "Test Assignment",
      description: "Test Description",
      activityIds: [],
      instructorId: instructorUserId,
    });

    await SectionModel.create({
      _id: sectionId,
      title: "Test Section",
      sectionCode: "TEST001",
      description: "Test Description",
      instructorId: instructorUserId,
      assignments: [
        {
          assignmentId: assignmentId,
          mandatory: true,
        },
      ],
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

    await InstructorDataModel.findOneAndUpdate(
      { userId: instructorUserId },
      { $push: { courseIds: courseId } }
    );
  });

  afterEach(async () => {
    await appStop();
    await mongoUnit.drop();
  });

  it("allows instructor to create a new assignment", async () => {
    const token = await getToken(instructorUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateAssignment($courseId: ID!, $action: AssignmentAction!) {
          addOrUpdateAssignment(courseId: $courseId, action: $action) {
            _id
            title
            description
            activityIds
            instructorId
            deleted
          }
        }`,
        variables: {
          courseId: courseId,
          action: "CREATE",
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const assignmentData = response.body.data.addOrUpdateAssignment;
    expect(assignmentData.title).to.equal("");
    expect(assignmentData.description).to.equal("");
    expect(assignmentData.instructorId).to.equal(instructorUserId);
    expect(assignmentData.activityIds).to.be.an("array").that.is.empty;
    expect(assignmentData.deleted).to.be.false;
  });

  it("allows instructor to create a new assignment with input data as defaults", async () => {
    const token = await getToken(instructorUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateAssignment($courseId: ID!, $assignmentData: AssignmentInputType, $action: AssignmentAction!) {
          addOrUpdateAssignment(courseId: $courseId, assignmentData: $assignmentData, action: $action) {
            _id
            title
            description
            activityIds
            instructorId
            deleted
          }
        }`,
        variables: {
          courseId: courseId,
          assignmentData: {
            title: "Custom Assignment Title",
            description: "Custom Assignment Description",
            activityIds: ["activity1", "activity2", "activity3"],
          },
          action: "CREATE",
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const assignmentData = response.body.data.addOrUpdateAssignment;
    expect(assignmentData.title).to.equal("Custom Assignment Title");
    expect(assignmentData.description).to.equal(
      "Custom Assignment Description"
    );
    expect(assignmentData.instructorId).to.equal(instructorUserId);
    expect(assignmentData.activityIds).to.deep.equal([
      "activity1",
      "activity2",
      "activity3",
    ]);
    expect(assignmentData.deleted).to.be.false;
  });

  it("allows admin to create a new assignment even without instructor data", async () => {
    const token = await getToken(adminUserId, UserRole.ADMIN);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateAssignment($courseId: ID!, $action: AssignmentAction!) {
          addOrUpdateAssignment(courseId: $courseId, action: $action) {
            _id
            title
            instructorId
          }
        }`,
        variables: {
          courseId: courseId,
          action: "CREATE",
        },
      });
    console.log(JSON.stringify(response.body, null, 2));
    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const assignmentData = response.body.data.addOrUpdateAssignment;
    expect(assignmentData.instructorId).to.equal(adminUserId);
  });

  it("allows instructor to modify their own assignment", async () => {
    const token = await getToken(instructorUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateAssignment($courseId: ID!, $assignmentData: AssignmentInputType, $action: AssignmentAction!) {
          addOrUpdateAssignment(courseId: $courseId, assignmentData: $assignmentData, action: $action) {
            _id
            title
            description
            instructorId
          }
        }`,
        variables: {
          courseId: courseId,
          assignmentData: {
            _id: assignmentId,
            title: "Updated Assignment",
            description: "Updated Description",
          },
          action: "MODIFY",
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const assignmentData = response.body.data.addOrUpdateAssignment;
    expect(assignmentData.title).to.equal("Updated Assignment");
    expect(assignmentData.description).to.equal("Updated Description");

    const updatedAssignment = await AssignmentModel.findById(assignmentId);
    expect(updatedAssignment?.title).to.equal("Updated Assignment");
    expect(updatedAssignment?.description).to.equal("Updated Description");
  });

  it("allows instructor to delete their own assignment and removes it from sections", async () => {
    await SectionModel.findOneAndUpdate(
      { _id: sectionId },
      {
        assignments: [{ assignmentId: assignmentId, mandatory: true }],
      }
    );

    const token = await getToken(instructorUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateAssignment($courseId: ID!, $assignmentData: AssignmentInputType, $action: AssignmentAction!) {
          addOrUpdateAssignment(courseId: $courseId, assignmentData: $assignmentData, action: $action) {
            _id
            title
            deleted
          }
        }`,
        variables: {
          courseId: courseId,
          assignmentData: {
            _id: assignmentId,
          },
          action: "DELETE",
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const assignmentData = response.body.data.addOrUpdateAssignment;
    expect(assignmentData.deleted).to.be.true;

    const deletedAssignment = await AssignmentModel.findOne({
      _id: assignmentId,
    });
    expect(deletedAssignment).to.not.exist;

    const updatedSection = await SectionModel.findById(sectionId);
    expect(updatedSection?.assignments).to.be.an("array").that.is.empty;
  });

  it("allows admin to modify any assignment", async () => {
    const token = await getToken(adminUserId, UserRole.ADMIN);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateAssignment($courseId: ID!, $assignmentData: AssignmentInputType, $action: AssignmentAction!) {
          addOrUpdateAssignment(courseId: $courseId, assignmentData: $assignmentData, action: $action) {
            _id
            title
            description
          }
        }`,
        variables: {
          courseId: courseId,
          assignmentData: {
            _id: assignmentId,
            title: "Admin Updated Assignment",
            description: "Admin Updated Description",
          },
          action: "MODIFY",
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const assignmentData = response.body.data.addOrUpdateAssignment;
    expect(assignmentData.title).to.equal("Admin Updated Assignment");
  });

  it("throws error when non-instructor tries to create assignment", async () => {
    const regularUserId = "5ffdf1231ee2c62320b49b99";
    const token = await getToken(regularUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateAssignment($courseId: ID!, $action: AssignmentAction!) {
          addOrUpdateAssignment(courseId: $courseId, action: $action) {
            _id
          }
        }`,
        variables: {
          courseId: courseId,
          action: "CREATE",
        },
      });

    expect(response.status).to.equal(200);
    expect(
      response.body.errors.find((e: any) =>
        e.message.includes("instructors/admins only")
      )
    ).to.exist;
  });

  it("throws error when non-authenticated user tries to create assignment", async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `mutation AddOrUpdateAssignment($courseId: ID!, $action: AssignmentAction!) {
          addOrUpdateAssignment(courseId: $courseId, action: $action) {
            _id
          }
        }`,
        variables: {
          courseId: courseId,
          action: "CREATE",
        },
      });

    expect(response.status).to.equal(200);
    expect(
      response.body.errors.find((e: any) =>
        e.message.includes("authenticated user required")
      )
    ).to.exist;
  });

  it("throws error when course not found", async () => {
    const token = await getToken(instructorUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateAssignment($courseId: ID!, $action: AssignmentAction!) {
          addOrUpdateAssignment(courseId: $courseId, action: $action) {
            _id
          }
        }`,
        variables: {
          courseId: "000000000000000000000000",
          action: "CREATE",
        },
      });

    expect(response.status).to.equal(200);
    expect(
      response.body.errors.find((e: any) =>
        e.message.includes("course not found")
      )
    ).to.exist;
  });

  it("throws error when instructor tries to modify another instructor's course assignments", async () => {
    const anotherInstructorId = "5ffdf1231ee2c62320b49c99";
    await InstructorDataModel.create({
      userId: anotherInstructorId,
      courseIds: [],
    });

    const anotherCourseId = new ObjectId().toString();

    await CourseModel.create({
      _id: anotherCourseId,
      title: "Another Course",
      description: "Another Description",
      instructorId: anotherInstructorId,
      sectionIds: [],
      deleted: false,
    });

    const token = await getToken(instructorUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateAssignment($courseId: ID!, $action: AssignmentAction!) {
          addOrUpdateAssignment(courseId: $courseId, action: $action) {
            _id
          }
        }`,
        variables: {
          courseId: anotherCourseId,
          action: "CREATE",
        },
      });

    expect(response.status).to.equal(200);
    expect(
      response.body.errors.find((e: any) =>
        e.message.includes(
          "unauthorized: only course instructor or admin can modify assignments"
        )
      )
    ).to.exist;
  });

  it("throws error when instructor tries to modify another instructor's assignment", async () => {
    const anotherInstructorId = "5ffdf1231ee2c62320b49c99";

    const anotherAssignmentId = new ObjectId().toString();
    await AssignmentModel.create({
      _id: anotherAssignmentId,
      title: "Another Instructor's Assignment",
      description: "Assignment Description",
      activityIds: [],
      instructorId: anotherInstructorId,
      deleted: false,
    });

    const token = await getToken(instructorUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateAssignment($courseId: ID!, $assignmentData: AssignmentInputType, $action: AssignmentAction!) {
          addOrUpdateAssignment(courseId: $courseId, assignmentData: $assignmentData, action: $action) {
            _id
          }
        }`,
        variables: {
          courseId: courseId,
          assignmentData: {
            _id: anotherAssignmentId,
            title: "Hacked Title",
          },
          action: "MODIFY",
        },
      });

    expect(response.status).to.equal(200);
    expect(
      response.body.errors.find((e: any) =>
        e.message.includes(
          "Only owning instructor or admins can modify this assignment"
        )
      )
    ).to.exist;
  });

  it("throws error when assignment not found for modify/delete", async () => {
    const token = await getToken(instructorUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateAssignment($courseId: ID!, $assignmentData: AssignmentInputType, $action: AssignmentAction!) {
          addOrUpdateAssignment(courseId: $courseId, assignmentData: $assignmentData, action: $action) {
            _id
          }
        }`,
        variables: {
          courseId: courseId,
          assignmentData: {
            _id: "000000000000000000000000",
          },
          action: "MODIFY",
        },
      });

    expect(response.status).to.equal(200);
    expect(
      response.body.errors.find((e: any) =>
        e.message.includes("assignment not found")
      )
    ).to.exist;
  });

  it("throws error when assignmentData is missing for modify action", async () => {
    const token = await getToken(instructorUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateAssignment($courseId: ID!, $action: AssignmentAction!) {
          addOrUpdateAssignment(courseId: $courseId, action: $action) {
            _id
          }
        }`,
        variables: {
          courseId: courseId,
          action: "MODIFY",
        },
      });

    expect(response.status).to.equal(200);
    expect(
      response.body.errors.find((e: any) =>
        e.message.includes(
          "assignment data with _id is required for MODIFY and DELETE actions"
        )
      )
    ).to.exist;
  });

  it("throws error when assignmentData is missing for delete action", async () => {
    const token = await getToken(instructorUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateAssignment($courseId: ID!, $action: AssignmentAction!) {
          addOrUpdateAssignment(courseId: $courseId, action: $action) {
            _id
          }
        }`,
        variables: {
          courseId: courseId,
          action: "DELETE",
        },
      });

    expect(response.status).to.equal(200);
    expect(
      response.body.errors.find((e: any) =>
        e.message.includes(
          "assignment data with _id is required for MODIFY and DELETE actions"
        )
      )
    ).to.exist;
  });
});
