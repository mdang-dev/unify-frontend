import { redirect } from 'next/navigation';
// import GroupsSidebar from './sidebar';

export default function GroupsPage() {
  redirect('/groups/feed');
  return null;
}
