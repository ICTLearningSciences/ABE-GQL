/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { GraphQLObjectType, GraphQLNonNull, GraphQLID, GraphQLString, GraphQLEnumType } from "graphql";
import UserModel, { User, UserRole, UserType } from "../models/User";
import StudentDataModel, { StudentData, StudentDataType } from "../models/StudentData";
import CourseModel, { Course } from "../models/Course";

const EnrollmentActionType = new GraphQLEnumType({
  name: "EnrollmentAction",
  values: {
    ENROLL: { value: "ENROLL" },
    REMOVE: { value: "REMOVE" },
  },
});

export const modifyCourseEnrollment = {
  type: StudentDataType,
  args: {
    targetUserId: { type: GraphQLNonNull(GraphQLID) },
    courseId: { type: GraphQLNonNull(GraphQLID) },
    action: { type: GraphQLNonNull(EnrollmentActionType) },
  },
  resolve: async (
    _root: GraphQLObjectType, 
    args: {
      targetUserId: string;
      courseId: string;
      action: "ENROLL" | "REMOVE";
    },
    context: {
      userId: string;
      userRole: UserRole;
    }
  ): Promise<StudentData> => {
    if (!context.userId) {
      throw new Error("authenticated user required");
    }

    const studentData = await StudentDataModel.findOne({ userId: args.targetUserId });
    if (!studentData) {
      throw new Error("student data not found for target user");
    }

    const course = await CourseModel.findById(args.courseId);
    if (!course) {
      throw new Error("course not found");
    }

    if (context.userId !== args.targetUserId && course.instructorId !== context.userId && context.userRole !== UserRole.ADMIN) {
      throw new Error("unauthorized: requesting user must be target user, course instructor or admin");
    }


    const courseIndex = studentData.enrolledCourses.indexOf(args.courseId);

    if (args.action === "ENROLL") {
      if (courseIndex !== -1) {
        throw new Error("user is already enrolled in this course");
      }
      studentData.enrolledCourses.push(args.courseId);
    } else if (args.action === "REMOVE") {
      if (courseIndex === -1) {
        throw new Error("user is not enrolled in this course");
      }
      studentData.enrolledCourses.splice(courseIndex, 1);
    }

    await studentData.save();
    return studentData;
  },
};

export default modifyCourseEnrollment;