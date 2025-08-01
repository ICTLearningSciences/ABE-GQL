/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLID,
  GraphQLList,
} from "graphql";
import { UserRole, EducationalRole } from "../models/User";
import UserModel from "../models/User";
import AssignmentModel, { AssignmentType } from "../models/Assignment";
import SectionModel from "../models/Section";
import StudentDataModel from "../models/StudentData";

export const fetchAssignments = {
  type: new GraphQLList(AssignmentType),
  args: {
    forUserId: { type: GraphQLNonNull(GraphQLID) },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: {
      forUserId: string;
    },
    context: {
      userId: string;
      userRole: UserRole;
    }
  ) => {
    if (!context.userId) {
      throw new Error("authenticated user required");
    }

    if (
      context.userId !== args.forUserId &&
      context.userRole !== UserRole.ADMIN
    ) {
      throw new Error("Unauthorized: You may only view your own assignments");
    }

    const user = await UserModel.findById(args.forUserId);
    if (!user) {
      throw new Error("user not found");
    }

    if (!user.educationalRole) {
      return [];
    }

    if (user.educationalRole === EducationalRole.INSTRUCTOR) {
      const assignments = await AssignmentModel.find({
        instructorId: args.forUserId,
      });
      return assignments;
    }

    if (user.educationalRole === EducationalRole.STUDENT) {
      const studentData = await StudentDataModel.findOne({
        userId: args.forUserId,
      });
      if (!studentData || !studentData.enrolledSections.length) {
        return [];
      }

      const sections = await SectionModel.find({
        _id: { $in: studentData.enrolledSections },
      });

      const assignmentIds: string[] = [];
      sections.forEach((section) => {
        section.assignments.forEach((assignment) => {
          if (!assignmentIds.includes(assignment.assignmentId)) {
            assignmentIds.push(assignment.assignmentId);
          }
        });
      });

      if (!assignmentIds.length) {
        return [];
      }

      const assignments = await AssignmentModel.find({
        _id: { $in: assignmentIds },
      });
      return assignments;
    }

    return [];
  },
};

export default fetchAssignments;
