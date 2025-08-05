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
import SectionModel from "../../../src/schemas/models/Section";
import CourseModel from "../../../src/schemas/models/Course";
import InstructorDataModel from "../../../src/schemas/models/InstructorData";
import mongoose from "mongoose";

const { ObjectId } = mongoose.Types;

describe("add or update section", () => {
  let app: Express;
  let instructorUserId: string;
  let courseId: string;
  let sectionId: string;

  beforeEach(async () => {
    await mongoUnit.load(require("../../fixtures/mongodb/data-default.js"));
    app = await createApp();
    await appStart();

    instructorUserId = "5ffdf1231ee2c62320b49a99";
    courseId = new ObjectId().toString();
    sectionId = new ObjectId().toString();

    await InstructorDataModel.create({
      userId: instructorUserId,
      courseIds: [courseId],
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

  it("allows instructor to create a new section", async () => {
    const token = await getToken(instructorUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateSection($courseId: ID!, $action: SectionAction!) {
          addOrUpdateSection(courseId: $courseId, action: $action) {
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
          courseId: courseId,
          action: "CREATE",
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const sectionData = response.body.data.addOrUpdateSection;
    expect(sectionData.title).to.equal("New Section");
    expect(sectionData.sectionCode).to.equal("");
    expect(sectionData.description).to.equal("");
    expect(sectionData.instructorId).to.equal(instructorUserId);
    expect(sectionData.assignments).to.be.an("array").that.is.empty;
    expect(sectionData.numOptionalAssignmentsRequired).to.equal(0);
    expect(sectionData.deleted).to.be.false;

    const updatedCourse = await CourseModel.findById(courseId);
    expect(updatedCourse?.sectionIds).to.include(sectionData._id);
  });

  it("allows instructor to create a new section with input data as defaults", async () => {
    const token = await getToken(instructorUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateSection($courseId: ID!, $sectionData: SectionInputType, $action: SectionAction!) {
          addOrUpdateSection(courseId: $courseId, sectionData: $sectionData, action: $action) {
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
          courseId: courseId,
          sectionData: {
            title: "Custom Section Title",
            sectionCode: "CUSTOM001",
            description: "Custom Section Description",
            assignments: [
              {
                assignmentId: "assignment1",
                mandatory: true,
              },
              {
                assignmentId: "assignment2",
                mandatory: false,
              },
            ],
            numOptionalAssignmentsRequired: 2,
          },
          action: "CREATE",
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const sectionData = response.body.data.addOrUpdateSection;
    expect(sectionData.title).to.equal("Custom Section Title");
    expect(sectionData.sectionCode).to.equal("CUSTOM001");
    expect(sectionData.description).to.equal("Custom Section Description");
    expect(sectionData.instructorId).to.equal(instructorUserId);
    expect(sectionData.assignments).to.deep.equal([
      {
        assignmentId: "assignment1",
        mandatory: true,
      },
      {
        assignmentId: "assignment2",
        mandatory: false,
      },
    ]);
    expect(sectionData.numOptionalAssignmentsRequired).to.equal(2);
    expect(sectionData.deleted).to.be.false;

    const updatedCourse = await CourseModel.findById(courseId);
    expect(updatedCourse?.sectionIds).to.include(sectionData._id);
  });

  it("allows admin to create a new section even without instructor data", async () => {
    const adminUserId = "5ffdf1231ee2c62320b49c99";
    const token = await getToken(adminUserId, UserRole.ADMIN);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateSection($courseId: ID!, $action: SectionAction!) {
          addOrUpdateSection(courseId: $courseId, action: $action) {
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

    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const sectionData = response.body.data.addOrUpdateSection;
    expect(sectionData.instructorId).to.equal(adminUserId);
  });

  it("allows instructor to modify their own section", async () => {
    await SectionModel.create({
      _id: sectionId,
      title: "Original Section",
      sectionCode: "ORIG001",
      description: "Original Description",
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
        query: `mutation AddOrUpdateSection($courseId: ID!, $sectionData: SectionInputType, $action: SectionAction!) {
          addOrUpdateSection(courseId: $courseId, sectionData: $sectionData, action: $action) {
            _id
            title
            sectionCode
            description
            instructorId
          }
        }`,
        variables: {
          courseId: courseId,
          sectionData: {
            _id: sectionId,
            title: "Updated Section",
            sectionCode: "UPD001",
            description: "Updated Description",
          },
          action: "MODIFY",
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const sectionData = response.body.data.addOrUpdateSection;
    expect(sectionData.title).to.equal("Updated Section");
    expect(sectionData.sectionCode).to.equal("UPD001");
    expect(sectionData.description).to.equal("Updated Description");

    const updatedSection = await SectionModel.findById(sectionId);
    expect(updatedSection?.title).to.equal("Updated Section");
    expect(updatedSection?.sectionCode).to.equal("UPD001");
  });

  it("allows instructor to delete their own section", async () => {
    const course = await CourseModel.findById(courseId);
    course?.sectionIds.push(sectionId);
    await course?.save();

    await SectionModel.create({
      _id: sectionId,
      title: "Section to Delete",
      sectionCode: "DEL001",
      description: "Section Description",
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
        query: `mutation AddOrUpdateSection($courseId: ID!, $sectionData: SectionInputType, $action: SectionAction!) {
          addOrUpdateSection(courseId: $courseId, sectionData: $sectionData, action: $action) {
            _id
            title
            deleted
          }
        }`,
        variables: {
          courseId: courseId,
          sectionData: {
            _id: sectionId,
          },
          action: "DELETE",
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const sectionData = response.body.data.addOrUpdateSection;
    expect(sectionData.deleted).to.be.true;

    const deletedSection = await SectionModel.findOne({ _id: sectionId });
    expect(deletedSection).to.not.exist;

    const updatedCourse = await CourseModel.findById(courseId);
    expect(updatedCourse?.sectionIds).to.not.include(sectionId);
  });

  it("allows admin to modify any section", async () => {
    await SectionModel.create({
      _id: sectionId,
      title: "Original Section",
      sectionCode: "ORIG001",
      description: "Original Description",
      instructorId: instructorUserId,
      assignments: [],
      numOptionalAssignmentsRequired: 0,
      deleted: false,
    });

    const adminUserId = "5ffdf1231ee2c62320b49c99";
    const token = await getToken(adminUserId, UserRole.ADMIN);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateSection($courseId: ID!, $sectionData: SectionInputType, $action: SectionAction!) {
          addOrUpdateSection(courseId: $courseId, sectionData: $sectionData, action: $action) {
            _id
            title
            sectionCode
          }
        }`,
        variables: {
          courseId: courseId,
          sectionData: {
            _id: sectionId,
            title: "Admin Updated Section",
            sectionCode: "ADM001",
          },
          action: "MODIFY",
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const sectionData = response.body.data.addOrUpdateSection;
    expect(sectionData.title).to.equal("Admin Updated Section");
  });

  it("throws error when non-instructor tries to create section", async () => {
    const regularUserId = "5ffdf1231ee2c62320b49b99";
    const token = await getToken(regularUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateSection($courseId: ID!, $action: SectionAction!) {
          addOrUpdateSection(courseId: $courseId, action: $action) {
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

  it("throws error when non-authenticated user tries to create section", async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `mutation AddOrUpdateSection($courseId: ID!, $action: SectionAction!) {
          addOrUpdateSection(courseId: $courseId, action: $action) {
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
        query: `mutation AddOrUpdateSection($courseId: ID!, $action: SectionAction!) {
          addOrUpdateSection(courseId: $courseId, action: $action) {
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

  it("throws error when instructor tries to modify another instructor's course sections", async () => {
    const anotherInstructorId = "5ffdf1231ee2c62320b49c99";
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
        query: `mutation AddOrUpdateSection($courseId: ID!, $action: SectionAction!) {
          addOrUpdateSection(courseId: $courseId, action: $action) {
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
          "unauthorized: only course instructor or admin can modify sections"
        )
      )
    ).to.exist;
  });

  it("throws error when section not found for modify/delete", async () => {
    const token = await getToken(instructorUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateSection($courseId: ID!, $sectionData: SectionInputType, $action: SectionAction!) {
          addOrUpdateSection(courseId: $courseId, sectionData: $sectionData, action: $action) {
            _id
          }
        }`,
        variables: {
          courseId: courseId,
          sectionData: {
            _id: "000000000000000000000000",
          },
          action: "MODIFY",
        },
      });

    expect(response.status).to.equal(200);
    expect(
      response.body.errors.find((e: any) =>
        e.message.includes("section not found")
      )
    ).to.exist;
  });

  it("throws error when sectionData is missing for modify action", async () => {
    const token = await getToken(instructorUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateSection($courseId: ID!, $action: SectionAction!) {
          addOrUpdateSection(courseId: $courseId, action: $action) {
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
          "section data with _id is required for MODIFY and DELETE actions"
        )
      )
    ).to.exist;
  });

  it("throws error when sectionData is missing for delete action", async () => {
    const token = await getToken(instructorUserId, UserRole.USER);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `mutation AddOrUpdateSection($courseId: ID!, $action: SectionAction!) {
          addOrUpdateSection(courseId: $courseId, action: $action) {
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
          "section data with _id is required for MODIFY and DELETE actions"
        )
      )
    ).to.exist;
  });
});
