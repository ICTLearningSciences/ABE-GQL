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
  GraphQLBoolean,
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

interface IActivityConfig {
  activity: string;
  disabled: boolean;
}

interface IGoalActivities {
  goal: string;
  activities: IActivityConfig[];
}

export const ActivityConfigType = new GraphQLObjectType({
  name: "ActivityConfigType",
  fields: {
    activity: { type: GraphQLString },
    disabled: { type: GraphQLBoolean },
  },
});

export const ActivityConfigInputType = new GraphQLInputObjectType({
  name: "ActivityConfigInputType",
  fields: {
    activity: { type: GraphQLString },
    disabled: { type: GraphQLBoolean },
  },
});

export const GoalActivitiesType = new GraphQLObjectType({
  name: "GoalActivitiesType",
  fields: {
    goal: { type: GraphQLString },
    activities: { type: GraphQLList(ActivityConfigType) },
  },
});

export const GoalActivitiesInputType = new GraphQLInputObjectType({
  name: "GoalActivitiesInputType",
  fields: {
    goal: { type: GraphQLString },
    activities: { type: GraphQLList(ActivityConfigInputType) },
  },
});

export interface ColorThemeConfig {
  headerColor: string;
  headerButtonsColor: string;
  chatSystemBubbleColor: string;
  chatSystemTextColor: string;
  chatUserBubbleColor: string;
  chatUserTextColor: string;
}

export const ColorThemeConfigType = new GraphQLObjectType({
  name: "ColorThemeConfig",
  fields: {
    headerColor: { type: GraphQLString },
    headerButtonsColor: { type: GraphQLString },
    chatSystemBubbleColor: { type: GraphQLString },
    chatSystemTextColor: { type: GraphQLString },
    chatUserBubbleColor: { type: GraphQLString },
    chatUserTextColor: { type: GraphQLString },
  },
});

export const ColorThemeConfigInputType = new GraphQLInputObjectType({
  name: "ColorThemeConfigInput",
  fields: {
    headerColor: { type: GraphQLString },
    headerButtonsColor: { type: GraphQLString },
    chatSystemBubbleColor: { type: GraphQLString },
    chatSystemTextColor: { type: GraphQLString },
    chatUserBubbleColor: { type: GraphQLString },
    chatUserTextColor: { type: GraphQLString },
  },
});

export interface Config {
  aiSystemPrompt: string[];
  displayedGoalActivities?: IGoalActivities[];
  exampleGoogleDocs?: string[];
  overrideAiModel?: AiModelService; // overrides ALL requests for this org (should not be set in global config)
  defaultAiModel?: AiModelService;
  availableAiServiceModels?: Record<AiServiceNames, string[]>;
  colorTheme?: Partial<ColorThemeConfig>;
  headerTitle?: string;
}

type ConfigKey = keyof Config;
export const ConfigKeys: ConfigKey[] = [
  "aiSystemPrompt",
  "displayedGoalActivities",
  "colorTheme",
  "exampleGoogleDocs",
  "overrideAiModel",
  "defaultAiModel",
  "availableAiServiceModels",
  "headerTitle",
];

export function getDefaultConfig(): Config {
  return {
    aiSystemPrompt: [],
    displayedGoalActivities: [],
    exampleGoogleDocs: [],
    overrideAiModel: undefined,
    defaultAiModel: undefined,
    availableAiServiceModels: undefined,
    colorTheme: {},
    headerTitle: "",
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

export const AiModelServiceSchema = new Schema(
  {
    serviceName: { type: String, required: false },
    model: { type: String, required: false },
  },
  { _id: false }
);

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
    displayedGoalActivities: {
      type: GraphQLList(GoalActivitiesType),
    },
    exampleGoogleDocs: { type: GraphQLList(GraphQLString) },
    overrideAiModel: { type: AiModelServiceType },
    defaultAiModel: { type: AiModelServiceType },
    availableAiServiceModels: {
      type: GraphQLList(AvailabeAiServiceModelsType),
    },
    colorTheme: { type: ColorThemeConfigType },
    headerTitle: { type: GraphQLString },
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

ConfigSchema.statics.updateConfigByKey = async function (
  subdomain: string,
  key: string,
  value: any // eslint-disable-line  @typescript-eslint/no-explicit-any
): Promise<void> {
  const org = subdomain ? await OrgModel.findOne({ subdomain }) : undefined;
  if (!org) {
    // update global config
    await this.findOneAndUpdate(
      { key },
      {
        $set: { value },
      },
      {
        upsert: true,
      }
    );
  } else {
    // update org config
    const orgConfig = (org.customConfig.toObject() as ConfigEntry[]) || [];
    const updatedConfig = orgConfig.map((entry) => {
      if (entry.key === key) {
        return { key, value };
      }
      return entry;
    });
    await OrgModel.updateOne(
      { subdomain },
      {
        $set: { customConfig: updatedConfig },
      }
    );
  }
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
  updateConfigByKey(
    subdomain: string,
    key: string,
    value: any // eslint-disable-line  @typescript-eslint/no-explicit-any
  ): Promise<void>;
}

export default mongoose.model<ConfigDoc, ConfigModel>("Config", ConfigSchema);
