/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { GraphQLList, GraphQLObjectType } from "graphql";
import * as dotenv from "dotenv";
import BuiltActivityModel, {
  BuiltActivityType,
  BuiltActivityVisibility,
} from "../../schemas/models/BuiltActivity/BuiltActivity";
import { UserRole } from "../../schemas/models/User";
dotenv.config();

export const fetchBuiltActivities = {
  type: GraphQLList(BuiltActivityType),
  async resolve(
    _root: GraphQLObjectType,
    _args: null,
    context: {
      userId?: string;
      userRole?: UserRole;
    }
  ) {
    const { userId, userRole } = context;
    try {
      return await BuiltActivityModel.find(
        userRole === UserRole.ADMIN
          ? {
              $or: [{ deleted: false }, { deleted: { $exists: false } }],
            }
          : {
              $and: [
                {
                  $or: [{ deleted: false }, { deleted: { $exists: false } }],
                },
                {
                  $or: [
                    {
                      user: userId,
                    },
                    {
                      visibility: BuiltActivityVisibility.READ_ONLY,
                    },
                    {
                      visibility: BuiltActivityVisibility.EDITABLE,
                    },
                  ],
                },
              ],
            }
      );
    } catch (e) {
      console.log(e);
      throw new Error(String(e));
    }
  },
};
export default fetchBuiltActivities;
