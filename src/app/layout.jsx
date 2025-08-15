import RootLayout from '../layouts/root-layout';

export const metadata = {
  title: 'Unify',
  description: 'Connect, Share, and Explore with Unify Social Network',
  other: {
    'zalo-platform-site-verification': 'MD6P08MbE0HZZBWTbQyO9ccAW0M5_5TOC3Su',
  },
};

export default function Layout({ children }) {
  return <RootLayout>{children}</RootLayout>;
}
