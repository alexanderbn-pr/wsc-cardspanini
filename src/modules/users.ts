import { UserInput} from "../domain/entities/User.js"
export interface RegisterInput {
    email: string;
    password: string;
}

export interface LoginInput {
    email: string;
    password: string;
}

export interface LoginResponse {
    user: UserInput;
    accessToken: string;
}