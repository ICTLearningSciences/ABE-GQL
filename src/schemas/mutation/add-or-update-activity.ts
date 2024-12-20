/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { GraphQLNonNull } from "graphql";
import * as dotenv from "dotenv";
import ActivityModel, {
  Activity,
  ActivityInputType,
  ActivityType,
} from "../models/Activity";
import { UserRole } from "../models/User";
dotenv.config();

export const addOrUpdateActivity = {
  type: ActivityType,
  args: {
    activity: { type: GraphQLNonNull(ActivityInputType) },
  },
  async resolve(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _: any,
    args: {
      activity: Activity;
    },
    context: {
      userRole?: UserRole;
    }
  ) {
    const { userRole } = context;
    if (userRole !== UserRole.ADMIN) {
      throw new Error("unauthorized");
    }
    try {
      const updatedActivity = await ActivityModel.findOneAndUpdate(
        {
          _id: args.activity._id,
        },
        {
          $set: {
            ...args.activity,
          },
        },
        {
          new: true,
          upsert: true,
        }
      );
      return updatedActivity;
    } catch (e) {
      console.log(e);
      throw new Error(String(e));
    }
  },
};
export default addOrUpdateActivity;
