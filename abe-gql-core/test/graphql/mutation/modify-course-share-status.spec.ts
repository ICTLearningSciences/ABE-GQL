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
import { EducationalRole, UserRole } from "../../../src/schemas/models/User";
import StudentDataModel from "../../../src/schemas/models/StudentData";
import CourseModel from "../../../src/schemas/models/Course";
import mongoose from "mongoose";
import InstructorDataModel, {
  CourseOwnership,
} from "../../../src/schemas/models/InstructorData";
import UserModel from "../../../src/schemas/models/User";

const { ObjectId } = mongoose.Types;

const courseShareStatusMutation = `
mutation ModifyCourseShareStatus($instructorId: ID!, $courseId: ID!, $action: ShareCourseWithInstructorAction!) {
  modifyCourseShareStatus(instructorId: $instructorId, courseId: $courseId, action: $action) {
    _id
    courses{
      courseId
      ownership
    }
  }
}
`;

describe("modify course share status", () => {
  let app: Express;
  let courseId: string;
  let courseOwnerUserId: string;
  let instructorToShareToUserId: string;
  let studentUserId: string;

  beforeEach(async () => {
    await mongoUnit.load(require("../../fixtures/mongodb/data-default.js"));
    app = await createApp();
    await appStart();

    courseOwnerUserId = "5ffdf1231ee2c62320b49a99";
    instructorToShareToUserId = "5ffdf1231ee2c62320b49b99";
    studentUserId = "5ffdf1231ee2c62320b49c99";
    courseId = new ObjectId().toString();

    await UserModel.create({
      _id: studentUserId,
      googleId: "student-google-id",
      name: "Student",
      email: "student@test.com",
      userRole: "USER",
      loginService: "GOOGLE",
      educationalRole: EducationalRole.STUDENT,
    });

    await StudentDataModel.create({
      userId: studentUserId,
    });

    await InstructorDataModel.create({
      userId: courseOwnerUserId,
      courses: [],
    });

    await InstructorDataModel.create({
      userId: instructorToShareToUserId,
      courses: [],
    });

    await CourseModel.create({
      _id: courseId,
      title: "Test Course",
      description: "Test Description",
      instructorId: courseOwnerUserId,
      sectionIds: [],
      deleted: false,
    });
  });

  afterEach(async () => {
    await appStop();
    await mongoUnit.drop();
  });

  it("allows instructor to share a course with another instructor", async () => {
    const token = await getToken(courseOwnerUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: courseShareStatusMutation,
        variables: {
          instructorId: instructorToShareToUserId,
          courseId: courseId,
          action: "SHARE",
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const courseData = response.body.data.modifyCourseShareStatus;
    expect(courseData.courses).to.deep.include.members([
      {
        courseId: courseId,
        ownership: CourseOwnership.SHARED,
      },
    ]);

    const instructorData = await InstructorDataModel.findOne({
      userId: instructorToShareToUserId,
    }).lean();
    expect(instructorData?.courses).to.deep.include.members([
      {
        courseId: courseId,
        ownership: CourseOwnership.SHARED,
      },
    ]);
  });

  it("allows instructor to unshare a course with another instructor", async () => {
    await InstructorDataModel.findOneAndUpdate(
      {
        userId: instructorToShareToUserId,
      },
      {
        $set: {
          courses: [
            {
              courseId: courseId,
              ownership: CourseOwnership.SHARED,
            },
          ],
        },
      }
    );

    const token = await getToken(courseOwnerUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: courseShareStatusMutation,
        variables: {
          instructorId: instructorToShareToUserId,
          courseId: courseId,
          action: "UNSHARE",
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const courseData = response.body.data.modifyCourseShareStatus;
    expect(courseData.courses).to.not.deep.include.members([
      {
        courseId: courseId,
        ownership: CourseOwnership.SHARED,
      },
    ]);

    const instructorData = await InstructorDataModel.findOne({
      userId: instructorToShareToUserId,
    }).lean();
    expect(instructorData?.courses).to.not.deep.include.members([
      {
        courseId: courseId,
        ownership: CourseOwnership.SHARED,
      },
    ]);
  });

  it("returns error when target instructor does not exist", async () => {
    const token = await getToken(courseOwnerUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: courseShareStatusMutation,
        variables: {
          instructorId: "non-existent-instructor-id",
          courseId: courseId,
          action: "SHARE",
        },
      });
    expect(response.status).to.equal(200);
    expect(
      response.body.errors.find((e: any) =>
        e.message.includes("target instructor not found")
      )
    ).to.exist;
  });

  it("returns error when course does not exist", async () => {
    const token = await getToken(courseOwnerUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: courseShareStatusMutation,
        variables: {
          instructorId: instructorToShareToUserId,
          courseId: new ObjectId().toString(),
          action: "SHARE",
        },
      });
    console.log(JSON.stringify(response.body, null, 2));
    expect(response.status).to.equal(200);
    expect(
      response.body.errors.find((e: any) =>
        e.message.includes("course not found")
      )
    ).to.exist;
  });

  it("returns an error if not an admin or instructor", async () => {
    const token = await getToken(studentUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: courseShareStatusMutation,
        variables: {
          instructorId: instructorToShareToUserId,
          courseId: courseId,
          action: "SHARE",
        },
      });
    expect(response.status).to.equal(200);
    expect(
      response.body.errors.find((e: any) =>
        e.message.includes("admins/instructors only")
      )
    ).to.exist;
  });
});
