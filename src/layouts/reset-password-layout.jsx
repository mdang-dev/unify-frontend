const ResetPasswordLayout = ({ children }) => {
  return (
    <div className={`grid h-screen w-full place-content-center`}>
      <div align={'center'}>
        <div className={`grid gap-5`}>{children}</div>
      </div>
    </div>
  );
};

export default ResetPasswordLayout;
