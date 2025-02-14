import { Action } from "@copilotkit/shared";

import { NextRequest } from "next/server";
import {
  CopilotRuntime,
  LangChainAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { ChatOpenAI } from "@langchain/openai";


const actions: Action<any>[] = [];

const model = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  temperature: 0,
  apiKey: process.env["OPENAI_API_KEY"],
});

export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime: new CopilotRuntime({
      actions: actions,
    }),
    serviceAdapter: new LangChainAdapter({
      chainFn: async ({ messages, tools }) => {
        return model.bindTools(tools, { strict: true }).stream(messages);
      },
    }),
    endpoint: req.nextUrl.pathname,
  });
  return handleRequest(req);
};
