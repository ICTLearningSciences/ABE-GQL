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
import CourseModel from "../../../src/schemas/models/Course";
import InstructorDataModel from "../../../src/schemas/models/InstructorData";
import mongoose from "mongoose";

const { ObjectId } = mongoose.Types;

describe("add or update course", () => {
  let app: Express;
  let instructorUserId: string;
  let courseId: string;
  let adminUserId: string;

  beforeEach(async () => {
    await mongoUnit.load(require("../../fixtures/mongodb/data-default.js"));
    app = await createApp();
    await appStart();

    instructorUserId = "5ffdf1231ee2c62320b49a99";
    courseId = new ObjectId().toString();
    adminUserId = "5ffdf1231ee2c62320b49c99";
    await InstructorDataModel.create({
      userId: adminUserId,
    });
    await InstructorDataModel.create({
      userId: instructorUserId,
    });

    await CourseModel.create({
      _id: courseId,
      title: "New Course",
      description: "Course description",
      instructorId: instructorUserId,
    });
  });

  afterEach(async () => {
    await appStop();
    await mongoUnit.drop();
  });

  it("allows instructor to create a new course", async () => {
    const token = await getToken(instructorUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateCourse($action: CourseAction!) {
          addOrUpdateCourse(action: $action) {
            _id
            title
            description
            instructorId
            sectionIds
            deleted
          }
        }`,
        variables: {
          action: "CREATE",
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const courseData = response.body.data.addOrUpdateCourse;
    expect(courseData.title).to.equal("New Course");
    expect(courseData.description).to.equal("Course description");
    expect(courseData.instructorId).to.equal(instructorUserId);
    expect(courseData.sectionIds).to.be.an("array").that.is.empty;
    expect(courseData.deleted).to.be.false;

    // Verify the relationship exists via Course model
    const coursesForInstructor = await CourseModel.find({
      instructorId: instructorUserId,
    });
    expect(coursesForInstructor.map((c) => c._id.toString())).to.include(
      courseData._id
    );
  });

  it("allows instructor to create a new course with input data as defaults", async () => {
    const token = await getToken(instructorUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateCourse($courseData: CourseInputType, $action: CourseAction!) {
          addOrUpdateCourse(courseData: $courseData, action: $action) {
            _id
            title
            description
            instructorId
            sectionIds
            deleted
          }
        }`,
        variables: {
          courseData: {
            title: "Custom Course Title",
            description: "Custom Course Description",
          },
          action: "CREATE",
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const courseData = response.body.data.addOrUpdateCourse;
    expect(courseData.title).to.equal("Custom Course Title");
    expect(courseData.description).to.equal("Custom Course Description");
    expect(courseData.instructorId).to.equal(instructorUserId);
    expect(courseData.sectionIds).to.deep.equal([]);
    expect(courseData.deleted).to.be.false;

    // Verify the relationship exists via Course model
    const coursesForInstructor = await CourseModel.find({
      instructorId: instructorUserId,
    });
    expect(coursesForInstructor.map((c) => c._id.toString())).to.include(
      courseData._id
    );
  });

  it("allows admin to create a new course even without instructor data", async () => {
    const token = await getToken(adminUserId, UserRole.ADMIN);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateCourse($action: CourseAction!) {
          addOrUpdateCourse(action: $action) {
            _id
            title
            description
            instructorId
            sectionIds
            deleted
          }
        }`,
        variables: {
          action: "CREATE",
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const courseData = response.body.data.addOrUpdateCourse;
    expect(courseData.instructorId).to.equal(adminUserId);
    expect(courseData.title).to.equal("New Course");
    expect(courseData.description).to.equal("Course description");
  });

  it("allows instructor to modify their own course", async () => {
    const token = await getToken(instructorUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateCourse($courseData: CourseInputType, $action: CourseAction!) {
          addOrUpdateCourse(courseData: $courseData, action: $action) {
            _id
            title
            description
            instructorId
            sectionIds
            deleted
          }
        }`,
        variables: {
          courseData: {
            _id: courseId,
            title: "Updated Title",
            description: "Updated Description",
          },
          action: "MODIFY",
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const courseData = response.body.data.addOrUpdateCourse;
    expect(courseData.title).to.equal("Updated Title");
    expect(courseData.description).to.equal("Updated Description");
    expect(courseData.instructorId).to.equal(instructorUserId);

    const updatedCourse = await CourseModel.findById(courseId);
    expect(updatedCourse?.title).to.equal("Updated Title");
    expect(updatedCourse?.description).to.equal("Updated Description");
  });

  it("allows instructor to delete their own course", async () => {
    const token = await getToken(instructorUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateCourse($courseData: CourseInputType, $action: CourseAction!) {
          addOrUpdateCourse(courseData: $courseData, action: $action) {
            _id
            title
            description
            instructorId
            deleted
          }
        }`,
        variables: {
          courseData: {
            _id: courseId,
          },
          action: "DELETE",
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const courseData = response.body.data.addOrUpdateCourse;
    expect(courseData.deleted).to.be.true;

    const deletedCourse = await CourseModel.findOne({
      _id: courseId,
      deleted: true,
    });
    // pre-filter from deleting the course
    expect(deletedCourse).to.not.exist;

    // Verify no active courses remain for instructor
    const activeCourses = await CourseModel.find({
      instructorId: instructorUserId,
    });
    expect(activeCourses).to.be.empty;
  });

  it("allows admin to modify any course", async () => {
    const token = await getToken(adminUserId, UserRole.ADMIN);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateCourse($courseData: CourseInputType, $action: CourseAction!) {
          addOrUpdateCourse(courseData: $courseData, action: $action) {
            _id
            title
            description
            instructorId
            deleted
          }
        }`,
        variables: {
          courseData: {
            _id: courseId,
            title: "Admin Updated Title",
          },
          action: "MODIFY",
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const courseData = response.body.data.addOrUpdateCourse;
    expect(courseData.title).to.equal("Admin Updated Title");
  });

  it("throws error when non-instructor tries to create course", async () => {
    const regularUserId = "5ffdf1231ee2c62320b49b99";
    const token = await getToken(regularUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateCourse($action: CourseAction!) {
          addOrUpdateCourse(action: $action) {
            _id
          }
        }`,
        variables: {
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

  it("throws error when non-authenticated user tries to create course", async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `mutation AddOrUpdateCourse($action: CourseAction!) {
          addOrUpdateCourse(action: $action) {
            _id
          }
        }`,
        variables: {
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

  it("throws error when course not found for modify/delete", async () => {
    const token = await getToken(instructorUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateCourse($courseData: CourseInputType, $action: CourseAction!) {
          addOrUpdateCourse(courseData: $courseData, action: $action) {
            _id
          }
        }`,
        variables: {
          courseData: {
            _id: "000000000000000000000000",
          },
          action: "MODIFY",
        },
      });

    expect(response.status).to.equal(200);
    expect(
      response.body.errors.find((e: any) =>
        e.message.includes("course not found")
      )
    ).to.exist;
  });

  it("throws error when instructor tries to modify another instructor's course", async () => {
    const anotherInstructorId = "5ffdf1231ee2c62320b49c99";
    const newCourseId = new ObjectId().toString();
    await CourseModel.create({
      _id: newCourseId,
      title: "Another Instructor's Course",
      description: "Course Description",
      instructorId: anotherInstructorId,

      deleted: false,
    });

    const token = await getToken(instructorUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateCourse($courseData: CourseInputType, $action: CourseAction!) {
          addOrUpdateCourse(courseData: $courseData, action: $action) {
            _id
          }
        }`,
        variables: {
          courseData: {
            _id: newCourseId,
            title: "Hacked Title",
          },
          action: "MODIFY",
        },
      });

    expect(response.status).to.equal(200);
    expect(
      response.body.errors.find((e: any) =>
        e.message.includes(
          "Only owning instructor or admins can modify this course"
        )
      )
    ).to.exist;
  });

  it("throws error when courseData is missing for modify action", async () => {
    const token = await getToken(instructorUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateCourse($action: CourseAction!) {
          addOrUpdateCourse(action: $action) {
            _id
          }
        }`,
        variables: {
          action: "MODIFY",
        },
      });

    expect(response.status).to.equal(200);
    expect(
      response.body.errors.find((e: any) =>
        e.message.includes(
          "course data with _id is required for MODIFY and DELETE actions"
        )
      )
    ).to.exist;
  });

  it("throws error when courseData is missing for delete action", async () => {
    const token = await getToken(instructorUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateCourse($action: CourseAction!) {
          addOrUpdateCourse(action: $action) {
            _id
          }
        }`,
        variables: {
          action: "DELETE",
        },
      });

    expect(response.status).to.equal(200);
    expect(
      response.body.errors.find((e: any) =>
        e.message.includes(
          "course data with _id is required for MODIFY and DELETE actions"
        )
      )
    ).to.exist;
  });
});
