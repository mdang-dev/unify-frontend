import Image from 'next/image';
import avatar from '@/public/images/test1.png';

const User = ({ user }) => {
  return (
    <div className="my-auto mb-4 flex w-full">
      <Image src={avatar} alt="Avatar" className="h-14 w-14 rounded-full" />
      <div className="ml-5">
        <p className="my-auto text-lg font-bold">{user?.username}</p>
        <p className="my-auto">{user?.firstName + ' ' + user?.lastName}</p>
      </div>
    </div>
  );
};

export default User;
