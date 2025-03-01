/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { GraphQLObjectType, GraphQLNonNull } from "graphql";
import UserModel, {
  User,
  UserInputType,
  UserType,
  IUserInputType,
  ClassroomCode,
} from "../models/User";

export const updateUserInfo = {
  type: UserType,
  args: {
    userInfo: { type: GraphQLNonNull(UserInputType) },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: {
      userInfo: IUserInputType;
    },
    context: {
      userId: string;
    }
  ): Promise<User> => {
    if (!context.userId) {
      throw new Error("authenticated user required");
    }
    const user = await UserModel.findOne({ _id: context.userId });
    if (!user) {
      throw new Error("user not found");
    }
    const inputClassroomCode: ClassroomCode | undefined = args.userInfo
      .classroomCode
      ? {
          code: args.userInfo.classroomCode,
          createdAt: new Date(),
        }
      : undefined;
    delete args.userInfo.classroomCode;
    if (
      inputClassroomCode &&
      user.classroomCode?.code !== inputClassroomCode.code
    ) {
      user.previousClassroomCodes.push(user.classroomCode);
      user.classroomCode = inputClassroomCode;
    }
    user.set(args.userInfo);
    await user.save();
    return user;
  },
};

export default updateUserInfo;
