
import { Title } from '@/components';
import { AddressForm } from './ui/AddressForm';
import { getCountries } from '@/actions';
import { auth } from '@/auth.config';
import { getUserAddress } from '@/actions/address/get-user-address';
import { redirect } from 'next/navigation';

// A private checkout page must not query the database during prerendering.
export const dynamic = 'force-dynamic';


export default async function AddressPage() {
  const session = await auth();
  
  if( !session?.user ){
    redirect('/auth/login?redirectTo=/checkout/address');
  }

  const countries = await getCountries();

  const userAddress = await getUserAddress(session.user.id) ?? undefined;
  
  return (
  
    <div className="flex flex-col sm:justify-center sm:items-center mb-72 px-10 sm:px-0">

      <div className="w-full  xl:w-[1000px] flex flex-col justify-center text-left">
        
        <Title title="Dirección" subtitle="Dirección de entrega" />

       <AddressForm countries={ countries } userStoredAddress={ userAddress } />

      </div>

    </div>

  );
}
