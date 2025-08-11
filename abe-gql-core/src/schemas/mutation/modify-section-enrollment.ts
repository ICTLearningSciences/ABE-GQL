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
  GraphQLString,
} from "graphql";
import { UserRole } from "../models/User";
import StudentDataModel, {
  StudentData,
  StudentDataType,
} from "../models/StudentData";
import CourseModel from "../models/Course";
import SectionModel from "../models/Section";

const SectionEnrollmentActionType = new GraphQLEnumType({
  name: "SectionEnrollmentAction",
  values: {
    ENROLL: { value: "ENROLL" },
    REMOVE: { value: "REMOVE" },
  },
});

export const modifySectionEnrollment = {
  type: StudentDataType,
  args: {
    targetUserId: { type: GraphQLNonNull(GraphQLID) },
    courseId: { type: GraphQLID },
    sectionId: { type: GraphQLID },
    action: { type: GraphQLNonNull(SectionEnrollmentActionType) },
    sectionCode: { type: GraphQLString },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: {
      targetUserId: string;
      courseId?: string;
      sectionId?: string;
      action: "ENROLL" | "REMOVE";
      sectionCode?: string;
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

    if (args.action === "REMOVE") {
      // REMOVE action requires courseId and sectionId
      if (!args.courseId || !args.sectionId) {
        throw new Error(
          "courseId and sectionId are required for removing from section"
        );
      }

      const course = await CourseModel.findById(args.courseId);
      if (!course) {
        throw new Error("course not found");
      }

      const section = await SectionModel.findById(args.sectionId);
      if (!section) {
        throw new Error("section not found");
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

      if (section.courseId !== args.courseId) {
        throw new Error("section does not belong to the specified course");
      }

      const sectionIndex = studentData.enrolledSections.indexOf(args.sectionId);
      if (sectionIndex === -1) {
        throw new Error("user is not enrolled in this section");
      }

      studentData.enrolledSections.splice(sectionIndex, 1);

      // Check if user is still enrolled in any other sections of this course
      const enrolledSections = await SectionModel.find({
        _id: { $in: studentData.enrolledSections },
        courseId: args.courseId,
      });
      const remainingSectionsInCourse = enrolledSections;

      // If no other sections in this course, remove the course from enrolledCourses
      if (remainingSectionsInCourse.length === 0) {
        const courseIndex = studentData.enrolledCourses.indexOf(args.courseId);
        if (courseIndex !== -1) {
          studentData.enrolledCourses.splice(courseIndex, 1);
        }
      }
    } else if (args.action === "ENROLL") {
      // ENROLL action requires only sectionCode
      if (!args.sectionCode) {
        throw new Error("section code is required for enrollment");
      }

      const section = await SectionModel.findOne({
        sectionCode: args.sectionCode,
      });
      if (!section) {
        throw new Error("section not found with the provided section code");
      }
      // Find course using section's courseId
      const course = await CourseModel.findById(section.courseId);
      if (!course) {
        throw new Error("course not found for the specified section");
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

      const sectionIdStr = section._id.toString();
      const courseIdStr = course._id.toString();

      if (studentData.enrolledSections.includes(sectionIdStr)) {
        throw new Error("user is already enrolled in this section");
      }

      // Add course to enrolledCourses if not already enrolled
      if (!studentData.enrolledCourses.includes(courseIdStr)) {
        studentData.enrolledCourses.push(courseIdStr);
      }

      studentData.enrolledSections.push(sectionIdStr);
    }

    await studentData.save();
    return studentData;
  },
};

export default modifySectionEnrollment;
