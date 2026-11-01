export type User = {
	id: string;
	name: string;
	username: string;
	email?: string;
	createdAt?: string;
};

export type AuthResponse = {
	user: User;
};

export type RegisterInput = {
	name: string;
	email: string;
	username: string;
	password: string;
};

export type LoginInput = {
	identifier: string;
	password: string;
};
