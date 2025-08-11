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
import InstructorDataModel from "../models/InstructorData";
import StudentDataModel, { StudentDataType } from "../models/StudentData";

export const fetchStudentsInMyCourses = {
  type: new GraphQLList(StudentDataType),
  args: {
    instructorId: { type: GraphQLNonNull(GraphQLID) },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: {
      instructorId: string;
    },
    context: {
      userId: string;
      userRole: UserRole;
    }
  ) => {
    if (!context.userId) {
      throw new Error("authenticated user required");
    }

    const instructorData = await InstructorDataModel.findOne({
      userId: args.instructorId,
    });

    if (!instructorData && context.userRole !== UserRole.ADMIN) {
      throw new Error("Only for instructors/admins");
    }

    if (!instructorData) {
      return [];
    }

    if (
      context.userId !== args.instructorId &&
      context.userRole !== UserRole.ADMIN
    ) {
      throw new Error("Only for instructors/admins");
    }

    const studentDataDocuments = await StudentDataModel.find({
      enrolledCourses: { $in: instructorData.courseIds },
    });

    return studentDataDocuments;
  },
};

export default fetchStudentsInMyCourses;
