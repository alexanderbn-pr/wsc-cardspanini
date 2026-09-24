import {z} from 'zod'
import '../openapi/zod-extend.js';

export const CredentailsSchema = z.object({
    body: z.object({
        email: z.string().email({ message: "El correo electrónico no es válido" }),
        password: z.string()
          .min(8, { message: "La contraseña debe tener al menos 8 caracteres" })
          .max(100, { message: "La contraseña es demasiado larga" })
          .regex(/[A-Z]/, { message: "Debe contener al menos una letra mayúscula" })
          .regex(/[a-z]/, { message: "Debe contener al menos una letra minúscula" })
          .regex(/[0-9]/, { message: "Debe contener al menos un número" })
          .regex(/[^A-Za-z0-9]/, { message: "Debe contener al menos un carácter especial" }),
    }).openapi('CredentialsBody'),
}).openapi('Credentials');
