import { useEffect } from 'react';
import { streamsCommandApi } from '../apis/streams/command/streams.command.api';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'sonner';
import { useState } from 'react';

export const useViewerToken = (hostIdentity, selfIdentity) => {
  const [token, setToken] = useState('');
  const [name, setName] = useState('');
  const [identity, setIdentity] = useState('');

  useEffect(() => {
    if (!hostIdentity || !selfIdentity) return;

    const createToken = async () => {
      try {
        const { token } = await streamsCommandApi.createViewerToken(hostIdentity, selfIdentity);
        setToken(token);
        const decodeToken = jwtDecode(token);

        const { sub: identity, name } = decodeToken;

        if (identity) {
          setIdentity(identity);
        }

        if (name) {
          setName(name);
        }
      } catch {
        toast.error('Something went wrong.');
      }
    };
    createToken();
  }, [hostIdentity, selfIdentity]);

  return {
    token,
    name,
    identity,
  };
};
