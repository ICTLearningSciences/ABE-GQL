/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { Request, Response } from "express";
import {
  PutObjectCommand,
  ListObjectsCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from ".";

export const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION || "test",
  credentials: {
    accessKeyId: process.env.AWS_ACCESSKEY || "test",
    secretAccessKey: process.env.AWS_SECRETACCESSKEY || "test",
  },
});

export async function getRagFiles(req: Request, res: Response): Promise<void> {
  auth(req, true, (user, err) => {
    if (!user) res.status(500).json({ error: err });
    const command = new ListObjectsCommand({
      Bucket: process.env.RAG_BUCKET,
    });
    getSignedUrl(s3Client, command, { expiresIn: 3600 }).then((url) => {
      res.send(url);
    });
  });
}

export async function uploadRagFile(
  req: Request,
  res: Response
): Promise<void> {
  auth(req, true, (user, err) => {
    if (!user) res.status(500).json({ error: err });
    const command = new PutObjectCommand({
      Bucket: process.env.RAG_BUCKET,
      ContentType: req.body.contentType,
      Key: req.body.key,
      ACL: "public-read",
    });
    getSignedUrl(s3Client, command, { expiresIn: 3600 }).then((url) => {
      res.send(url);
    });
  });
}
