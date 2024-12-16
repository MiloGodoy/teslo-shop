export const revalidate = 0;

// https://tailwindcomponents.com/component/hoverable-table
import { getPaginatedUsers } from '@/actions';
import { Pagination, Title } from '@/components';

import Link from 'next/link';
import { IoCardOutline } from 'react-icons/io5';
import { redirect } from 'next/navigation';
import UsersTable from './ui/UsersTable';

export default async function OrdersPage() {

  const { ok, users = [] } = await getPaginatedUsers()

  if ( !ok ) {
    redirect('/auth/login');
  }

  return (
    <>
      <Title title="Users admin" />

      <div className="mb-10">
       <UsersTable users={ users }/>

       <Pagination totalPages={1}/>
      </div>
    </>
  );
}