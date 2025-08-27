/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import UserModel, { EducationalRole, UserRole } from "../models/User";
import StudentDataModel, { StudentDataType } from "../models/StudentData";
import { GraphQLInt, GraphQLNonNull, GraphQLString } from "graphql";
import * as dotenv from "dotenv";
import InstructorDataModel from "../models/InstructorData";
dotenv.config();

export const gradeStudentAssignment = {
  type: StudentDataType,
  args: {
    studentId: { type: GraphQLNonNull(GraphQLString) },
    assignmentId: { type: GraphQLNonNull(GraphQLString) },
    grade: { type: GraphQLNonNull(GraphQLInt) },
    comment: { type: GraphQLString },
  },
  async resolve(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _: any,
    args: {
      studentId: string;
      assignmentId: string;
      grade: number;
      comment: string;
    },
    context: {
      userId: string;
    }
  ) {
    if (!context.userId) {
      throw new Error("authenticated user required");
    }

    const userData = await UserModel.findOne({ _id: context.userId });
    if (!userData) {
      throw new Error("user data not found");
    }

    if (userData.educationalRole !== EducationalRole.INSTRUCTOR) {
      throw new Error("instructor required");
    }

    const instructorData = await InstructorDataModel.findOne({
      userId: context.userId,
    });
    if (!instructorData) {
      throw new Error("instructor data not found");
    }

    try {
      const { studentId, assignmentId, grade, comment } = args;
      const updatedStudent = await StudentDataModel.findOne({
        userId: studentId,
      });
      if (!updatedStudent) {
        throw new Error("student data not found");
      }

      updatedStudent.assignmentProgress.forEach((assignment) => {
        if (assignment.assignmentId === assignmentId) {
          assignment.instructorGrade = {
            grade: grade,
            comment: comment,
          };
        }
      });

      await updatedStudent.save();

      return updatedStudent;
    } catch (e) {
      console.log(e);
      throw new Error(String(e));
    }
  },
};
export default gradeStudentAssignment;
