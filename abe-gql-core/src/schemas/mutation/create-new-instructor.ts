/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { GraphQLObjectType, GraphQLNonNull, GraphQLID } from "graphql";
import UserModel, { EducationalRole } from "../models/User";
import InstructorDataModel, {
  InstructorData,
  InstructorDataType,
} from "../models/InstructorData";

export const createNewInstructor = {
  type: InstructorDataType,
  args: {
    userId: { type: GraphQLNonNull(GraphQLID) },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: {
      userId: string;
    }
  ): Promise<InstructorData> => {
    const user = await UserModel.findById(args.userId);
    if (!user) {
      throw new Error("user not found");
    }

    if (user.educationalRole !== EducationalRole.INSTRUCTOR) {
      user.educationalRole = EducationalRole.INSTRUCTOR;
      await user.save();
    }

    const existingInstructorData = await InstructorDataModel.findOne({
      userId: args.userId,
    });

    if (existingInstructorData) {
      return existingInstructorData;
    }

    const instructorData = new InstructorDataModel({
      userId: args.userId,
      courseIds: [],
    });

    await instructorData.save();
    return instructorData;
  },
};

export default createNewInstructor;
