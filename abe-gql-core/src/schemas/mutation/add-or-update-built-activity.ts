/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { GraphQLNonNull } from "graphql";
import * as dotenv from "dotenv";

import BuiltActivityModel, {
  BuiltActivityInputType,
  BuiltActivityType,
  BuiltActivityVisibility,
} from "../../schemas/models/BuiltActivity/BuiltActivity";
import { ActivityBuilder } from "../../schemas/models/BuiltActivity/types";
import { idOrNew } from "../../helpers";
import { UserRole } from "../../schemas/types/types";
dotenv.config();

export const addOrUpdateBuiltActivity = {
  type: BuiltActivityType,
  args: {
    activity: { type: GraphQLNonNull(BuiltActivityInputType) },
  },
  async resolve(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _: any,
    args: {
      activity: ActivityBuilder;
    },
    context: {
      userRole?: string;
      userId?: string;
    }
  ) {
    if (!context.userRole) {
      throw new Error("unauthorized");
    }
    try {
      const id = idOrNew(args.activity._id);
      const existingActivity = await BuiltActivityModel.findById(id);
      if (existingActivity) {
        if (
          context.userRole !== UserRole.ADMIN &&
          context.userId !== `${existingActivity.user}` &&
          existingActivity.visibility !== BuiltActivityVisibility.EDITABLE
        ) {
          throw new Error("unauthorized");
        }
      }
      delete args.activity._id;
      const updatedActivity = await BuiltActivityModel.findOneAndUpdate(
        {
          _id: id,
        },
        {
          ...args.activity,
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
export default addOrUpdateBuiltActivity;
