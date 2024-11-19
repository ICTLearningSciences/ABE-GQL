/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { GraphQLObjectType, GraphQLString } from "graphql";
import UserSchema from "../models/User";
import {
  UserAccessTokenType,
  UserAccessToken,
  generateJwtToken,
  setTokenCookie,
  generateRefreshToken,
} from "../types/user-access-token";
import axios from "axios";

export interface MicrosoftGraphUser {
  id: string;
  displayName: string;
  mail: string;
}

export interface MicrosoftGraphUserFunc {
  (accessToken: string): Promise<MicrosoftGraphUser>;
}

let _microsoftGraphUserOverride: MicrosoftGraphUserFunc;

export function overrideMicrosoftGraphUser(f: MicrosoftGraphUserFunc): void {
  _microsoftGraphUserOverride = f;
}

export function restoreMicrosoftGraphUser(): void {
  _microsoftGraphUserOverride = undefined;
}

async function getUserInfo(accessToken: string): Promise<MicrosoftGraphUser> {
  if (_microsoftGraphUserOverride) {
    return _microsoftGraphUserOverride(accessToken);
  }
  try {
    const res = await axios.get("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    console.log(res.data);
    return {
      id: res.data.id,
      displayName: res.data.displayName,
      mail: res.data.mail,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to fetch Microsoft user info: ${error.message}`);
    }
    throw error;
  }
}

/**
 * TODO: temporary faux login until we figure out OAuth with Microsoft
 */
export const loginMicrosoft = {
  type: UserAccessTokenType,
  args: {
    accessToken: { type: GraphQLString },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: {
      accessToken: string;
    },
    context: any // eslint-disable-line  @typescript-eslint/no-explicit-any
  ): Promise<UserAccessToken> => {
    const { accessToken } = args;
    const { id, displayName, mail } = await getUserInfo(accessToken);
    const idTransform = `microsoft-${id}`;
    try {
      const user = await UserSchema.findOneAndUpdate(
        {
          googleId: idTransform,
        },
        {
          $set: {
            googleId: idTransform,
            name: displayName,
            email: mail,
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
