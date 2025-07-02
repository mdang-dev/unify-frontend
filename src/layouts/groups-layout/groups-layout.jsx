import Sidebar from './_components/sidebar';

export default function GroupsLayout({ children }) {
  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex-1">{children}</div>
    </div>
  );
}
