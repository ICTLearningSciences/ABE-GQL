/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { GraphQLObjectType } from "graphql";
import UserSchema, { User, UserInputType } from "../models/User";
import {
  UserAccessTokenType,
  UserAccessToken,
  generateJwtToken,
  setTokenCookie,
  generateRefreshToken,
} from "../types/user-access-token";

/**
 * TODO: temporary faux login until we figure out OAuth with Microsoft
 */
export const loginMicrosoft = {
  type: UserAccessTokenType,
  args: {
    user: { type: UserInputType },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: {
      user: User;
    },
    context: any // eslint-disable-line  @typescript-eslint/no-explicit-any
  ): Promise<UserAccessToken> => {
    const { googleId, name, email } = args.user;
    const idTransform = `microsoft-${googleId}`;
    try {
      const user = await UserSchema.findOneAndUpdate(
        {
          googleId: idTransform,
        },
        {
          $set: {
            googleId: idTransform,
            name: name,
            email: email,
            lastLoginAt: new Date(),
          },
        },
        {
          new: true,
          upsert: true,
        }
      );
      // authentication successful so generate jwt and refresh tokens
      const jwtToken = await generateJwtToken(user);
      const refreshToken = await generateRefreshToken(user);
      setTokenCookie(context.res, refreshToken.token);
      return jwtToken;
    } catch (error) {
      throw new Error(error);
    }
  },
};

export default loginMicrosoft;
