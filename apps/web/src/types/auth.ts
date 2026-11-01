export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
}

export interface LoginPayload {
  identifier: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  username: string;
  email: string;
  password: string;
}

export interface AuthContextValue {
  user: User | null;
  isHydrating: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => Promise<void>;
}

export interface RegisterInput {
  name: string;
  email: string;
  username: string;
  password: string;
}

export interface LoginInput {
  identifier: string;
  password: string;
}
