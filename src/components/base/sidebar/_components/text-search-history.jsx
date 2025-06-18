import { UserSearch, X } from 'lucide-react';

const TextSearchHistory = ({ text }) => {
  return (
    <div className={`flex h-12 w-full items-center gap-3`}>
      <UserSearch size={40} />
      <div className={`grid`}>
        <span className={`text-md`}>{text}</span>
      </div>
      <div className={`ml-auto cursor-pointer`}>
        <X />
      </div>
    </div>
  );
};

export default TextSearchHistory;
