export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface AppUser {
  id?: string;
  name: string;
  email?: string;
  profilePic: string;
}
