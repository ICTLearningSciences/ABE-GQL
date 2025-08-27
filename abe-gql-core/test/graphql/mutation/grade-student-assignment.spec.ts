/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
/*
This software is Copyright � 2020 The University of Southern California. All Rights Reserved. 
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
import { EducationalRole, UserRole } from "../../../src/schemas/models/User";
import StudentDataModel from "../../../src/schemas/models/StudentData";
import mongoose from "mongoose";
import InstructorDataModel from "../../../src/schemas/models/InstructorData";
import UserModel from "../../../src/schemas/models/User";

const { ObjectId } = mongoose.Types;

describe("grade student assignment", () => {
  let app: Express;
  let assignmentId: string;
  let instructorUserId: string;
  let studentUserId: string;

  beforeEach(async () => {
    await mongoUnit.load(require("../../fixtures/mongodb/data-default.js"));
    app = await createApp();
    await appStart();

    instructorUserId = new ObjectId().toString();
    studentUserId = new ObjectId().toString();
    assignmentId = new ObjectId().toString();

    await UserModel.create({
      _id: instructorUserId,
      email: "instructor@example.com",
      educationalRole: EducationalRole.INSTRUCTOR,
    });

    await InstructorDataModel.create({
      userId: instructorUserId,
    });

    await StudentDataModel.create({
      userId: studentUserId,
      name: "Test Student",
      enrolledCourses: [],
      enrolledSections: [],
      assignmentProgress: [
        {
          assignmentId: assignmentId,
          activityCompletions: [],
          instructorGrade: null,
        },
      ],
      deleted: false,
    });
  });

  afterEach(async () => {
    await appStop();
    await mongoUnit.drop();
  });

  it("allows instructor to grade a student assignment", async () => {
    const token = await getToken(instructorUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation GradeStudentAssignment($studentId: String!, $assignmentId: String!, $grade: Int!, $comment: String) {
          gradeStudentAssignment(studentId: $studentId, assignmentId: $assignmentId, grade: $grade, comment: $comment) {
            _id
            userId
            assignmentProgress {
              assignmentId
              instructorGrade {
                grade
                comment
              }
            }
          }
        }`,
        variables: {
          studentId: studentUserId,
          assignmentId: assignmentId,
          grade: 85,
          comment: "Good work!",
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const gradeData = response.body.data.gradeStudentAssignment;
    expect(gradeData.userId).to.equal(studentUserId);

    const assignment = gradeData.assignmentProgress.find(
      (a: any) => a.assignmentId === assignmentId
    );
    expect(assignment).to.exist;
    expect(assignment.instructorGrade.grade).to.equal(85);
    expect(assignment.instructorGrade.comment).to.equal("Good work!");

    const studentData = await StudentDataModel.findOne({
      userId: studentUserId,
    });
    const assignmentProgress = studentData?.assignmentProgress.find(
      (a) => a.assignmentId === assignmentId
    );
    expect(assignmentProgress?.instructorGrade?.grade).to.equal(85);
    expect(assignmentProgress?.instructorGrade?.comment).to.equal("Good work!");
  });

  it("allows admin to grade any student assignment", async () => {
    const token = await getToken(instructorUserId, UserRole.ADMIN);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation GradeStudentAssignment($studentId: String!, $assignmentId: String!, $grade: Int!, $comment: String) {
          gradeStudentAssignment(studentId: $studentId, assignmentId: $assignmentId, grade: $grade, comment: $comment) {
            _id
            userId
            assignmentProgress {
              assignmentId
              instructorGrade {
                grade
                comment
              }
            }
          }
        }`,
        variables: {
          studentId: studentUserId,
          assignmentId: assignmentId,
          grade: 90,
          comment: "Excellent work!",
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const gradeData = response.body.data.gradeStudentAssignment;
    const assignment = gradeData.assignmentProgress.find(
      (a: any) => a.assignmentId === assignmentId
    );
    expect(assignment.instructorGrade.grade).to.equal(90);
    expect(assignment.instructorGrade.comment).to.equal("Excellent work!");
  });

  it("throws error when non-authenticated user tries to grade assignment", async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `mutation GradeStudentAssignment($studentId: String!, $assignmentId: String!, $grade: Int!, $comment: String) {
          gradeStudentAssignment(studentId: $studentId, assignmentId: $assignmentId, grade: $grade, comment: $comment) {
            _id
          }
        }`,
        variables: {
          studentId: studentUserId,
          assignmentId: assignmentId,
          grade: 85,
        },
      });

    expect(response.status).to.equal(200);
    expect(
      response.body.errors.find((e: any) =>
        e.message.includes("authenticated user required")
      )
    ).to.exist;
  });

  it("throws error when non-instructor tries to grade assignment", async () => {
    const nonInstructorUserId = "5ffdf1231ee2c62320b49c99";

    await UserModel.create({
      _id: nonInstructorUserId,
      email: "non-instructor@example.com",
      educationalRole: EducationalRole.STUDENT,
    });

    const token = await getToken(nonInstructorUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation GradeStudentAssignment($studentId: String!, $assignmentId: String!, $grade: Int!, $comment: String) {
          gradeStudentAssignment(studentId: $studentId, assignmentId: $assignmentId, grade: $grade, comment: $comment) {
            _id
          }
        }`,
        variables: {
          studentId: studentUserId,
          assignmentId: assignmentId,
          grade: 85,
        },
      });
    console.log(JSON.stringify(response.body, null, 2));
    expect(response.status).to.equal(200);
    expect(
      response.body.errors.find((e: any) =>
        e.message.includes("instructor required")
      )
    ).to.exist;
  });

  it("throws error when instructor data not found", async () => {
    await InstructorDataModel.deleteOne({ userId: instructorUserId });
    const token = await getToken(instructorUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation GradeStudentAssignment($studentId: String!, $assignmentId: String!, $grade: Int!, $comment: String) {
          gradeStudentAssignment(studentId: $studentId, assignmentId: $assignmentId, grade: $grade, comment: $comment) {
            _id
          }
        }`,
        variables: {
          studentId: studentUserId,
          assignmentId: assignmentId,
          grade: 85,
        },
      });

    expect(response.status).to.equal(200);
    expect(
      response.body.errors.find((e: any) =>
        e.message.includes("instructor data not found")
      )
    ).to.exist;
  });

  it("throws error when student data not found", async () => {
    const token = await getToken(instructorUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation GradeStudentAssignment($studentId: String!, $assignmentId: String!, $grade: Int!, $comment: String) {
          gradeStudentAssignment(studentId: $studentId, assignmentId: $assignmentId, grade: $grade, comment: $comment) {
            _id
          }
        }`,
        variables: {
          studentId: "000000000000000000000000",
          assignmentId: assignmentId,
          grade: 85,
        },
      });

    expect(response.status).to.equal(200);
    expect(
      response.body.errors.find((e: any) =>
        e.message.includes("student data not found")
      )
    ).to.exist;
  });

  it("updates existing grade when assignment already graded", async () => {
    await StudentDataModel.findOneAndUpdate(
      {
        userId: studentUserId,
        "assignmentProgress.assignmentId": assignmentId,
      },
      {
        $set: {
          "assignmentProgress.$.instructorGrade": {
            grade: 70,
            comment: "Initial grade",
          },
        },
      }
    );

    const token = await getToken(instructorUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation GradeStudentAssignment($studentId: String!, $assignmentId: String!, $grade: Int!, $comment: String) {
          gradeStudentAssignment(studentId: $studentId, assignmentId: $assignmentId, grade: $grade, comment: $comment) {
            _id
            userId
            assignmentProgress {
              assignmentId
              instructorGrade {
                grade
                comment
              }
            }
          }
        }`,
        variables: {
          studentId: studentUserId,
          assignmentId: assignmentId,
          grade: 95,
          comment: "Updated grade",
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const gradeData = response.body.data.gradeStudentAssignment;
    const assignment = gradeData.assignmentProgress.find(
      (a: any) => a.assignmentId === assignmentId
    );
    expect(assignment.instructorGrade.grade).to.equal(95);
    expect(assignment.instructorGrade.comment).to.equal("Updated grade");

    const studentData = await StudentDataModel.findOne({
      userId: studentUserId,
    });
    const assignmentProgress = studentData?.assignmentProgress.find(
      (a) => a.assignmentId === assignmentId
    );
    expect(assignmentProgress?.instructorGrade?.grade).to.equal(95);
    expect(assignmentProgress?.instructorGrade?.comment).to.equal(
      "Updated grade"
    );
  });

  it("handles assignment that doesn't exist in student's progress", async () => {
    const nonExistentAssignmentId = new ObjectId().toString();
    const token = await getToken(instructorUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation GradeStudentAssignment($studentId: String!, $assignmentId: String!, $grade: Int!, $comment: String) {
          gradeStudentAssignment(studentId: $studentId, assignmentId: $assignmentId, grade: $grade, comment: $comment) {
            _id
            userId
            assignmentProgress {
              assignmentId
              instructorGrade {
                grade
                comment
              }
            }
          }
        }`,
        variables: {
          studentId: studentUserId,
          assignmentId: nonExistentAssignmentId,
          grade: 85,
          comment: "Grade for non-existent assignment",
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const gradeData = response.body.data.gradeStudentAssignment;
    expect(gradeData.userId).to.equal(studentUserId);

    const assignment = gradeData.assignmentProgress.find(
      (a: any) => a.assignmentId === nonExistentAssignmentId
    );
    expect(assignment).to.not.exist;
  });
});
