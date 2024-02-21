import mongoose from "mongoose";
const { ObjectId } = mongoose.Types;

module.exports = {
  openaiasyncs: [
    {
      _id: ObjectId("5ffdf1231ee2c62320b49e4c"),
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
      _id: ObjectId("5ffdf1231ee2c62320b49e9f"),
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
      prompt: ObjectId("5ffdf1231ee2c62320b49e9e"),
      prompts: [
        {
          _id: ObjectId("5ffdf1231ee2c62320b49e8e"),
          promptId: ObjectId("5ffdf1231ee2c62320b49e9e"),
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
      userId: ObjectId("5ffdf1231ee2c62320b49e99"),
      activityId: ObjectId("5ffdf1231ee2c62320b49e9f"),
      googleDocId: "test_google_doc_id",
      metadata: "user_activity_state_metadata_test",
    },
  ],
  docgoals: [
    {
      activities: [ObjectId("5ffdf1231ee2c62320b49e9f")],
      activityOrder: [ObjectId("5ffdf1231ee2c62320b49e9f")],
      title: "docgoal_title_test",
      description: "docgoal_description_test",
      displayIcon: "docgoal_display_icon_test",
      introduction: "docgoal_introduction_test",
    },
  ],

  prompts: [
    {
      _id: ObjectId("5ffdf1231ee2c62320b49e9e"),
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
      _id: ObjectId("5ffdf1231ee2c62320b49e9c"),
      user: ObjectId("5ffdf1231ee2c62320b49e99"),
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
      _id: ObjectId("5ffdf1231ee2c62320b49e9d"),
      user: ObjectId("5ffdf1231ee2c62320b49e99"),
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
      _id: ObjectId("5ffdf1231ee2c62320b49ea0"),
      googleDocId: "test_google_doc_id",
      user: ObjectId("5ffdf1231ee2c62320b49e99"),
      createdAt: "2021-01-13T00:00:00.000+00:00",
    },
    {
      _id: ObjectId("5ffdf1231ee2c62320b49da7"),
      googleDocId: "test_admin_google_doc_id",
      title: "Test Admin Document",
      createdAt: "2021-01-13T00:00:00.000+00:00",
      admin: true,
    },
  ],
  refreshtokens: [
    {
      _id: ObjectId("5ffdf1231ee2c62320b49e9a"),
      user: ObjectId("5ffdf1231ee2c62320b49e99"),
      token: "fake_refresh_token",
      expires: "2100-10-12T20:49:41.599+00:00",
    },
    {
      _id: ObjectId("5ffdf1231ee2c62320b49e9b"),
      user: ObjectId("5ffdf1231ee2c62320b49e99"),
      token: "expired_refresh_token",
      expires: "2000-10-12T20:49:41.599+00:00",
    },
  ],
  googledocversions: [
    {
      _id: ObjectId("5ffdf1231ee2c62320b49ec1"),
      docId: "test_google_doc_id",
      plainText: "hello, world!",
      lastChangedId: "123",
      chatLog: [
        {
          sender: "John Doe",
          message: "Hello, world!",
        },
      ],
      title: "Test Document",
      lastModifyingUser: "John Doe",
      modifiedTime: "2000-10-12T20:49:41.599+00:00",
      updatedAt: "2021-01-13T00:00:00.000+00:00",
    },
    {
      _id: ObjectId("5ffdf1231ee2c62320b49ea1"),
      docId: "1fKb_rCcYeGxMiuJF0y0NYB3VWo1tSMIPrcNUCtXoQ2q",
      plainText: "hello, world!",
      lastChangedId: "123",
      chatLog: [
        {
          sender: "John Doe",
          message: "Hello, world!",
        },
      ],
      title: "Test Document",
      lastModifyingUser: "John Doe",
      modifiedTime: "2000-10-12T20:49:41.599+00:00",
    },
    {
      _id: ObjectId("5ffdf1231ee2c62320b49ea2"),
      docId: "1fKb_rCcYeGxMiuJF0y0NYB3VWo1tSMIPrcNUCtXoQ2q",
      plainText: "hello, world! 2",
      lastChangedId: "123",
      chatLog: [
        {
          sender: "John Doe",
          message: "Hello, world!",
        },
      ],
      title: "Test Document",
      lastModifyingUser: "John Doe",
      modifiedTime: "2000-10-12T20:49:41.599+00:00",
    },
    {
      _id: ObjectId("5ffdf1231ee2c62320b49ea3"),
      docId: "1fKb_rCcYeGxMiuJF0y0NYB3VWo1tSMIPrcNUCtXoQ2q",
      plainText: "hello, world! 3",
      lastChangedId: "123",
      chatLog: [
        {
          sender: "John Doe",
          message: "Hello, world!",
        },
      ],
      title: "Test Document",
      lastModifyingUser: "John Doe",
      modifiedTime: "2000-10-12T20:49:41.599+00:00",
    },
    {
      _id: ObjectId("5ffdf1231ee2c62320b49ea9"),
      docId: "1K-JFihjdDHmKqATZpsGuIjcCwp-OJHWcfAAzVZP0vFc",
      plainText: "hello, world! 4",
      lastChangedId: "123",
      chatLog: [
        {
          sender: "John Doe",
          message: "Hello, world!",
        },
      ],
      title: "Test Document",
      lastModifyingUser: "John Doe",
      modifiedTime: "2000-10-12T20:49:41.599+00:00",
    },
    {
      _id: ObjectId("5ffdf1231ee2c62320b49ea8"),
      docId: "1K-JFihjdDHmKqATZpsGuIjcCwp-OJHWcfAAzVZP0vFc",
      plainText: "hello, world! 5",
      lastChangedId: "123",
      chatLog: [
        {
          sender: "John Doe",
          message: "Hello, world!",
        },
      ],
      title: "Test Document",
      lastModifyingUser: "John Doe",
      modifiedTime: "2000-10-12T20:49:41.599+00:00",
    },
    {
      _id: ObjectId("5ffdf1231ee2c62320b49ea7"),
      docId: "1K-JFihjdDHmKqATZpsGuIjcCwp-OJHWcfAAzVZP0vFc",
      plainText: "hello, world! 6",
      lastChangedId: "123",
      chatLog: [
        {
          sender: "John Doe",
          message: "Hello, world!",
        },
      ],
      title: "Test Document",
      lastModifyingUser: "John Doe",
      modifiedTime: "2000-10-12T20:49:41.599+00:00",
    },
  ],
  users: [
    {
      _id: ObjectId("5ffdf1231ee2c62320b49e99"),
      googleId: "123",
      name: "John Doe",
      email: "johndoe@gmail.com",
      userRole: "USER",
      lastLoginAt: "2000-10-12T20:49:41.599+00:00",
    },
  ],
};