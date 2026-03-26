import { AIMessage, BaseMessage, HumanMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";
import {
  ChatMessagePromptTemplate,
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { NextFunction, Request, Response } from "express";
import { ENV } from "../config/env";
import { BaseController } from "./base.controller";

export class AIController extends BaseController {
  private readonly model = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    apiKey: ENV.GEMINI_API_KEY,
    maxRetries: 0,
  });

  private readonly chatPrompt = ChatPromptTemplate.fromMessages([
    ["system", "You are a helpful assistant."],
    new MessagesPlaceholder("history"),
    ["human", "{input}"],
  ]);

  private readonly chain = this.chatPrompt
    .pipe(this.model)
    .pipe(new StringOutputParser());

  private readonly sessions = new Map<string, BaseMessage[]>();

  generateRandomeGreeting = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    this.handleRequest(req, res, next, async () => {
      let { sessionId, input } = req.body;

      if (!input || typeof input !== "string") {
        return next(new Error("input is required"));
      }

      if (!sessionId) {
        sessionId = crypto.randomUUID();
      }

      console.log("AI request", { sessionId, input });

      if (!this.sessions.has(sessionId)) {
        this.sessions.set(sessionId, []);
      }

      const history = this.sessions.get(sessionId)!;
      const result = await this.chain.invoke({ input, history });

      history.push(new HumanMessage(input));
      history.push(new AIMessage(result));

      console.log("got resp", result);

      res.json({ content: result, sessionId });
    });
  };
}
