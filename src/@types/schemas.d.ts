export interface Conversation {
  identifier: string;
  users: Array<Types.ObjectId>;
  blocked: Array<Types.ObjectId>;
  blackList: Array<Types.ObjectId>;
  lockedInvite: boolean;
  admins: Array<Types.ObjectId>;
  creation_date: Date;
  name: string;
}

export interface User {
  username: string;
  personal_name: string;
  email: string;
  password: string;
  black_listed_users: Array<Types.ObjectId>;
  groups: Array<Types.ObjectId>;
  isEnabled: boolean;
  profile_picture: string;
  role: string;
}

export interface Message {
  sender: typeof Types.ObjectId;
  conversation: typeof Types.ObjectId;
  sent_date: Date;
  edited_date: Date | undefined;
  message: string;
  content: string;
  content_type: string;
  hidden: boolean;
}

export interface Request {
  requester: typeof Types.ObjectId;
  destinator: typeof Types.ObjectId;
  date: Date;
}
