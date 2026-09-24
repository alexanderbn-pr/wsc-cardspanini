export interface User {
    id: number;
    email: string;
    passwordHash: string;
    role: string;
}

export type CreateUserInput = Omit<User, "id">;
export type UserInput = Omit<User, "passwordHash">;

