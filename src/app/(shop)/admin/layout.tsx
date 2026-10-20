import { getCurrentUser } from "@/lib/authorization";
import { redirect } from "next/navigation";

export default async function AdminLayout({
 children
}: {
 children: React.ReactNode;
}) {

    const user = await getCurrentUser()

    if ( user?.role !== 'admin') {
        redirect('/auth/login')
    }

  return (
    <>
      { children }
    </>
  );
}
