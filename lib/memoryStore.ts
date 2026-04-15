import { ChatMessage } from '@/lib/types';

export type MemoryUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  profilePic: string;
};

type MemoryStore = {
  users: MemoryUser[];
  conversations: Record<string, ChatMessage[]>;
};

declare global {
  var appMemoryStore: MemoryStore | undefined;
}

const store: MemoryStore = global.appMemoryStore ?? { users: [], conversations: {} };
global.appMemoryStore = store;

export function findUserByEmail(email: string): MemoryUser | undefined {
  return store.users.find((user) => user.email.toLowerCase() === email.toLowerCase());
}

export function findUserById(id: string): MemoryUser | undefined {
  return store.users.find((user) => user.id === id);
}

export function createUser(input: Omit<MemoryUser, 'id'>): MemoryUser {
  const user: MemoryUser = { id: crypto.randomUUID(), ...input };
  store.users.push(user);
  return user;
}

export function updateUser(id: string, updates: Partial<Pick<MemoryUser, 'name' | 'profilePic'>>): MemoryUser | undefined {
  const user = findUserById(id);
  if (!user) return undefined;
  if (typeof updates.name === 'string' && updates.name.trim()) user.name = updates.name.trim();
  if (typeof updates.profilePic === 'string') user.profilePic = updates.profilePic;
  return user;
}

export function getMessages(userId: string): ChatMessage[] {
  return store.conversations[userId] ?? [];
}

export function appendMessages(userId: string, newMessages: ChatMessage[]): ChatMessage[] {
  const current = store.conversations[userId] ?? [];
  const updated = [...current, ...newMessages];
  store.conversations[userId] = updated;
  return updated;
}

export function clearMessages(userId: string): void {
  store.conversations[userId] = [];
}
