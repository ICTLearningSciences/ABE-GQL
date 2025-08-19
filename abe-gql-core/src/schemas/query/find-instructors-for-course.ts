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
import InstructorDataModel, {
  InstructorDataType,
  InstructorData,
} from "../models/InstructorData";
import CourseModel from "../models/Course";

export const findInstructorsForCourse = {
  type: new GraphQLList(InstructorDataType),
  args: {
    courseId: { type: GraphQLNonNull(GraphQLID) },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: {
      courseId: string;
    },
    context: {
      userId: string;
      userRole: UserRole;
    }
  ): Promise<InstructorData[]> => {
    if (!context.userId) {
      throw new Error("authenticated user required");
    }

    const course = await CourseModel.findById(args.courseId);
    if (!course) {
      throw new Error("course not found");
    }

    if (
      context.userRole !== UserRole.ADMIN &&
      course.instructorId !== context.userId
    ) {
      throw new Error(
        "unauthorized: only admins and instructors of the course can fetch instructors for this course"
      );
    }

    const instructorData = await InstructorDataModel.find({
      courses: {
        $elemMatch: {
          courseId: args.courseId,
        },
      },
    });

    return instructorData;
  },
};

export default findInstructorsForCourse;
