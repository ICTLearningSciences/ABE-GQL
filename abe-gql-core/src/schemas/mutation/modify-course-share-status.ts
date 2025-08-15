/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLID,
  GraphQLEnumType,
} from "graphql";
import { UserRole } from "../models/User";
import CourseModel from "../models/Course";
import InstructorDataModel, {
  CourseOwnership,
  InstructorData,
  InstructorDataType,
} from "../models/InstructorData";

const ShareCourseWithInstructorActionType = new GraphQLEnumType({
  name: "ShareCourseWithInstructorAction",
  values: {
    SHARE: { value: "SHARE" },
    UNSHARE: { value: "UNSHARE" },
  },
});

export const modifyCourseShareStatus = {
  type: InstructorDataType,
  args: {
    instructorId: { type: GraphQLNonNull(GraphQLID) },
    courseId: { type: GraphQLNonNull(GraphQLID) },
    action: { type: GraphQLNonNull(ShareCourseWithInstructorActionType) },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: {
      instructorId: string;
      courseId: string;
      action: "SHARE" | "UNSHARE";
    },
    context: {
      userId: string;
      userRole: UserRole;
    }
  ): Promise<InstructorData> => {
    if (!context.userId) {
      throw new Error("authenticated user required");
    }
    const instructorData = await InstructorDataModel.findOne({
      userId: context.userId,
    });

    if (context.userRole !== UserRole.ADMIN && !instructorData) {
      throw new Error("admins/instructors only");
    }

    const course = await CourseModel.findById(args.courseId);
    if (!course) {
      throw new Error("course not found");
    }

    const targetInstructorData = await InstructorDataModel.findOne({
      userId: args.instructorId,
    });
    if (!targetInstructorData) {
      throw new Error("target instructor not found");
    }

    if (args.action === "SHARE") {
      const alreadyShared = targetInstructorData.courses.some(
        (c) => `${c.courseId}` === `${course._id}`
      );
      if (!alreadyShared) {
        targetInstructorData.courses.push({
          courseId: course._id,
          ownership: CourseOwnership.SHARED,
        });
      }
    } else {
      targetInstructorData.courses = targetInstructorData.courses.filter(
        (c) => `${c.courseId}` !== `${course._id}`
      );
    }

    await targetInstructorData.save();
    return targetInstructorData;
  },
};

export default modifyCourseShareStatus;
