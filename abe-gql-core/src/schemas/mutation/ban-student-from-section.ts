/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { GraphQLObjectType, GraphQLID } from "graphql";
import { UserRole } from "../models/User";
import SectionModel from "../models/Section";
import InstructorDataModel from "../models/InstructorData";
import StudentDataModel from "../models/StudentData";
import { removeStudentFromSection } from "../../helpers";
import { GraphQLEnumType } from "graphql";
import { Section, SectionType } from "../models/Section";

const BanStudentFromSectionActionType = new GraphQLEnumType({
  name: "BanStudentFromSectionAction",
  values: {
    BAN: { value: "BAN" },
    UNBAN: { value: "UNBAN" },
  },
});

export const modifyStudentBanInSection = {
  type: SectionType,
  args: {
    sectionId: { type: GraphQLID },
    studentId: { type: GraphQLID },
    action: { type: BanStudentFromSectionActionType },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: {
      sectionId: string;
      studentId: string;
      action: "BAN" | "UNBAN";
    },
    context: {
      userId: string;
      userRole: UserRole;
    }
  ): Promise<Section> => {
    if (!context.userId) {
      throw new Error("authenticated user required");
    }

    const instructorData = await InstructorDataModel.findOne({
      userId: context.userId,
    });
    if (!instructorData && context.userRole !== UserRole.ADMIN) {
      throw new Error("instructors/admins only");
    }

    const student = await StudentDataModel.findOne({
      userId: args.studentId,
    });
    if (!student) {
      throw new Error("student not found");
    }

    const section = await SectionModel.findById(args.sectionId);
    if (!section) {
      throw new Error("section not found");
    }

    if (args.action === "BAN") {
      section.bannedStudentUserIds.push(args.studentId);
      await section.save();
      await removeStudentFromSection(args.studentId, args.sectionId);
      return section;
    } else {
      section.bannedStudentUserIds = section.bannedStudentUserIds.filter(
        (id) => id !== args.studentId
      );
      await section.save();
      return section;
    }
  },
};

export default modifyStudentBanInSection;
