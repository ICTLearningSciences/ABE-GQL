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
import { UserRole } from "../models/User";
import StudentDataModel, {
  StudentData,
  StudentDataType,
  ActivityCompletionInputType,
  ActivityCompletion,
} from "../models/StudentData";
import CourseModel from "../models/Course";
import SectionModel from "../models/Section";
import AssignmentModel from "../models/Assignment";

export const modifyStudentAssignmentProgress = {
  type: StudentDataType,
  args: {
    targetUserId: { type: GraphQLNonNull(GraphQLID) },
    courseId: { type: GraphQLNonNull(GraphQLID) },
    sectionId: { type: GraphQLNonNull(GraphQLID) },
    assignmentId: { type: GraphQLNonNull(GraphQLID) },
    activityCompletions: {
      type: GraphQLNonNull(new GraphQLList(ActivityCompletionInputType)),
    },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: {
      targetUserId: string;
      courseId: string;
      sectionId: string;
      assignmentId: string;
      activityCompletions: ActivityCompletion[];
    },
    context: {
      userId: string;
      userRole: UserRole;
    }
  ): Promise<StudentData> => {
    if (!context.userId) {
      throw new Error("authenticated user required");
    }

    const studentData = await StudentDataModel.findOne({
      userId: args.targetUserId,
    });
    if (!studentData) {
      throw new Error("student data not found for target user");
    }

    const course = await CourseModel.findById(args.courseId);
    if (!course) {
      throw new Error("course not found");
    }

    const section = await SectionModel.findById(args.sectionId);
    if (!section) {
      throw new Error("section not found");
    }

    const assignment = await AssignmentModel.findById(args.assignmentId);
    if (!assignment) {
      throw new Error("assignment not found");
    }

    if (
      context.userId !== args.targetUserId &&
      course.instructorId !== context.userId &&
      context.userRole !== UserRole.ADMIN
    ) {
      throw new Error(
        "unauthorized: requesting user must be target user, course instructor or admin"
      );
    }

    if (!course.sectionIds.includes(args.sectionId)) {
      throw new Error("section does not belong to the specified course");
    }

    const sectionAssignment = section.assignments.find(
      (sa) => sa.assignmentId === args.assignmentId
    );
    if (!sectionAssignment) {
      throw new Error("assignment does not belong to the specified section");
    }

    const existingProgressIndex = studentData.assignmentProgress.findIndex(
      (progress) => progress.assignmentId === args.assignmentId
    );

    if (existingProgressIndex !== -1) {
      studentData.assignmentProgress[
        existingProgressIndex
      ].activityCompletions = args.activityCompletions;
    } else {
      studentData.assignmentProgress.push({
        assignmentId: args.assignmentId,
        activityCompletions: args.activityCompletions,
      });
    }

    await studentData.save();
    return studentData;
  },
};

export default modifyStudentAssignmentProgress;
