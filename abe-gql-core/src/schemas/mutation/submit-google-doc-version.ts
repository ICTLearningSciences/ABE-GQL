/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import GDocVersionModel, {
  GDocVersionObjectType,
  GDocVersionInputType,
} from "../models/GoogleDocVersion";
import { GraphQLNonNull } from "graphql";
import * as dotenv from "dotenv";
import UserModel from "../models/User";
dotenv.config();

export const submitGoogleDocVersion = {
  type: GDocVersionObjectType,
  args: {
    googleDocData: { type: GraphQLNonNull(GDocVersionInputType) },
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async resolve(
    _: any,
    args: any,
    context: {
      userId: string;
    }
  ) {
    try {
      if (!context.userId) {
        throw new Error("authenticated user required");
      }
      const user = await UserModel.findById(context.userId);
      if (!user) {
        throw new Error("User not found");
      }
      const doc = await GDocVersionModel.create({
        ...args.googleDocData,
        userId: user._id,
        userClassroomCode: user.classroomCode,
      });
      return doc;
    } catch (e) {
      throw new Error(String(e));
    }
  },
};
export default submitGoogleDocVersion;
