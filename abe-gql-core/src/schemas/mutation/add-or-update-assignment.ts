/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLEnumType,
  GraphQLID,
} from "graphql";
import { UserRole } from "../models/User";
import AssignmentModel, {
  Assignment,
  AssignmentType,
  AssignmentInputType,
} from "../models/Assignment";
import CourseModel from "../models/Course";
import SectionModel from "../models/Section";
import InstructorDataModel from "../models/InstructorData";

const AssignmentActionType = new GraphQLEnumType({
  name: "AssignmentAction",
  values: {
    CREATE: { value: "CREATE" },
    MODIFY: { value: "MODIFY" },
    DELETE: { value: "DELETE" },
  },
});

export const addOrUpdateAssignment = {
  type: AssignmentType,
  args: {
    courseId: { type: GraphQLNonNull(GraphQLID) },
    assignmentData: { type: AssignmentInputType },
    action: { type: GraphQLNonNull(AssignmentActionType) },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: {
      courseId: string;
      assignmentData?: Assignment;
      action: "CREATE" | "MODIFY" | "DELETE";
    },
    context: {
      userId: string;
      userRole: UserRole;
    }
  ): Promise<Assignment> => {
    if (!context.userId) {
      throw new Error("authenticated user required");
    }

    const instructorData = await InstructorDataModel.findOne({
      userId: context.userId,
    });
    if (!instructorData && context.userRole !== UserRole.ADMIN) {
      throw new Error("instructors/admins only");
    }

    const course = await CourseModel.findById(args.courseId);
    if (!course) {
      throw new Error("course not found");
    }

    if (
      course.instructorId !== context.userId &&
      context.userRole !== UserRole.ADMIN
    ) {
      throw new Error(
        "unauthorized: only course instructor or admin can modify assignments"
      );
    }

    if (args.action === "CREATE") {
      const newAssignment = new AssignmentModel({
        title: "",
        description: "",
        activityIds: [],
        instructorId: context.userId,
        deleted: false,
      });

      await newAssignment.save();
      return newAssignment;
    }

    if (!args.assignmentData || !args.assignmentData._id) {
      throw new Error(
        "assignment data with _id is required for MODIFY and DELETE actions"
      );
    }

    const assignment = await AssignmentModel.findById(args.assignmentData._id);
    if (!assignment) {
      throw new Error("assignment not found");
    }

    if (
      assignment.instructorId !== context.userId &&
      context.userRole !== UserRole.ADMIN
    ) {
      throw new Error(
        "Only owning instructor or admins can modify this assignment"
      );
    }

    if (args.action === "DELETE") {
      assignment.deleted = true;
      await assignment.save();

      // Remove assignment from all sections owned by the course instructor
      await SectionModel.updateMany(
        { instructorId: course.instructorId },
        { $pull: { assignments: { assignmentId: args.assignmentData._id } } }
      );

      return assignment;
    }

    if (args.action === "MODIFY") {
      if (!args.assignmentData) {
        throw new Error("assignmentData is required for MODIFY action");
      }

      const updatedAssignment = await AssignmentModel.findByIdAndUpdate(
        args.assignmentData._id,
        { $set: args.assignmentData },
        { new: true }
      );

      if (!updatedAssignment) {
        throw new Error("failed to update assignment");
      }

      return updatedAssignment;
    }

    throw new Error("invalid action");
  },
};

export default addOrUpdateAssignment;
