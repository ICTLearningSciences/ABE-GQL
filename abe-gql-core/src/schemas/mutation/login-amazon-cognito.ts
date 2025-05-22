/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { GraphQLObjectType, GraphQLNonNull, GraphQLString } from "graphql";
import UserSchema, { LoginService } from "../models/User";
import {
  UserAccessTokenType,
  UserAccessToken,
  generateJwtToken,
  setTokenCookie,
  generateRefreshToken,
} from "../types/user-access-token";
import { CognitoJwtVerifier } from "aws-jwt-verify";

export interface CognitoUser {
  sub: string;
  email: string;
  name?: string;
  given_name?: string;
  family_name?: string;
}

export interface CognitoAuthFunc {
  (jwtToken: string): Promise<CognitoUser>;
}

let _cognitoAuthFuncOverride: CognitoAuthFunc;

export function overrideCognitoAuthFunc(f: CognitoAuthFunc): void {
  _cognitoAuthFuncOverride = f;
}

export function restoreCognitoAuthFunc(): void {
  _cognitoAuthFuncOverride = undefined;
}

export async function authCognito(jwtToken: string): Promise<CognitoUser> {
  if (_cognitoAuthFuncOverride) {
    return _cognitoAuthFuncOverride(jwtToken);
  }

  const userPoolId = process.env.COGNITO_USER_POOL_ID;
  const clientId = process.env.COGNITO_CLIENT_ID;

  if (!userPoolId || !clientId) {
    throw new Error("Missing required Cognito configuration");
  }

  try {
    const verifier = CognitoJwtVerifier.create({
      userPoolId,
      clientId,
      tokenUse: "id",
    });

    const payload = await verifier.verify(jwtToken);

    return {
      sub: String(payload.sub || ""),
      email: String(payload.email || ""),
      name: payload.name ? String(payload.name) : undefined,
      given_name: payload.given_name ? String(payload.given_name) : undefined,
      family_name: payload.family_name
        ? String(payload.family_name)
        : undefined,
    };
  } catch (error) {
    throw new Error(`Failed to verify Cognito JWT: ${error.message}`);
  }
}

export const loginAmazonCognito = {
  type: UserAccessTokenType,
  args: {
    idToken: { type: GraphQLNonNull(GraphQLString) },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: {
      idToken: string;
    },
    context: any // eslint-disable-line  @typescript-eslint/no-explicit-any
  ): Promise<UserAccessToken> => {
    try {
      const cognitoUser = await authCognito(args.idToken);

      const userId = cognitoUser.sub;

      const userName =
        cognitoUser.name ||
        (cognitoUser.given_name && cognitoUser.family_name
          ? `${cognitoUser.given_name} ${cognitoUser.family_name}`
          : cognitoUser.email);

      const user = await UserSchema.findOneAndUpdate(
        {
          googleId: userId, // Currently using googleId field as it's used for other providers too
        },
        {
          $set: {
            googleId: userId,
            name: userName,
            email: cognitoUser.email,
            lastLoginAt: new Date(),
            loginService: LoginService.AMAZON_COGNITO,
          },
        },
        {
          new: true,
          upsert: true,
        }
      );

      const jwtToken = await generateJwtToken(user);
      const refreshToken = await generateRefreshToken(user);
      setTokenCookie(context.res, refreshToken.token);
      return jwtToken;
    } catch (error) {
      throw new Error(error);
    }
  },
};

export default loginAmazonCognito;
