'use server';

import { z } from 'zod';
import prisma from '@/lib/prisma';
import bcryptjs from 'bcryptjs';

export const registerUser = async( name: string, email: string, password: string ) => {

    const parsed = z.object({ name: z.string().trim().min(2).max(100),
      email: z.string().trim().email().max(254), password: z.string().min(8).max(72) }).safeParse({name, email, password});
    if (!parsed.success) return { ok: false, message: 'Usa un nombre válido, correo y contraseña de 8 a 72 caracteres.' };
    name = parsed.data.name; email = parsed.data.email; password = parsed.data.password;
    try {
        const user = await prisma.user.create({
            data: {
                name: name,
                email: email.toLowerCase(),
                password: await bcryptjs.hash(password, 12),
            },
            select: {
                id: true,
                name: true,
                email: true,
            }
        })

        return {
            ok: true,
            user: user,
            message: 'Usuario creado'
        }

    } catch (error) {


        return {
            ok: false,
            message: 'No se puedo crear el usuario'
        }
    }

}
