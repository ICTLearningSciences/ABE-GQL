/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import mongoose, { Document, Model, Schema } from "mongoose";
import {
  GraphQLList,
  GraphQLString,
  GraphQLObjectType,
  GraphQLInputObjectType,
} from "graphql";
import OrgModel from "./Organization";

export interface ConfigEntry {
  key: string;
  value: any; // eslint-disable-line  @typescript-eslint/no-explicit-any
}

export enum AiServiceNames {
  AZURE = "AZURE",
  OPEN_AI = "OPEN_AI",
  GEMINI = "GEMINI",
}

export interface AiModelService {
  serviceName: AiServiceNames;
  model: string;
}

export interface Config {
  aiSystemPrompt: string[];
  displayedGoals?: string[];
  displayedActivities?: string[];
  overrideAiModel?: AiModelService; // overrides ALL requests for this org (should not be set in global config)
  defaultAiModel?: AiModelService;
  availableAiServiceModels?: Record<AiServiceNames, string[]>;
}

type ConfigKey = keyof Config;
export const ConfigKeys: ConfigKey[] = [
  "aiSystemPrompt",
  "displayedGoals",
  "displayedActivities",
  "overrideAiModel",
  "defaultAiModel",
  "availableAiServiceModels",
];

export function getDefaultConfig(): Config {
  return {
    aiSystemPrompt: [],
    displayedGoals: undefined,
    displayedActivities: undefined,
    overrideAiModel: undefined,
    defaultAiModel: undefined,
    availableAiServiceModels: undefined,
  };
}

export const AiModelServiceType = new GraphQLObjectType({
  name: "AiModelServiceType",
  fields: {
    serviceName: { type: GraphQLString },
    model: { type: GraphQLString },
  },
});

export const AiModelServiceInputType = new GraphQLInputObjectType({
  name: "AiModelServiceInputType",
  fields: {
    serviceName: { type: GraphQLString },
    model: { type: GraphQLString },
  },
});

export const AvailabeAiServiceModelsType = new GraphQLObjectType({
  name: "AvailabeAiServiceModelsType",
  fields: {
    serviceName: { type: GraphQLString },
    models: { type: GraphQLList(GraphQLString) },
  },
});

export const ConfigType = new GraphQLObjectType({
  name: "Config",
  fields: () => ({
    aiSystemPrompt: { type: GraphQLList(GraphQLString) },
    displayedGoals: { type: GraphQLList(GraphQLString) },
    displayedActivities: { type: GraphQLList(GraphQLString) },
    overrideAiModel: { type: AiModelServiceType },
    defaultAiModel: { type: AiModelServiceType },
    availableAiServiceModels: {
      type: GraphQLList(AvailabeAiServiceModelsType),
    },
  }),
});

export interface ConfigDoc extends ConfigEntry, Document {}

export const ConfigSchema = new Schema<ConfigDoc>(
  {
    key: { type: String, unique: true },
    value: { type: Schema.Types.Mixed },
  },
  { timestamps: true, collation: { locale: "en", strength: 2 } }
);

export function reduceConfigEntriesToConfig(
  entries: ConfigEntry[],
  defaults: Config = getDefaultConfig()
): Config {
  return entries.reduce((acc: Config, cur: ConfigEntry) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (acc as any)[cur.key] = cur.value;
    return acc;
  }, defaults);
}

ConfigSchema.statics.getConfig = async function (args?: {
  subdomain: string;
  defaults?: Config;
}) {
  const subdomain = args?.subdomain;
  const defaultConfig = args?.defaults || getDefaultConfig();
  const globalConfigEntries: ConfigEntry[] = await this.find({
    key: { $in: ConfigKeys },
  });
  const globalConfig = reduceConfigEntriesToConfig(
    globalConfigEntries,
    defaultConfig
  );
  if (subdomain) {
    const org = await OrgModel.findOne({ subdomain });
    if (org && org.customConfig) {
      const orgCustomConfig = reduceConfigEntriesToConfig(
        org.customConfig,
        globalConfig
      );
      return orgCustomConfig;
    }
  }
  return globalConfig;
};

ConfigSchema.statics.saveConfig = async function (
  config: Partial<Config>
): Promise<void> {
  await Promise.all(
    Object.getOwnPropertyNames(config).map((key) => {
      return this.findOneAndUpdate(
        { key },
        {
          $set: { value: config[key as keyof Config] },
        },
        {
          upsert: true,
        }
      );
    })
  );
};

export interface ConfigModel extends Model<ConfigDoc> {
  getConfig(args?: {
    subdomain: string;
    defaults?: Partial<Config>;
  }): Promise<Config>;
  saveConfig(config: Partial<Config>): Promise<void>;
}

export default mongoose.model<ConfigDoc, ConfigModel>("Config", ConfigSchema);
