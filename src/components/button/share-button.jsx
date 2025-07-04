import React, { useState, useMemo } from 'react';
import { Input } from '../ui/input';
import Image from 'next/image';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from '@heroui/react';
import { useSuggestedUsers } from '@/src/hooks/use-suggested';
import { useAuthStore } from '@/src/stores/auth.store';
import { useChat } from '@/src/hooks/use-chat';
import { addToast } from '@heroui/react';

// Accept post as prop
const ShareButton = ({ post, className = '' }) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [search, setSearch] = useState('');
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [sending, setSending] = useState(false);
  const user = useAuthStore((s) => s.user);
  const { friendUsers, loading } = useSuggestedUsers();
  const [chatPartner, setChatPartner] = useState(null);
  const { sendMessage, isConnected } = useChat(user, chatPartner);

  // Filter friends by search
  const filteredFriends = useMemo(() => {
    if (!search) return friendUsers;
    return friendUsers.filter(
      (f) =>
        f.username.toLowerCase().includes(search.toLowerCase()) ||
        (f.name && f.name.toLowerCase().includes(search.toLowerCase()))
    );
  }, [friendUsers, search]);

  const handleSend = async (friend) => {
    setSending(true);
    const content = `POST_SHARE:${post.id}`;
    try {
      await sendMessage(content, [], friend.id);
      addToast({
        title: 'Shared!',
        description: `Post shared with ${friend.username}`,
        color: 'success',
        timeout: 2000,
      });
      setSelectedFriend(null);
      onOpenChange(false);
    } catch (e) {
      addToast({
        title: 'Failed',
        description: 'Could not send message.',
        color: 'danger',
        timeout: 2000,
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button onClick={onOpen} className={`bg-transparent text-xl dark:text-white ${className}`}>
        <i className="fa-regular fa-paper-plane"></i>
      </button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex-cols flex">
                <h1 className="text-2xl font-bold">Share</h1>
              </ModalHeader>
              <hr className="bg-gray-200"></hr>
              <ModalBody>
                <div className="mt-4">
                  <Input
                    placeholder={'Search friends...'}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={`h-11 w-full font-bold dark:border-white`}
                  />
                </div>
                <div className="flex flex-wrap gap-4 p-3 justify-start">
                  {loading ? (
                    <div>Loading...</div>
                  ) : filteredFriends.length === 0 ? (
                    <div>No friends found.</div>
                  ) : (
                    filteredFriends.map((friend) => (
                      <div className="text-center" key={friend.id}>
                        <Image
                          src={friend.avatar?.url || '/images/unify_icon_2.svg'}
                          alt={`avtshare-${friend.username}`}
                          width={80}
                          height={80}
                          className={`h-20 w-20 cursor-pointer rounded-full ${
                            selectedFriend === friend.id ? 'ring-4 dark:ring-white' : ''
                          }`}
                          onClick={() => setSelectedFriend(friend.id === selectedFriend ? null : friend.id)}
                        />
                        <p className="mt-2 w-20 truncate text-lg font-bold">{friend.username}</p>
                        {selectedFriend === friend.id && (
                          <button
                            className="mt-2 rounded bg-blue-500 px-4 py-2 text-white disabled:opacity-50"
                            disabled={sending || !isConnected}
                            onClick={() => handleSend(friend)}
                          >
                            {sending ? 'Sending...' : 'Send'}
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ModalBody>
              <ModalFooter></ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default ShareButton;
