import { readSession, serverApi } from "./api/server";
import type { User } from "./types";

export async function getCurrentUser(): Promise<User | null> {
  const session = await readSession();
  if (!session) return null;
  return serverApi<User>(`/user/${session.userId}`);
}
