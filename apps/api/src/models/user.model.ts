import { z } from 'zod';

export const UserModelSchema = z.object({
  id: z.string(),
  email: z
    .string({ required_error: "L'adresse email est requise" })
    .email("L'adresse email n'est pas valide"),
  password: z
    .string({ required_error: 'Le mot de passe est requis' })
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  name: z.string({ required_error: 'Le nom est requis' }),
});
