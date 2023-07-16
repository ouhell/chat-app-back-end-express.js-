import { Conversation, Message } from "../../types/schemas";
import { Paginated } from "./pagination";

export type MessagesPayload = {
  conversation: Conversation;
  messages: Paginated<Message>;
};
