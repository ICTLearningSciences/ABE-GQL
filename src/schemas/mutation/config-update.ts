/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLString,
} from "graphql";
import ConfigModel, { Config, ConfigType } from "../models/Config";
import { UserRole } from "../models/User";

export const ConfigUpdateInputType = new GraphQLInputObjectType({
  name: "ConfigUpdateInputType",
  fields: () => ({
    aiSystemPrompt: { type: GraphQLList(GraphQLString) },
  }),
});

export const updateConfig = {
  type: ConfigType,
  args: {
    config: { type: GraphQLNonNull(ConfigUpdateInputType) },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: { config: Config },
    context: { userRole: string; subdomain: string }
  ): Promise<Config> => {
    if (context.userRole !== UserRole.ADMIN) {
      throw new Error("you do not have permission to edit config");
    }
    // TODO: if this is every used, update to accomodate for subdomain
    await ConfigModel.saveConfig(args.config);
    return await ConfigModel.getConfig();
  },
};

export default updateConfig;
