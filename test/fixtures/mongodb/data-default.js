/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import mongoose from "mongoose";
import {
  TimelinePointType,
  Sender,
} from "../../../src/schemas/models/DocTimeline";
const { ObjectId } = mongoose.Types;

module.exports = {
  openaiasyncs: [
    {
      _id: new ObjectId("5ffdf1231ee2c62320b49e4c"),
      openAiData: [
        {
          openAiPromptStringify: "open_ai_prompt_stringify",
          openAiResponseStringify: "open_ai_response_stringify",
        },
      ],
      answer: "Open Ai Async Answer Test",
      status: "QUEUED",
    },
  ],

  activities: [
    {
      _id: new ObjectId("5ffdf1231ee2c62320b49e9f"),
      title: "activity_title_test",
      steps: [
        {
          stepType: "MESSAGE",
          text: "activity_message_test",
        },
        {
          stepType: "MULTIPLE_CHOICE_QUESTIONS",
          text: "activity_multiple_choice_questions_test",
          mcqChoices: ["mcq_choice_1", "mcq_choice_2", "mcq_choice_3"],
        },
      ],
      description: "activity_description_test",
      introduction: "activity_introduction_test",
      prompt: new ObjectId("5ffdf1231ee2c62320b49e9e"),
      prompts: [
        {
          _id: new ObjectId("5ffdf1231ee2c62320b49e8e"),
          promptId: new ObjectId("5ffdf1231ee2c62320b49e9e"),
          order: 0,
        },
      ],
      disabled: false,
      displayIcon: "activity_display_icon_test",
      responsePendingMessage: "activity_response_pending_message_test",
      responseReadyMessage: "activity_response_ready_message_test",
    },
  ],
  useractivitystates: [
    {
      userId: new ObjectId("5ffdf1231ee2c62320b49e99"),
      activityId: new ObjectId("5ffdf1231ee2c62320b49e9f"),
      googleDocId: "test_google_doc_id",
      metadata: "user_activity_state_metadata_test",
    },
  ],
  docgoals: [
    {
      activities: [new ObjectId("5ffdf1231ee2c62320b49e9f")],
      activityOrder: [new ObjectId("5ffdf1231ee2c62320b49e9f")],
      title: "docgoal_title_test",
      description: "docgoal_description_test",
      displayIcon: "docgoal_display_icon_test",
      introduction: "docgoal_introduction_test",
    },
  ],

  prompts: [
    {
      _id: new ObjectId("5ffdf1231ee2c62320b49e9e"),
      openAiPromptSteps: [
        {
          prompts: [
            {
              promptText: "prompt_text",
              includeEssay: false,
              includeUserInput: true,
              promptRole: "user",
            },
          ],
          outputDataType: "TEXT",
          includeChatLogContext: false,
        },
        {
          prompts: [
            {
              promptText: "prompt_text_2",
              includeEssay: true,
              includeUserInput: true,
              promptRole: "user",
            },
          ],
          outputDataType: "JSON",
          jsonValidation: "json_validation_test",
          includeChatLogContext: true,
        },
      ],
      title: "prompt_title_test",
    },
  ],
  promptruns: [
    {
      _id: new ObjectId("5ffdf1231ee2c62320b49e9c"),
      user: new ObjectId("5ffdf1231ee2c62320b49e99"),
      googleDocId: "test_google_doc_id",
      openAiSteps: [
        {
          openAiPromptStringify: "open_ai_prompt_stringify",
          openAiResponseStringify: "open_ai_response_stringify",
        },
      ],
      openAiPromptSteps: [
        {
          prompts: [
            {
              promptText: "prompt_text_test",
              includeEssay: true,
              includeUserInput: true,
              promptRole: "user",
            },
          ],
          outputDataType: "TEXT",
        },
        {
          prompts: [
            {
              promptText: "prompt_text_test_2",
              includeEssay: true,
              includeUserInput: true,
              promptRole: "user",
            },
          ],
          outputDataType: "TEXT",
        },
      ],
    },
    {
      _id: new ObjectId("5ffdf1231ee2c62320b49e9d"),
      user: new ObjectId("5ffdf1231ee2c62320b49e99"),
      googleDocId: "test_google_doc_id_2",
      openAiSteps: [
        {
          openAiPromptStringify: "open_ai_prompt_stringify",
          openAiResponseStringify: "open_ai_response_stringify",
        },
      ],
      openAiPromptSteps: [
        {
          prompts: [
            {
              promptText: "prompt_text_test",
              includeEssay: true,
              includeUserInput: true,
              promptRole: "user",
            },
          ],
          outputDataType: "TEXT",
        },
        {
          prompts: [
            {
              promptText: "prompt_text_test_2",
              includeEssay: true,
              includeUserInput: true,
              promptRole: "user",
            },
          ],
          outputDataType: "TEXT",
        },
      ],
    },
  ],
  googledocs: [
    {
      _id: new ObjectId("5ffdf1231ee2c62320b49ea0"),
      googleDocId: "test_google_doc_id",
      user: new ObjectId("5ffdf1231ee2c62320b49e99"),
      documentIntention: {
        description: "test-intention",
        createdAt: "2000-10-12T20:49:41.599+00:00",
      },
      currentDayIntention: {
        description: "test-day-intention",
        createdAt: "2000-10-12T20:49:41.599+00:00",
      },
      assignmentDescription: "test-assignment-description",
      createdAt: "2021-01-13T00:00:00.000+00:00",
    },
    {
      _id: new ObjectId("5ffdf1231ee2c62320b49da7"),
      googleDocId: "test_admin_google_doc_id",
      user: new ObjectId("5ffdf1231ee2c62320b49e99"),
      title: "Test Admin Document",
      createdAt: "2021-01-13T00:00:00.000+00:00",
      admin: true,
    },
  ],
  refreshtokens: [
    {
      _id: new ObjectId("5ffdf1231ee2c62320b49e9a"),
      user: new ObjectId("5ffdf1231ee2c62320b49e99"),
      token: "fake_refresh_token",
      expires: "2100-10-12T20:49:41.599+00:00",
    },
    {
      _id: new ObjectId("5ffdf1231ee2c62320b49e9b"),
      user: new ObjectId("5ffdf1231ee2c62320b49e99"),
      token: "expired_refresh_token",
      expires: "2000-10-12T20:49:41.599+00:00",
    },
  ],
  googledocversions: [
    {
      _id: new ObjectId("5ffdf1231ee2c62320b49ec1"),
      docId: "test_google_doc_id",
      plainText: "hello, world!",
      lastChangedId: "123",
      sessionId: "session-id",
      chatLog: [
        {
          sender: "John Doe",
          message: "Hello, world!",
        },
      ],
      title: "Test Document",
      activity: "5ffdf1231ee2c62320b49e9f",
      intent: "intention",
      lastModifyingUser: "John Doe",
      modifiedTime: new Date("2000-10-12T20:49:41.599+00:00"),
      updatedAt: "2021-01-13T00:00:00.000+00:00",
      createdAt: new Date("2000-10-12T20:49:41.599+00:00"),
    },
    {
      _id: new ObjectId("5ffdf1231ee2c62320b49ea1"),
      docId: "1fKb_rCcYeGxMiuJF0y0NYB3VWo1tSMIPrcNUCtXoQ2q",
      plainText: "hello, world!",
      lastChangedId: "123",
      sessionId: "session-id-1",
      chatLog: [
        {
          sender: "John Doe",
          message: "Hello, world!",
        },
      ],
      activity: "5ffdf1231ee2c62320b49e9f",
      intent: "intention",
      title: "Test Document",
      lastModifyingUser: "John Doe",
      modifiedTime: new Date("2000-10-12T20:49:41.599+00:00"),
      createdAt: new Date("2001-10-12T20:49:41.599+00:00"),
    },
    {
      _id: new ObjectId("5ffdf1231ee2c62320b49ea2"),
      docId: "1fKb_rCcYeGxMiuJF0y0NYB3VWo1tSMIPrcNUCtXoQ2q",
      plainText: "hello, world! 2",
      lastChangedId: "123",
      sessionId: "session-id-2",
      chatLog: [
        {
          sender: "John Doe",
          message: "Hello, world!",
        },
      ],
      activity: "5ffdf1231ee2c62320b49e9f",
      intent: "intention",
      title: "Test Document",
      lastModifyingUser: "John Doe",
      modifiedTime: new Date("2000-10-12T20:49:41.599+00:00"),
      createdAt: new Date("2002-10-12T20:49:41.599+00:00"),
    },
    {
      _id: new ObjectId("5ffdf1231ee2c62320b49ea3"),
      docId: "1fKb_rCcYeGxMiuJF0y0NYB3VWo1tSMIPrcNUCtXoQ2q",
      plainText: "hello, world! 3",
      lastChangedId: "123",
      sessionId: "session-id-3",
      sessionIntention: {
        description: "test-intention",
        createdAt: new Date("2000-10-12T20:49:41.599+00:00"),
      },
      dayIntention: {
        description: "test-day-intention",
        createdAt: new Date("2000-10-12T20:49:41.599+00:00"),
      },
      documentIntention: {
        description: "test-document-intention",
        createdAt: new Date("2000-10-12T20:49:41.599+00:00"),
      },
      chatLog: [
        {
          sender: "John Doe",
          message: "Hello, world!",
        },
      ],
      activity: "5ffdf1231ee2c62320b49e9f",
      intent: "intention",
      title: "Test Document",
      lastModifyingUser: "John Doe",
      modifiedTime: new Date("2000-10-12T20:49:41.599+00:00"),
      createdAt: new Date("2003-10-12T20:49:41.599+00:00"),
    },
    {
      _id: new ObjectId("5ffdf1231ee2c62320b49ea9"),
      docId: "1K-JFihjdDHmKqATZpsGuIjcCwp-OJHWcfAAzVZP0vFc",
      plainText: "hello, world! 4",
      lastChangedId: "123",
      sessionId: "session-id-4",
      chatLog: [
        {
          sender: "John Doe",
          message: "Hello, world!",
        },
      ],
      activity: "5ffdf1231ee2c62320b49e9f",
      intent: "intention",
      title: "Test Document",
      lastModifyingUser: "John Doe",
      modifiedTime: new Date("2000-10-12T20:49:41.599+00:00"),
      createdAt: new Date("2000-10-12T20:49:41.599+00:00"),
    },
    {
      _id: new ObjectId("5ffdf1231ee2c62320b49ea8"),
      docId: "1K-JFihjdDHmKqATZpsGuIjcCwp-OJHWcfAAzVZP0vFc",
      plainText: "hello, world! 5",
      lastChangedId: "123",
      sessionId: "session-id-5",
      chatLog: [
        {
          sender: "John Doe",
          message: "Hello, world!",
        },
      ],
      activity: "5ffdf1231ee2c62320b49e9f",
      intent: "intention",
      title: "Test Document",
      lastModifyingUser: "John Doe",
      modifiedTime: new Date("2000-10-12T20:49:41.599+00:00"),
      createdAt: new Date("2000-10-12T20:49:41.599+00:00"),
    },
    {
      _id: new ObjectId("5ffdf1231ee2c62320b49ea7"),
      docId: "1K-JFihjdDHmKqATZpsGuIjcCwp-OJHWcfAAzVZP0vFc",
      plainText: "hello, world! 6",
      lastChangedId: "123",
      sessionId: "session-id-6",
      chatLog: [
        {
          sender: "John Doe",
          message: "Hello, world!",
        },
      ],
      activity: "5ffdf1231ee2c62320b49e9f",
      intent: "intention",
      title: "Test Document",
      lastModifyingUser: "John Doe",
      modifiedTime: new Date("2000-10-12T20:49:41.599+00:00"),
      createdAt: new Date("2000-10-12T20:49:41.599+00:00"),
    },
  ],
  users: [
    {
      _id: new ObjectId("5ffdf1231ee2c62320b49e99"),
      googleId: "123",
      name: "John Doe",
      email: "johndoe@gmail.com",
      userRole: "USER",
      lastLoginAt: "2000-10-12T20:49:41.599+00:00",
    },
  ],
  doctimelines: [
    {
      _id: new ObjectId("5ffdf1231ee2c62320b49e39"),
      docId: "doc_id",
      user: "5ffdf1231ee2c62320b49e99",
      timelinePoints: [
        {
          versionTime: "2021-01-12T00:00:00.000Z",
          type: TimelinePointType.START,
          version: {
            docId: "doc_od",
            plainText: "test",
            lastChangedId: "test",
            chatLog: [
              {
                sender: "USER",
                message: "test",
              },
            ],
            activity: "test",
            intent: "test",
            title: "test",
            lastModifyingUser: "test",
            createdAt: new Date("2021-01-12T00:00:00.000Z"),
            modifiedTime: new Date("2021-01-12T00:00:00.000Z"),
            updatedAt: new Date("2021-01-12T00:00:00.000Z"),
          },
          intent: "test",
          changeSummary: "test",
          reverseOutline: "test",
          relatedFeedback: "test",
        },
      ],
    },
    {
      _id: new ObjectId("5ffdf1231ee2c62320b49e29"),
      docId: "doc_id_2",
      user: "5ffdf1231ee2c62320b49e99",
      timelinePoints: [
        {
          versionTime: "2021-01-12T00:00:00.000Z",
          type: TimelinePointType.NEW_ACTIVITY,
          version: {
            docId: "doc_od",
            plainText: "test_2",
            lastChangedId: "test_2",
            chatLog: [
              {
                sender: "USER",
                message: "test",
              },
            ],
            activity: "test_2",
            intent: "test_2",
            title: "test_2",
            lastModifyingUser: "test_2",
            createdAt: new Date("2021-01-12T00:00:00.000Z"),
            modifiedTime: new Date("2021-01-12T00:00:00.000Z"),
            updatedAt: new Date("2021-01-12T00:00:00.000Z"),
          },
          intent: "test_2",
          changeSummary: "test_2",
          reverseOutline: "test_2",
          relatedFeedback: "test_2",
        },
      ],
    },
  ],
};
