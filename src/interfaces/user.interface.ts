export interface User {
    id: string;
    name: string;
    email: string;
    emailVerfied?: Date | null;
    role: string;
    image?: string | null;
}
