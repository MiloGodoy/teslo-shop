export interface User {
    id: string;
    name: string;
    email: string;
    emailVerfied?: Date | null;
    password: string;
    role: string;
    image?: string | null;
}