/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { GraphQLNonNull, GraphQLString } from "graphql";
import * as dotenv from "dotenv";

import BuiltActivityModel from "../../schemas/models/BuiltActivity/BuiltActivity";
import { UserRole } from "../../schemas/types/types";
dotenv.config();

export const deleteBuiltActivity = {
  type: GraphQLString,
  args: {
    activityIdToDelete: { type: GraphQLNonNull(GraphQLString) },
  },
  async resolve(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _: any,
    args: {
      activityIdToDelete: string;
    },
    context: {
      userRole?: string;
      userId?: string;
    }
  ) {
    console.log("test");
    if (
      !context.userRole ||
      (context.userRole !== UserRole.ADMIN &&
        context.userRole !== UserRole.CONTENT_MANAGER)
    ) {
      throw new Error("unauthorized");
    }
    try {
      const existingActivity = await BuiltActivityModel.findById(
        args.activityIdToDelete
      );
      if (!existingActivity) {
        throw new Error("activity not found");
      }
      if (
        context.userRole !== UserRole.ADMIN &&
        existingActivity.user !== context.userId
      ) {
        throw new Error("unauthorized");
      }
      await BuiltActivityModel.findByIdAndUpdate(args.activityIdToDelete, {
        deleted: true,
      });
      return args.activityIdToDelete;
    } catch (e) {
      console.log(e);
      throw new Error(String(e));
    }
  },
};
export default deleteBuiltActivity;
