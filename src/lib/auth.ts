import { User } from './store';

// A mock hash function for demonstration
const mockHash = (str: string) => btoa(str);

export const MOCK_USERS: Array<User & { passwordHash: string }> = [
  {
    id: "user-agent-1",
    username: "agent_smith",
    email: "smith@cyberintel.gov",
    role: "Agent",
    clearanceLevel: 1,
    passwordHash: mockHash("password123"),
  },
  {
    id: "user-analyst-1",
    username: "analyst_doe",
    email: "doe@cyberintel.gov",
    role: "Analyst",
    clearanceLevel: 2,
    passwordHash: mockHash("password123"),
  },
  {
    id: "user-admin-1",
    username: "admin_root",
    email: "root@cyberintel.gov",
    role: "Admin",
    clearanceLevel: 3,
    passwordHash: mockHash("password123"),
  },
];

export async function authenticate(usernameOrEmail: string, passwordPlain: string): Promise<{ success: boolean; user?: User; error?: string }> {
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 1500));

  const userRecord = MOCK_USERS.find(
    (u) => u.username === usernameOrEmail || u.email === usernameOrEmail
  );

  if (!userRecord) {
    return { success: false, error: "Invalid credentials" };
  }

  if (userRecord.passwordHash !== mockHash(passwordPlain)) {
    return { success: false, error: "Invalid credentials" };
  }

  // Strip passwordHash before returning to client state
  const { passwordHash, ...safeUser } = userRecord;
  return { success: true, user: safeUser };
}
