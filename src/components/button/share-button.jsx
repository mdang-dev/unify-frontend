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
import { useFacebookSDK } from '@/src/hooks/use-facebook-sdk';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

// Accept post as prop
const ShareButton = ({ post, className = '' }) => {
  const t = useTranslations('Common');
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [search, setSearch] = useState('');
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState('link'); // 'link', 'friends', 'social'
  const user = useAuthStore((s) => s.user);
  const { friendUsers, loading } = useSuggestedUsers();
  const [chatPartner, setChatPartner] = useState(null);
  const { sendMessage, isConnected } = useChat(user, chatPartner);
  const { isReady: fbReady, shareToFacebook, shareToMessenger } = useFacebookSDK();

  // Generate share link
  const shareLink = `${window.location.origin}/shared/${post.id}`;

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
      toast.success(`Post shared with ${friend.username}`);
      setSelectedFriend(null);
      onOpenChange(false);
    } catch (e) {
      toast.error('Could not send message.');
    } finally {
      setSending(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      toast.success('Link copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const shareToSocialMedia = async (platform) => {
    const text = `Check out this post on Unify!`;
    let url = '';
    
    switch (platform) {
      case 'facebook':
        try {
          if (fbReady) {
            await shareToFacebook(shareLink, text);
            toast.success('Shared to Facebook successfully!');
          } else {
            // Fallback to sharer.php method
            url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`;
            window.open(url, '_blank', 'width=600,height=400');
          }
        } catch (error) {
          if (error.message === 'User cancelled sharing') {
            // Don't show error for user cancellation
            return;
          }
          toast.error('Failed to share to Facebook');
          console.error('Facebook sharing error:', error);
        }
        return;
        
      case 'messenger':
        try {
          if (fbReady) {
            await shareToMessenger(shareLink);
            toast.success('Shared to Messenger successfully!');
          } else {
            // Fallback to dialog method
            url = `https://www.facebook.com/dialog/send?app_id=737901299112236&link=${encodeURIComponent(shareLink)}&redirect_uri=${encodeURIComponent(window.location.origin)}`;
            window.open(url, '_blank', 'width=600,height=400');
          }
        } catch (error) {
          if (error.message === 'User cancelled sharing') {
            // Don't show error for user cancellation
            return;
          }
          
          // Check if it's a Facebook app configuration error
          if (error.message.includes('app_id') || error.message.includes('permission') || error.message.includes('review')) {
            toast.error('Messenger sharing requires app review. Using fallback method...');
            // Use fallback method
            url = `https://www.facebook.com/dialog/send?app_id=737901299112236&link=${encodeURIComponent(shareLink)}&redirect_uri=${encodeURIComponent(window.location.origin)}`;
            window.open(url, '_blank', 'width=600,height=400');
          } else {
            toast.error('Failed to share to Messenger');
            console.error('Messenger sharing error:', error);
          }
        }
        return;
        
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareLink)}`;
        break;
      case 'instagram':
        // Instagram doesn't support direct sharing via URL, so we'll copy the link
        copyToClipboard();
        toast.info('Instagram sharing: Copy the link and paste it in your Instagram story or post');
        return;
      case 'zalo':
        // Zalo sharing - copy link and show instructions
        copyToClipboard();
        toast.info('Zalo sharing: Copy the link and paste it in your Zalo chat or timeline');
        return;
      default:
        return;
    }
    
    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
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
              
              {/* Tab Navigation */}
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setActiveTab('link')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'link'
                      ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  <i className="fa-solid fa-link mr-2"></i>
                  Link
                </button>
                <button
                  onClick={() => setActiveTab('friends')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'friends'
                      ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  <i className="fa-solid fa-users mr-2"></i>
                  Friends
                </button>
                <button
                  onClick={() => setActiveTab('social')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'social'
                      ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  <i className="fa-solid fa-share-alt mr-2"></i>
                  Social Media
                </button>
              </div>

              <ModalBody>
                {/* Link Tab */}
                {activeTab === 'link' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Share Link
                      </label>
                      <div className="flex gap-2">
                        <Input
                          value={shareLink}
                          readOnly
                          className="flex-1 bg-gray-50 dark:bg-gray-800"
                        />
                        <button
                          onClick={copyToClipboard}
                          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                        >
                          <i className="fa-solid fa-copy mr-2"></i>
                          Copy
                        </button>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <p>Anyone with this link can view the post. If they&apos;re not logged in, they&apos;ll be redirected to the login page.</p>
                    </div>
                  </div>
                )}

                {/* Friends Tab */}
                {activeTab === 'friends' && (
                  <div className="space-y-4">
                    <div>
                      <Input
                        placeholder="Search friends..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-11 w-full font-bold dark:border-white"
                      />
                    </div>
                    <div className="flex flex-wrap gap-4 p-3 justify-start">
                      {loading ? (
                        <div className="text-gray-500">Loading...</div>
                      ) : filteredFriends.length === 0 ? (
                        <div className="text-gray-500">No friends found.</div>
                      ) : (
                        filteredFriends.map((friend) => (
                          <div className="text-center" key={friend.id}>
                            <Image
                              src={friend.avatar?.url || '/images/unify_icon_2.png'}
                              alt={`avtshare-${friend.username}`}
                              width={80}
                              height={80}
                              className={`h-20 w-20 cursor-pointer rounded-full ${
                                selectedFriend === friend.id ? 'ring-4 ring-blue-500' : ''
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
                  </div>
                )}

                                 {/* Social Media Tab */}
                 {activeTab === 'social' && (
                   <div className="space-y-4">
                     {/* Facebook App Status Notice */}
                     <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                       <div className="flex items-start">
                         <i className="fas fa-info-circle text-blue-500 mt-1 mr-2"></i>
                         <div className="text-sm text-blue-700 dark:text-blue-300">
                           <p className="font-medium mb-1">Facebook Integration Status:</p>
                           <p>• Facebook sharing: <span className="text-green-600 dark:text-green-400">✅ Working</span></p>
                           <p>• Messenger sharing: <span className="text-yellow-600 dark:text-yellow-400">⚠️ Requires app review</span></p>
                           <p className="text-xs mt-2 opacity-75">
                             Messenger sharing will work automatically once the Facebook app review is completed.
                           </p>
                         </div>
                       </div>
                     </div>
                     
                     <div className="grid grid-cols-2 gap-4">
                       <button
                         onClick={() => shareToSocialMedia('facebook')}
                         className="flex items-center justify-center gap-3 p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                       >
                         <i className="fab fa-facebook text-2xl"></i>
                         <span className="font-medium">Facebook</span>
                       </button>
                       
                       <button
                         onClick={() => shareToSocialMedia('messenger')}
                         className="flex items-center justify-center gap-3 p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                       >
                         <i className="fab fa-facebook-messenger text-2xl"></i>
                         <span className="font-medium">Messenger</span>
                       </button>
                       
                       <button
                         onClick={() => shareToSocialMedia('twitter')}
                         className="flex items-center justify-center gap-3 p-4 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
                       >
                         <i className="fab fa-twitter text-2xl"></i>
                         <span className="font-medium">Twitter</span>
                       </button>
                       
                       <button
                         onClick={() => shareToSocialMedia('instagram')}
                         className="flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors"
                       >
                         <i className="fab fa-instagram text-2xl"></i>
                         <span className="font-medium">Instagram</span>
                       </button>
                       
                       <button
                         onClick={() => shareToSocialMedia('zalo')}
                         className="flex items-center justify-center gap-3 p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                       >
                         <i className="fas fa-comments text-2xl"></i>
                         <span className="font-medium">Zalo</span>
                       </button>
                     </div>
                   </div>
                 )}
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
