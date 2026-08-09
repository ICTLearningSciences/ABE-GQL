/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/

import createApp, { appStart, appStop } from "../../../src/app";
import { expect } from "chai";
import { Express } from "express";
import { describe } from "mocha";
import { loadMongo, wipeMongo } from "test/fixtures/mongodb/data-default";
import request from "supertest";
import { UserRole } from "../../../src/schemas/types/types";
import { EducationalRole } from "../../../src/schemas/models/User";
import { getToken } from "../../helpers";

const UpdateUserRoleMutation = `
  mutation UpdateUserRole($userId: String!, $userRole: String, $educationalRole: String) {
    updateUserRole(userId: $userId, userRole: $userRole, educationalRole: $educationalRole) {
      _id
      userRole
      educationalRole
    }
  }
`;

describe("update user roles", () => {
  let app: Express;

  beforeEach(async () => {
    await mongoUnit.load(require("test/fixtures/mongodb/data-default.js"));
    app = await createApp();
    await appStart();
  });

  afterEach(async () => {
    await appStop();
    await wipeMongo();
  });

  it(`admin can edit a user's role`, async () => {
    const token = await getToken("5ffdf1231ee2c62320b49a99", UserRole.ADMIN); //user with role "ADMIN"
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${token}`)
      .send({
        query: UpdateUserRoleMutation,
        variables: {
          userId: "5ffdf1231ee2c62320b49e99",
          educationalRole: EducationalRole.INSTRUCTOR,
        },
      });
    expect(response.status).to.equal(200);
    expect(response.body.data.updateUserRole).to.have.property("_id");
    expect(response.body.data.updateUserRole).to.eql({
      _id: "5ffdf1231ee2c62320b49e99",
      userRole: UserRole.USER,
      educationalRole: EducationalRole.INSTRUCTOR,
    });
  });

  it(`admin can promote a user`, async () => {
    const token = await getToken("5ffdf1231ee2c62320b49a99", UserRole.ADMIN); //user with role "ADMIN"
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${token}`)
      .send({
        query: UpdateUserRoleMutation,
        variables: {
          userId: "5ffdf1231ee2c62320b49e99",
          userRole: UserRole.ADMIN,
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.data.updateUserRole).to.have.property("_id");
    expect(response.body.data.updateUserRole).to.eql({
      _id: "5ffdf1231ee2c62320b49e99",
      userRole: UserRole.ADMIN,
      educationalRole: null,
    });
  });

  it(`fails if requesting user is not an admin`, async () => {
    const token = await getToken("5ffdf1231ee2c62320b49a99", UserRole.USER); //user with role "USER"
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${token}`)
      .send({
        query: UpdateUserRoleMutation,
        variables: {
          userId: "5ffdf1231ee2c62320b49e99",
          educationalRole: EducationalRole.INSTRUCTOR,
        },
      });
    expect(response.status).to.equal(400);
  });
});
