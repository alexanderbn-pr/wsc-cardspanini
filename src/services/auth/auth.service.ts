import { User } from "../../domain/entities/User.js";
import { AuthRepository } from "../../domain/repositories/auth.repository.js";
import { getEnv } from "../../config/env.js";
import { jwtVerify, SignJWT } from "jose";
import { RegisterInput, LoginInput, LoginResponse, AuthenticatedUser } from "../../modules/users.js"
import { AUTH_TOKEN_ERROR_MESSAGE } from "../../costants/auth.constants.js";
import { AppError } from "../../infrastructure/http/middlewares/errorHandler/errorHandler.js";
import { logger } from "../../infrastructure/logger/logger.js";
import argon2 from "argon2"

export class AuthService {

    constructor(
        private readonly authRepository: AuthRepository,
    ) {}

    async register(input: RegisterInput): Promise<User> {
        const existingUser = await this.authRepository.findByEmail(input.email)
        if (existingUser) {
            throw new Error("User already exists");
        }
        const passwordHash = await argon2.hash(input.password)
        return this.authRepository.register({
            email: input.email,
            passwordHash: passwordHash,
            role: "Admin"
        })
    }

    async delete(id: number): Promise<void> {
        const user = await this.authRepository.findById(id)
        if(!user){
            throw new AppError(404, "User not exist")
        }
        await this.authRepository.delete(id);
    }

    async login(input: LoginInput): Promise<LoginResponse> {
        const user = await this.authRepository.findByEmail(input.email)
        if(!user){
            throw new Error("Invalid credentials")
        }
        
        const passwordValid = await argon2.verify(
            user.passwordHash,
            input.password
        );

        if (!passwordValid) {
            throw new Error("Invalid credentials");
        }
        const { JWT_SECRET } = getEnv();
        const secret = new TextEncoder().encode(JWT_SECRET);

        const accessToken = await new SignJWT({
            role: user.role,
        })
            .setProtectedHeader({
                alg: "HS256",
            })
            .setSubject(user.id.toString())
            .setIssuedAt()
            .setExpirationTime("1h")
            .sign(secret);

        const { passwordHash, ...userWithoutPassword } = user;
        return {
            user: userWithoutPassword,
            accessToken,
        };
    }

    // Verifica un access token emitido por login() y devuelve la identidad que este transporta. 
    async verifyAccessToken(token: string): Promise<AuthenticatedUser> {
        const { JWT_SECRET } = getEnv();
        const secret = new TextEncoder().encode(JWT_SECRET);

        let payload;
        try {
            ({ payload } = await jwtVerify(token, secret, {
                algorithms: ["HS256"],
                requiredClaims: ["sub"],
            }));
        } catch (err) {
            logger.debug({ err }, "Access token verification failed");
            throw new AppError(401, AUTH_TOKEN_ERROR_MESSAGE);
        }
        const id = Number(payload.sub);
        if (!Number.isSafeInteger(id) || id <= 0) {
            throw new AppError(401, AUTH_TOKEN_ERROR_MESSAGE);
        }
        const role = typeof payload.role === "string" ? payload.role : "";

        return { id, role };
    }
}
