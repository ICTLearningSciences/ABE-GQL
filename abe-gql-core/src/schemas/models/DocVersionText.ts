/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import mongoose, { Document, Schema } from "mongoose";
import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLID,
  GraphQLInputObjectType,
} from "graphql";

export interface DocVersionText extends Document {
  _id: string;
  versionId: string;
  docId: string;
  plainText: string;
}

export const DocVersionTextInputType = new GraphQLInputObjectType({
  name: "DocVersionTextInputType",
  fields: () => ({
    versionId: { type: GraphQLString },
    docId: { type: GraphQLString },
    plainText: { type: GraphQLString },
  }),
});

export const DocVersionTextType = new GraphQLObjectType({
  name: "DocVersionTextType",
  fields: () => ({
    _id: { type: GraphQLID },
    versionId: { type: GraphQLString },
    docId: { type: GraphQLString },
    plainText: { type: GraphQLString },
  }),
});

export const DocVersionTextSchema = new Schema(
  {
    versionId: { type: String, required: true },
    docId: { type: String, required: true },
    plainText: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<DocVersionText>(
  "DocVersionText",
  DocVersionTextSchema
);
