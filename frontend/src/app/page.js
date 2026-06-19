import { redirect } from 'next/navigation';

export default function Home() {
  // In a real app, this would check if the user is logged in
  // and redirect them to their respective dashboard.
  redirect('/login');
}
