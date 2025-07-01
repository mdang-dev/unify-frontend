import GroupsSidebar from './sidebar';

export default function GroupsLayout({ children }) {
  return (
    <div className="flex h-full">
      <GroupsSidebar />
      <div className="flex-1">{children}</div>
    </div>
  );
}
