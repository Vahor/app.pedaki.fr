import { redirect } from 'next/navigation';


export default function NotFound() {
  redirect('/fr')
  return null;
}