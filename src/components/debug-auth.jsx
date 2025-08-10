// 'use client';

// import React, { useEffect, useState } from 'react';
// import { useAuthStore } from '@/src/stores/auth.store';
// import { useUser } from '@/src/hooks/use-user';
// import { getCookie } from '@/src/utils/cookies.util';
// import { COOKIE_KEYS } from '@/src/constants/cookie-keys.constant';

// export default function DebugAuth() {
//   const { user: authStoreUser } = useAuthStore();
//   const { user: hookUser, isLoading, isError } = useUser();
//   const [token, setToken] = useState('None');
//   const [isClient, setIsClient] = useState(false);

//   // Fix hydration by ensuring client-side only rendering
//   useEffect(() => {
//     setIsClient(true);
//     const currentToken = getCookie(COOKIE_KEYS.AUTH_TOKEN);
//     setToken(currentToken ? `${currentToken.substring(0, 20)}...` : 'None');
//   }, []);

//   // Only render in development
//   if (process.env.NODE_ENV !== 'development') {
//     return null;
//   }

//   // Don't render until client-side hydration is complete
//   if (!isClient) {
//     return (
//       <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border max-w-md w-full z-50">
//         <h3 className="font-bold mb-2">🔍 Auth Debug (DEV ONLY)</h3>
//         <div className="text-xs space-y-1">
//           <div><strong>Token:</strong> Loading...</div>
//           <div><strong>Auth Store User:</strong> Loading...</div>
//           <div><strong>Hook User:</strong> Loading...</div>
//           <div><strong>Loading:</strong> Loading...</div>
//           <div><strong>Error:</strong> Loading...</div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border max-w-md w-full z-50">
//       <h3 className="font-bold mb-2">🔍 Auth Debug (DEV ONLY)</h3>
//       <div className="text-xs space-y-1">
//         <div><strong>Token:</strong> {token}</div>
//         <div><strong>Auth Store User:</strong> {authStoreUser ? authStoreUser.id : 'None'}</div>
//         <div><strong>Hook User:</strong> {hookUser ? hookUser.id : 'None'}</div>
//         <div><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</div>
//         <div><strong>Error:</strong> {isError ? 'Yes' : 'No'}</div>
//       </div>
//     </div>
//   );
// }
