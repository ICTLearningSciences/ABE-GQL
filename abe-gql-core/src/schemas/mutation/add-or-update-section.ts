/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLEnumType,
  GraphQLID,
} from "graphql";
import { UserRole } from "../models/User";
import SectionModel, {
  Section,
  SectionType,
  SectionInputType,
} from "../models/Section";
import CourseModel from "../models/Course";
import InstructorDataModel from "../models/InstructorData";

const SectionActionType = new GraphQLEnumType({
  name: "SectionAction",
  values: {
    CREATE: { value: "CREATE" },
    MODIFY: { value: "MODIFY" },
    DELETE: { value: "DELETE" },
  },
});

export const addOrUpdateSection = {
  type: SectionType,
  args: {
    courseId: { type: GraphQLNonNull(GraphQLID) },
    sectionData: { type: SectionInputType },
    action: { type: GraphQLNonNull(SectionActionType) },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: {
      courseId: string;
      sectionData?: Section;
      action: "CREATE" | "MODIFY" | "DELETE";
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

    const course = await CourseModel.findById(args.courseId);
    if (!course) {
      throw new Error("course not found");
    }

    if (
      course.instructorId !== context.userId &&
      context.userRole !== UserRole.ADMIN
    ) {
      throw new Error(
        "unauthorized: only course instructor or admin can modify sections"
      );
    }

    if (
      (args.action === "CREATE" || args.action === "MODIFY") &&
      args.sectionData?.sectionCode
    ) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const query: any = {
        sectionCode: args.sectionData.sectionCode,
        deleted: false,
      };

      if (args.action === "MODIFY" && args.sectionData._id) {
        query._id = { $ne: args.sectionData._id };
      }

      const existingSection = await SectionModel.findOne(query);
      if (existingSection) {
        throw new Error("sectionCode must be unique");
      }
    }

    if (args.action === "CREATE") {
      const newSection = new SectionModel({
        title: args.sectionData?.title || "New Section",
        sectionCode: args.sectionData?.sectionCode || "",
        description: args.sectionData?.description || "",
        assignments: args.sectionData?.assignments || [],
        numOptionalAssignmentsRequired:
          args.sectionData?.numOptionalAssignmentsRequired || 0,
        instructorId: context.userId,
        deleted: false,
      });

      await newSection.save();

      course.sectionIds.push(newSection._id.toString());
      await course.save();

      return newSection;
    }

    if (!args.sectionData || !args.sectionData._id) {
      throw new Error(
        "section data with _id is required for MODIFY and DELETE actions"
      );
    }

    const section = await SectionModel.findById(args.sectionData._id);
    if (!section) {
      throw new Error("section not found");
    }

    if (args.action === "DELETE") {
      section.deleted = true;
      await section.save();

      const sectionIndex = course.sectionIds.indexOf(args.sectionData._id);
      if (sectionIndex !== -1) {
        course.sectionIds.splice(sectionIndex, 1);
        await course.save();
      }

      return section;
    }

    if (args.action === "MODIFY") {
      if (!args.sectionData) {
        throw new Error("sectionData is required for MODIFY action");
      }

      const updatedSection = await SectionModel.findByIdAndUpdate(
        args.sectionData._id,
        { $set: args.sectionData },
        { new: true }
      );

      if (!updatedSection) {
        throw new Error("failed to update section");
      }

      return updatedSection;
    }

    throw new Error("invalid action");
  },
};

export default addOrUpdateSection;
