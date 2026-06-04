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
import { UserRole } from "../../../src/schemas/types/types";
import { EducationalRole } from "../../../src/schemas/models/User";
import UserModel from "../../../src/schemas/models/User";
import mongoose from "mongoose";

const { ObjectId } = mongoose.Types;

describe("fetch users", () => {
  let app: Express;
  let instructorUserId: string;
  let studentUserId: string;
  let userId1: string;
  let userId2: string;
  let userId3: string;
  let user1SharedInstructorId: string;

  beforeEach(async () => {
    await mongoUnit.load(require("../../fixtures/mongodb/data-default.js"));
    app = await createApp();
    await appStart();

    instructorUserId = new ObjectId().toString();
    user1SharedInstructorId = new ObjectId().toString();
    studentUserId = new ObjectId().toString();
    userId1 = new ObjectId().toString();
    userId2 = new ObjectId().toString();
    userId3 = new ObjectId().toString();

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

    // create instructor data with shared user
    await UserModel.create({
      _id: user1SharedInstructorId,
      googleId: "shared-instructor-google-id",
      name: "Shared Instructor",
      email: "shared@test.com",
      userRole: "USER",
      loginService: "GOOGLE",
      educationalRole: EducationalRole.INSTRUCTOR,
    });

    // Create user by another instructor
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
  });

  afterEach(async () => {
    await appStop();
    await mongoUnit.drop();
  });

  it("allows admin to fetch users", async () => {
    const token = await getToken(instructorUserId, UserRole.ADMIN);
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `query FetchUsers {
          fetchUsers {
            name
            email
          }
        }`,
      });
    expect(response.status).to.equal(200);
    expect(response.body.errors).to.be.undefined;

    const users = response.body.data.fetchUsers;
    expect(users).to.be.an("array").with.length(6);
    expect(users).to.eql([
      { name: "John Doe", email: "johndoe@gmail.com" },
      { name: "John Admin Doe", email: "johnadmindoe@gmail.com" },
      { name: "Test Instructor", email: "instructor@test.com" },
      { name: "Test Student", email: "student@test.com" },
      { name: "Shared Instructor", email: "shared@test.com" },
      { name: "Another Instructor", email: "another@test.com" },
    ]);
  });

  it("throws error when non-authenticated user tries to fetch users", async () => {
    const token = await getToken(instructorUserId, UserRole.USER);
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `bearer ${token}`)
      .send({
        query: `query FetchUsers {
          fetchUsers {
            name
            email
          }
        }`,
      });
    expect(response.status).to.equal(400);
  });
});
