import RootLayout from '../layouts/root-layout';

export const metadata = {
  title: 'Unify - Social Network',
  description: 'Connect, Share, and Explore with Unify Social Network',
};

export default function Layout({ children }) {
  return <RootLayout>{children}</RootLayout>;
}
