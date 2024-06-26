/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { GraphQLObjectType, GraphQLNonNull, GraphQLString } from "graphql";
import AnythingScalarType from "../types/anything-scalar-type";
import ConfigModel, { Config, ConfigType } from "../models/Config";
import { UserRole } from "../models/User";

export const updateConfigKey = {
  type: ConfigType,
  args: {
    key: { type: GraphQLNonNull(GraphQLString) },
    value: { type: GraphQLNonNull(AnythingScalarType) },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: {
      key: string;
      // eslint-disable-next-line   @typescript-eslint/no-explicit-any
      value: any;
    },
    context: {
      userRole?: UserRole;
      subdomain: string;
    }
  ): Promise<Config> => {
    if (context.userRole !== UserRole.ADMIN) {
      throw new Error("you do not have permission to edit config");
    }
    await ConfigModel.updateConfigByKey(
      context.subdomain,
      args.key,
      args.value
    );
    return await ConfigModel.getConfig({ subdomain: context.subdomain });
  },
};

export default updateConfigKey;
