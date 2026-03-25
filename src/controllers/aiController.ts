import { AIMessage, BaseMessage, HumanMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";
import {
  ChatMessagePromptTemplate,
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { NextFunction, Request, Response } from "express";

export class AIController {
  private static readonly model = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    apiKey: process.env.GEMINI_API_KEY,
    maxRetries: 0,
  });

  private static readonly chatPrompt = ChatPromptTemplate.fromMessages([
    ["system", "You are a helpful assistant."],
    new MessagesPlaceholder("history"),
    ["human", "{input}"],
  ]);

  private static readonly chain = this.chatPrompt
    .pipe(this.model)
    .pipe(new StringOutputParser());

  private static readonly sessions = new Map<string, BaseMessage[]>();

  static generateRandomeGreeting = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
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
  };
}
