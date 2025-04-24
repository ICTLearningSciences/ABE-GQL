/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { GraphQLScalarType, Kind } from "graphql";

export const ObjectType = new GraphQLScalarType({
  name: "Object",
  description: "Represents an arbitrary object",
  parseValue: toObject,
  serialize: toObject,
  parseLiteral(ast) {
    switch (ast.kind) {
      case Kind.STRING:
        return ast.value.charAt(0) === "{" ? JSON.parse(ast.value) : null;
      case Kind.OBJECT:
        return parseObject(ast);
    }
    return null;
  },
});

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
function toObject(value: any) {
  if (typeof value === "object") {
    return value;
  }
  if (typeof value === "string" && value.charAt(0) === "{") {
    return JSON.parse(value);
  }
  return null;
}

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
function parseObject(ast: any) {
  const value = Object.create(null);
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  ast.fields.forEach((field: any) => {
    value[field.name.value] = parseAst(field.value);
  });
  return value;
}

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
function parseAst(ast: any) {
  switch (ast.kind) {
    case Kind.STRING:
    case Kind.BOOLEAN:
      return ast.value;
    case Kind.INT:
    case Kind.FLOAT:
      return parseFloat(ast.value);
    case Kind.OBJECT:
      return parseObject(ast);
    case Kind.LIST:
      return ast.values.map(parseAst);
    default:
      return null;
  }
}
