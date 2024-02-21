/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import mongoose, { Document, Model, Schema } from "mongoose";
import { GraphQLList, GraphQLString, GraphQLObjectType } from "graphql";

export interface ConfigEntry {
  key: string;
  value: any; // eslint-disable-line  @typescript-eslint/no-explicit-any
}

export interface Config {
  openaiSystemPrompt: string[];
}

type ConfigKey = keyof Config;
export const ConfigKeys: ConfigKey[] = ["openaiSystemPrompt"];

export function getDefaultConfig(): Config {
  return {
    openaiSystemPrompt: [],
  };
}

export const ConfigType = new GraphQLObjectType({
  name: "Config",
  fields: () => ({
    openaiSystemPrompt: { type: GraphQLList(GraphQLString) },
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

ConfigSchema.statics.getConfig = async function (args: {
  defaults?: Partial<Config>;
}) {
  return (await this.find({ key: { $in: ConfigKeys } })).reduce(
    (acc: Config, cur: ConfigEntry) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (acc as any)[cur.key] = cur.value;
      return acc;
    },
    args?.defaults || getDefaultConfig()
  );
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
  getConfig(args?: { defaults?: Partial<Config> }): Promise<Config>;
  saveConfig(config: Partial<Config>): Promise<void>;
}

export default mongoose.model<ConfigDoc, ConfigModel>("Config", ConfigSchema);
