import { Toaster } from '../components/ui/sonner';

const ResetPasswordLayout = ({ children }) => {
  return (
    <div className={`grid h-screen w-full place-content-center`}>
      <div align={'center'}>
        <div className={`grid gap-5`}>{children}</div>
      </div>
      <Toaster />
    </div>
  );
};

export default ResetPasswordLayout;
