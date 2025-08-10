import RootLayout from '../layouts/root-layout';

export const metadata = {
  title: 'Unify',
  description: 'Connect, Share, and Explore with Unify Social Network',
};

export default function Layout({ children }) {
  return <RootLayout>{children}</RootLayout>;
}
