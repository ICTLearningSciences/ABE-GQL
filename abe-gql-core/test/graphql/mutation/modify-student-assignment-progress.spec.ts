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
import AssignmentModel from "../../../src/schemas/models/Assignment";
import mongoose from "mongoose";
import InstructorDataModel from "../../../src/schemas/models/InstructorData";

const { ObjectId } = mongoose.Types;

describe("modify student assignment progress", () => {
  let app: Express;
  let courseId: string;
  let sectionId: string;
  let assignmentId: string;
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
    assignmentId = new ObjectId().toString();

    await StudentDataModel.create({
      userId: studentUserId,
      enrolledCourses: [courseId],
      enrolledSections: [sectionId],
      assignmentProgress: [],
      deleted: false,
    });

    await InstructorDataModel.create({
      userId: instructorUserId,
      courseIds: [],
    });

    await AssignmentModel.create({
      _id: assignmentId,
      title: "Test Assignment",
      description: "Test Assignment Description",
      activityIds: [],
      instructorId: instructorUserId,
      deleted: false,
    });

    await SectionModel.create({
      _id: sectionId,
      title: "Test Section",
      sectionCode: "TEST001",
      description: "Test Section Description",
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
  });

  afterEach(async () => {
    await appStop();
    await mongoUnit.drop();
  });

  it("allows instructor to mark assignment as complete for student", async () => {
    const token = await getToken(instructorUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation ModifyStudentAssignmentProgress($targetUserId: ID!, $courseId: ID!, $sectionId: ID!, $assignmentId: ID!, $activityCompletions: [ActivityCompletionInputType!]!) {
          modifyStudentAssignmentProgress(targetUserId: $targetUserId, courseId: $courseId, sectionId: $sectionId, assignmentId: $assignmentId, activityCompletions: $activityCompletions) {
            _id
            userId
            assignmentProgress {
              assignmentId
              activityCompletions {
                activityId
                complete
              }
            }
          }
        }`,
        variables: {
          targetUserId: studentUserId,
          courseId: courseId,
          sectionId: sectionId,
          assignmentId: assignmentId,
          activityCompletions: [
            { activityId: "activity1", complete: true },
            { activityId: "activity2", complete: false },
          ],
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const progressData = response.body.data.modifyStudentAssignmentProgress;
    expect(progressData.userId).to.equal(studentUserId);

    const assignmentProgress = progressData.assignmentProgress.find(
      (ap: any) => ap.assignmentId === assignmentId
    );
    expect(assignmentProgress).to.exist;
    expect(assignmentProgress.activityCompletions).to.have.lengthOf(2);
    expect(assignmentProgress.activityCompletions[0].activityId).to.equal(
      "activity1"
    );
    expect(assignmentProgress.activityCompletions[0].complete).to.be.true;
    expect(assignmentProgress.activityCompletions[1].activityId).to.equal(
      "activity2"
    );
    expect(assignmentProgress.activityCompletions[1].complete).to.be.false;

    const studentData = await StudentDataModel.findOne({
      userId: studentUserId,
    });
    const dbProgress = studentData?.assignmentProgress.find(
      (ap) => ap.assignmentId === assignmentId
    );
    expect(dbProgress?.activityCompletions).to.have.lengthOf(2);
    expect(dbProgress?.activityCompletions[0].activityId).to.equal("activity1");
    expect(dbProgress?.activityCompletions[0].complete).to.be.true;
  });

  it("allows student to mark their own assignment as complete", async () => {
    const token = await getToken(studentUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation ModifyStudentAssignmentProgress($targetUserId: ID!, $courseId: ID!, $sectionId: ID!, $assignmentId: ID!, $activityCompletions: [ActivityCompletionInputType!]!) {
          modifyStudentAssignmentProgress(targetUserId: $targetUserId, courseId: $courseId, sectionId: $sectionId, assignmentId: $assignmentId, activityCompletions: $activityCompletions) {
            _id
            userId
            assignmentProgress {
              assignmentId
              activityCompletions {
                activityId
                complete
              }
            }
          }
        }`,
        variables: {
          targetUserId: studentUserId,
          courseId: courseId,
          sectionId: sectionId,
          assignmentId: assignmentId,
          activityCompletions: [{ activityId: "activity1", complete: true }],
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const progressData = response.body.data.modifyStudentAssignmentProgress;
    const assignmentProgress = progressData.assignmentProgress.find(
      (ap: any) => ap.assignmentId === assignmentId
    );
    expect(assignmentProgress.activityCompletions[0].complete).to.be.true;
  });

  it("allows updating existing assignment progress", async () => {
    await StudentDataModel.findOneAndUpdate(
      { userId: studentUserId },
      {
        $push: {
          assignmentProgress: {
            assignmentId: assignmentId,
            activityCompletions: [
              { activityId: "activity1", complete: true },
              { activityId: "activity2", complete: true },
            ],
          },
        },
      }
    );

    const token = await getToken(instructorUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation ModifyStudentAssignmentProgress($targetUserId: ID!, $courseId: ID!, $sectionId: ID!, $assignmentId: ID!, $activityCompletions: [ActivityCompletionInputType!]!) {
          modifyStudentAssignmentProgress(targetUserId: $targetUserId, courseId: $courseId, sectionId: $sectionId, assignmentId: $assignmentId, activityCompletions: $activityCompletions) {
            _id
            userId
            assignmentProgress {
              assignmentId
              activityCompletions {
                activityId
                complete
              }
            }
          }
        }`,
        variables: {
          targetUserId: studentUserId,
          courseId: courseId,
          sectionId: sectionId,
          assignmentId: assignmentId,
          activityCompletions: [
            { activityId: "activity1", complete: false },
            { activityId: "activity2", complete: true },
          ],
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const progressData = response.body.data.modifyStudentAssignmentProgress;
    const assignmentProgress = progressData.assignmentProgress.find(
      (ap: any) => ap.assignmentId === assignmentId
    );
    expect(assignmentProgress.activityCompletions).to.have.lengthOf(2);
    expect(assignmentProgress.activityCompletions[0].complete).to.be.false;
    expect(assignmentProgress.activityCompletions[1].complete).to.be.true;

    const updatedStudentData = await StudentDataModel.findOne({
      userId: studentUserId,
    });
    const dbProgress = updatedStudentData?.assignmentProgress.find(
      (ap) => ap.assignmentId === assignmentId
    );
    expect(dbProgress?.activityCompletions).to.have.lengthOf(2);
    expect(dbProgress?.activityCompletions[0].complete).to.be.false;
    expect(dbProgress?.activityCompletions[1].complete).to.be.true;
  });

  it("allows admin to modify any student's assignment progress", async () => {
    const token = await getToken(instructorUserId, UserRole.ADMIN);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation ModifyStudentAssignmentProgress($targetUserId: ID!, $courseId: ID!, $sectionId: ID!, $assignmentId: ID!, $activityCompletions: [ActivityCompletionInputType!]!) {
          modifyStudentAssignmentProgress(targetUserId: $targetUserId, courseId: $courseId, sectionId: $sectionId, assignmentId: $assignmentId, activityCompletions: $activityCompletions) {
            _id
            userId
            assignmentProgress {
              assignmentId
              activityCompletions {
                activityId
                complete
              }
            }
          }
        }`,
        variables: {
          targetUserId: studentUserId,
          courseId: courseId,
          sectionId: sectionId,
          assignmentId: assignmentId,
          activityCompletions: [{ activityId: "activity1", complete: true }],
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const progressData = response.body.data.modifyStudentAssignmentProgress;
    const assignmentProgress = progressData.assignmentProgress.find(
      (ap: any) => ap.assignmentId === assignmentId
    );
    expect(assignmentProgress.activityCompletions[0].complete).to.be.true;
  });

  it("throws error when non-authenticated user tries to modify progress", async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `mutation ModifyStudentAssignmentProgress($targetUserId: ID!, $courseId: ID!, $sectionId: ID!, $assignmentId: ID!, $activityCompletions: [ActivityCompletionInputType!]!) {
          modifyStudentAssignmentProgress(targetUserId: $targetUserId, courseId: $courseId, sectionId: $sectionId, assignmentId: $assignmentId, activityCompletions: $activityCompletions) {
            _id
          }
        }`,
        variables: {
          targetUserId: studentUserId,
          courseId: courseId,
          sectionId: sectionId,
          assignmentId: assignmentId,
          activityCompletions: [{ activityId: "activity1", complete: true }],
        },
      });

    expect(response.status).to.equal(200);
    expect(
      response.body.errors.find((e: any) =>
        e.message.includes("authenticated user required")
      )
    ).to.exist;
  });

  it("throws error when unauthorized user tries to modify another user's progress", async () => {
    const unauthorizedUserId = "5ffdf1231ee2c62320b49c99";
    const token = await getToken(unauthorizedUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation ModifyStudentAssignmentProgress($targetUserId: ID!, $courseId: ID!, $sectionId: ID!, $assignmentId: ID!, $activityCompletions: [ActivityCompletionInputType!]!) {
          modifyStudentAssignmentProgress(targetUserId: $targetUserId, courseId: $courseId, sectionId: $sectionId, assignmentId: $assignmentId, activityCompletions: $activityCompletions) {
            _id
          }
        }`,
        variables: {
          targetUserId: studentUserId,
          courseId: courseId,
          sectionId: sectionId,
          assignmentId: assignmentId,
          activityCompletions: [{ activityId: "activity1", complete: true }],
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

  it("throws error when student data not found", async () => {
    const userWithoutStudentData = "5ffdf1231ee2c62320b49d99";
    const token = await getToken(instructorUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation ModifyStudentAssignmentProgress($targetUserId: ID!, $courseId: ID!, $sectionId: ID!, $assignmentId: ID!, $activityCompletions: [ActivityCompletionInputType!]!) {
          modifyStudentAssignmentProgress(targetUserId: $targetUserId, courseId: $courseId, sectionId: $sectionId, assignmentId: $assignmentId, activityCompletions: $activityCompletions) {
            _id
          }
        }`,
        variables: {
          targetUserId: userWithoutStudentData,
          courseId: courseId,
          sectionId: sectionId,
          assignmentId: assignmentId,
          activityCompletions: [{ activityId: "activity1", complete: true }],
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
        query: `mutation ModifyStudentAssignmentProgress($targetUserId: ID!, $courseId: ID!, $sectionId: ID!, $assignmentId: ID!, $activityCompletions: [ActivityCompletionInputType!]!) {
          modifyStudentAssignmentProgress(targetUserId: $targetUserId, courseId: $courseId, sectionId: $sectionId, assignmentId: $assignmentId, activityCompletions: $activityCompletions) {
            _id
          }
        }`,
        variables: {
          targetUserId: studentUserId,
          courseId: "000000000000000000000000",
          sectionId: sectionId,
          assignmentId: assignmentId,
          activityCompletions: [{ activityId: "activity1", complete: true }],
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
        query: `mutation ModifyStudentAssignmentProgress($targetUserId: ID!, $courseId: ID!, $sectionId: ID!, $assignmentId: ID!, $activityCompletions: [ActivityCompletionInputType!]!) {
          modifyStudentAssignmentProgress(targetUserId: $targetUserId, courseId: $courseId, sectionId: $sectionId, assignmentId: $assignmentId, activityCompletions: $activityCompletions) {
            _id
          }
        }`,
        variables: {
          targetUserId: studentUserId,
          courseId: courseId,
          sectionId: "000000000000000000000000",
          assignmentId: assignmentId,
          activityCompletions: [{ activityId: "activity1", complete: true }],
        },
      });

    expect(response.status).to.equal(200);
    expect(
      response.body.errors.find((e: any) =>
        e.message.includes("section not found")
      )
    ).to.exist;
  });

  it("throws error when assignment not found", async () => {
    const token = await getToken(instructorUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation ModifyStudentAssignmentProgress($targetUserId: ID!, $courseId: ID!, $sectionId: ID!, $assignmentId: ID!, $activityCompletions: [ActivityCompletionInputType!]!) {
          modifyStudentAssignmentProgress(targetUserId: $targetUserId, courseId: $courseId, sectionId: $sectionId, assignmentId: $assignmentId, activityCompletions: $activityCompletions) {
            _id
          }
        }`,
        variables: {
          targetUserId: studentUserId,
          courseId: courseId,
          sectionId: sectionId,
          assignmentId: "000000000000000000000000",
          activityCompletions: [{ activityId: "activity1", complete: true }],
        },
      });

    expect(response.status).to.equal(200);
    expect(
      response.body.errors.find((e: any) =>
        e.message.includes("assignment not found")
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
      assignments: [
        {
          assignmentId: assignmentId,
          mandatory: true,
        },
      ],
      numOptionalAssignmentsRequired: 0,
      deleted: false,
    });

    const token = await getToken(instructorUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation ModifyStudentAssignmentProgress($targetUserId: ID!, $courseId: ID!, $sectionId: ID!, $assignmentId: ID!, $activityCompletions: [ActivityCompletionInputType!]!) {
          modifyStudentAssignmentProgress(targetUserId: $targetUserId, courseId: $courseId, sectionId: $sectionId, assignmentId: $assignmentId, activityCompletions: $activityCompletions) {
            _id
          }
        }`,
        variables: {
          targetUserId: studentUserId,
          courseId: courseId,
          sectionId: anotherSectionId,
          assignmentId: assignmentId,
          activityCompletions: [{ activityId: "activity1", complete: true }],
        },
      });

    expect(response.status).to.equal(200);
    expect(
      response.body.errors.find((e: any) =>
        e.message.includes("section does not belong to the specified course")
      )
    ).to.exist;
  });

  it("throws error when assignment does not belong to section", async () => {
    const anotherAssignmentId = new ObjectId().toString();
    await AssignmentModel.create({
      _id: anotherAssignmentId,
      title: "Another Assignment",
      description: "Another Assignment Description",
      activityIds: [],
      instructorId: instructorUserId,
      deleted: false,
    });

    const token = await getToken(instructorUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation ModifyStudentAssignmentProgress($targetUserId: ID!, $courseId: ID!, $sectionId: ID!, $assignmentId: ID!, $activityCompletions: [ActivityCompletionInputType!]!) {
          modifyStudentAssignmentProgress(targetUserId: $targetUserId, courseId: $courseId, sectionId: $sectionId, assignmentId: $assignmentId, activityCompletions: $activityCompletions) {
            _id
          }
        }`,
        variables: {
          targetUserId: studentUserId,
          courseId: courseId,
          sectionId: sectionId,
          assignmentId: anotherAssignmentId,
          activityCompletions: [{ activityId: "activity1", complete: true }],
        },
      });

    expect(response.status).to.equal(200);
    expect(
      response.body.errors.find((e: any) =>
        e.message.includes(
          "assignment does not belong to the specified section"
        )
      )
    ).to.exist;
  });
});
