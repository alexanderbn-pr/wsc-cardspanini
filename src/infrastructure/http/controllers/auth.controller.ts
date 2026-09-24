import { Request, Response } from 'express';
import { AuthService } from "../../../services/auth.service.js";
import { LoginInput, RegisterInput } from "../../../modules/users.js"

export class AuthController {
    constructor(
        private readonly authService: AuthService
    ) {}

    login = async (req: Request, res: Response) => {
        const { email , password} = req.body
        const credentials: LoginInput = {
            email: email,
            password: password
        }
        const token = await this.authService.login(credentials);
        res.json(token);
    }

    delete = async (req: Request, res: Response) => {
        const { id } = req.params;
        await this.authService.delete(Number(id));
        res.json( {deleted: true} )
    }

    register = async (req: Request, res: Response) => {
        const { email , password} = req.body
        const credentials: RegisterInput = {
            email: email,
            password: password
        }
        const user = await this.authService.register(credentials);
        res.json(user);
    }

}
