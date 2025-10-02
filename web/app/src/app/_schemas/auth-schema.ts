import { z } from "zod";

export const signUpSchema = z.object({
  cidade: z.string().min(1,{message:"Cidade Invalida"}).max(100),
  rua: z.string().min(1,{message:"Rua Invalida"}).max(100),
  estado: z.string().min(1,{message:"Estado Invalido"}).max(100),
  numero: z.string().min(1,{message:"Número Invalido"}).max(100),
  cep: z.string().min(1,{message:"CEP Invalido"}).max(100)
});


export type SignUpSchema = z.infer<typeof signUpSchema>;