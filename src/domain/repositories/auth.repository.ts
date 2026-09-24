import { User, CreateUserInput, UserInput  } from "../entities/User.js";

export interface AuthRepository {
    register(user: CreateUserInput): Promise<User>;
    //Aqui es un findByEmail porque no queremos hacer logica ne gocio en el repositorio comparando passwords
    findByEmail(email: string): Promise<User | null>;
    findById(id: number): Promise<User | null>;
    delete(id: number): Promise<void>;
}
