/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { GraphQLObjectType, GraphQLNonNull, GraphQLEnumType } from "graphql";
import { UserRole } from "../models/User";
import CourseModel, {
  Course,
  CourseType,
  CourseInputType,
} from "../models/Course";
import InstructorDataModel from "../models/InstructorData";

const CourseActionType = new GraphQLEnumType({
  name: "CourseAction",
  values: {
    CREATE: { value: "CREATE" },
    MODIFY: { value: "MODIFY" },
    DELETE: { value: "DELETE" },
  },
});

export const addOrUpdateCourse = {
  type: CourseType,
  args: {
    courseData: { type: CourseInputType },
    action: { type: GraphQLNonNull(CourseActionType) },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: {
      courseData?: Course;
      action: "CREATE" | "MODIFY" | "DELETE";
    },
    context: {
      userId: string;
      userRole: UserRole;
    }
  ): Promise<Course> => {
    if (!context.userId) {
      throw new Error("authenticated user required");
    }

    const instructorData = await InstructorDataModel.findOne({
      userId: context.userId,
    });
    if (!instructorData && context.userRole !== UserRole.ADMIN) {
      throw new Error("instructors/admins only");
    }

    if (args.action === "CREATE") {
      const newCourse = new CourseModel({
        title: "New Course",
        description: "Course description",
        instructorId: context.userId,
        sectionIds: [],
        deleted: false,
      });

      await newCourse.save();

      if (instructorData) {
        instructorData.courseIds.push(newCourse._id.toString());
        await instructorData.save();
      }

      return newCourse;
    }

    if (!args.courseData || !args.courseData._id) {
      throw new Error(
        "course data with _id is required for MODIFY and DELETE actions"
      );
    }

    const course = await CourseModel.findById(args.courseData._id);
    if (!course) {
      throw new Error("course not found");
    }

    if (
      course.instructorId !== context.userId &&
      context.userRole !== UserRole.ADMIN
    ) {
      throw new Error(
        "Only owning instructor or admins can modify this course"
      );
    }

    if (args.action === "DELETE") {
      course.deleted = true;
      await course.save();

      if (instructorData) {
        const courseIndex = instructorData.courseIds.indexOf(
          args.courseData._id
        );
        if (courseIndex !== -1) {
          instructorData.courseIds.splice(courseIndex, 1);
          await instructorData.save();
        }
      }

      return course;
    }

    if (args.action === "MODIFY") {
      if (!args.courseData) {
        throw new Error("courseData is required for MODIFY action");
      }

      const updatedCourse = await CourseModel.findByIdAndUpdate(
        args.courseData._id,
        { $set: args.courseData },
        { new: true }
      );

      if (!updatedCourse) {
        throw new Error("failed to update course");
      }

      return updatedCourse;
    }

    throw new Error("invalid action");
  },
};

export default addOrUpdateCourse;
