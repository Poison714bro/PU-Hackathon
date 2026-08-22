import { User } from './store';
import { api } from './apiClient';

/**
 * Role mapping from backend roles to frontend roles.
 * Backend uses: ADMIN, INVESTIGATOR, ANALYST
 * Frontend uses: Admin, Agent, Analyst
 */
const ROLE_MAP: Record<string, User['role']> = {
  ADMIN: 'Admin',
  INVESTIGATOR: 'Agent',
  ANALYST: 'Analyst',
  SUPERVISOR: 'Agent',
};

/**
 * Clearance level mapping from backend roles.
 * Admin → 3 (full access), Agent/Investigator → 2, Analyst → 1
 */
const CLEARANCE_MAP: Record<string, User['clearanceLevel']> = {
  ADMIN: 3,
  INVESTIGATOR: 2,
  SUPERVISOR: 2,
  ANALYST: 1,
};

export async function authenticate(
  usernameOrEmail: string,
  passwordPlain: string
): Promise<{ success: boolean; user?: User; token?: string; error?: string }> {
  const result = await api.auth.login(usernameOrEmail, passwordPlain);

  if (!result.ok || !result.data) {
    return { success: false, error: result.error || 'Invalid credentials' };
  }

  const { token, user: backendUser } = result.data;

  // Map backend user shape to frontend User interface
  const frontendUser: User = {
    id: backendUser.id,
    username: backendUser.username,
    email: `${backendUser.username}@cyberintel.gov`,
    clearanceLevel: CLEARANCE_MAP[backendUser.role] || 1,
    role: ROLE_MAP[backendUser.role] || 'Analyst',
  };

  return { success: true, user: frontendUser, token };
}
