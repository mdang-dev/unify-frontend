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
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

// Import react-share components
import {
  FacebookShareButton,
  FacebookMessengerShareButton,
  TwitterShareButton,
  TelegramShareButton,
  WhatsappShareButton,
  LinkedinShareButton,
  PinterestShareButton,
  RedditShareButton,
  TumblrShareButton,
  EmailShareButton,
  ViberShareButton,
  LineShareButton,
  FacebookIcon,
  FacebookMessengerIcon,
  TwitterIcon,
  TelegramIcon,
  WhatsappIcon,
  LinkedinIcon,
  PinterestIcon,
  RedditIcon,
  TumblrIcon,
  EmailIcon,
  ViberIcon,
  LineIcon,
} from 'react-share';

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

  // Early return if post is not provided or missing required properties
  if (!post || !post.id) {
    console.warn('ShareButton: post prop is missing or invalid:', post);
    return (
      <button 
        className={`bg-transparent text-xl dark:text-white ${className}`}
        disabled
        title="Cannot share: post information missing"
      >
        <i className="fa-regular fa-paper-plane opacity-50"></i>
      </button>
    );
  }

  // Generate share link and content with safe property access
  const shareLink = `${window.location.origin}/shared/${post.id}`;
  const shareTitle = post?.content || post?.captions || 'Check out this post on Unify!';
  const shareText = post?.captions ? `${post.captions.substring(0, 100)}...` : 'Check out this amazing post on Unify!';

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
    if (!post?.id) {
      toast.error('Cannot share: post information missing');
      return;
    }
    
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

  const handleShareSuccess = (platform) => {
    toast.success(`Shared to ${platform} successfully!`);
  };

  const handleShareError = (platform, error) => {
    console.error(`${platform} sharing error:`, error);
    toast.error(`Failed to share to ${platform}`);
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
                  <div className="space-y-6">
                    {/* Share Info */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <div className="flex items-start">
                        <i className="fas fa-info-circle text-blue-500 mt-1 mr-2"></i>
                        <div className="text-sm text-blue-700 dark:text-blue-300">
                          <p className="font-medium mb-1">Share this post:</p>
                          <p className="text-xs opacity-75">{shareText}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Social Media Buttons */}
                    <div className="grid grid-cols-3 gap-4">
                      {/* Facebook */}
                      <FacebookShareButton
                        url={shareLink}
                        quote={shareText}
                        hashtag="#Unify"
                        onShareWindowClose={() => handleShareSuccess('Facebook')}
                      >
                        <div className="flex flex-col items-center gap-2 p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                          <FacebookIcon size={32} round />
                          <span className="text-xs font-medium">Facebook</span>
                        </div>
                      </FacebookShareButton>

                      {/* Facebook Messenger */}
                      <FacebookMessengerShareButton
                        url={shareLink}
                        appId="737901299112236"
                        onShareWindowClose={() => handleShareSuccess('Messenger')}
                      >
                        <div className="flex flex-col items-center gap-2 p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                          <FacebookMessengerIcon size={32} round />
                          <span className="text-xs font-medium">Messenger</span>
                        </div>
                      </FacebookMessengerShareButton>

                      {/* Twitter/X */}
                      <TwitterShareButton
                        url={shareLink}
                        title={shareText}
                        hashtags={['Unify', 'SocialMedia']}
                        onShareWindowClose={() => handleShareSuccess('Twitter')}
                      >
                        <div className="flex flex-col items-center gap-2 p-4 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors">
                          <TwitterIcon size={32} round />
                          <span className="text-xs font-medium">Twitter</span>
                        </div>
                      </TwitterShareButton>

                      {/* WhatsApp */}
                      <WhatsappShareButton
                        url={shareLink}
                        title={shareText}
                        onShareWindowClose={() => handleShareSuccess('WhatsApp')}
                      >
                        <div className="flex flex-col items-center gap-2 p-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                          <WhatsappIcon size={32} round />
                          <span className="text-xs font-medium">WhatsApp</span>
                        </div>
                      </WhatsappShareButton>

                      {/* Telegram */}
                      <TelegramShareButton
                        url={shareLink}
                        title={shareText}
                        onShareWindowClose={() => handleShareSuccess('Telegram')}
                      >
                        <div className="flex flex-col items-center gap-2 p-4 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors">
                          <TelegramIcon size={32} round />
                          <span className="text-xs font-medium">Telegram</span>
                        </div>
                      </TelegramShareButton>

                      {/* LinkedIn */}
                      <LinkedinShareButton
                        url={shareLink}
                        title={shareTitle}
                        summary={shareText}
                        source="Unify"
                        onShareWindowClose={() => handleShareSuccess('LinkedIn')}
                      >
                        <div className="flex flex-col items-center gap-2 p-4 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors">
                          <LinkedinIcon size={32} round />
                          <span className="text-xs font-medium">LinkedIn</span>
                        </div>
                      </LinkedinShareButton>

                      {/* Reddit */}
                      <RedditShareButton
                        url={shareLink}
                        title={shareTitle}
                        onShareWindowClose={() => handleShareSuccess('Reddit')}
                      >
                        <div className="flex flex-col items-center gap-2 p-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
                          <RedditIcon size={32} round />
                          <span className="text-xs font-medium">Reddit</span>
                        </div>
                      </RedditShareButton>

                      {/* Email */}
                      <EmailShareButton
                        url={shareLink}
                        subject={shareTitle}
                        body={shareText}
                        onShareWindowClose={() => handleShareSuccess('Email')}
                      >
                        <div className="flex flex-col items-center gap-2 p-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                          <EmailIcon size={32} round />
                          <span className="text-xs font-medium">Email</span>
                        </div>
                      </EmailShareButton>

                      {/* Viber */}
                      <ViberShareButton
                        url={shareLink}
                        title={shareText}
                        onShareWindowClose={() => handleShareSuccess('Viber')}
                      >
                        <div className="flex flex-col items-center gap-2 p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                          <ViberIcon size={32} round />
                          <span className="text-xs font-medium">Viber</span>
                        </div>
                      </ViberShareButton>

                      {/* Line */}
                      <LineShareButton
                        url={shareLink}
                        title={shareText}
                        onShareWindowClose={() => handleShareSuccess('Line')}
                      >
                        <div className="flex flex-col items-center gap-2 p-4 bg-green-400 text-white rounded-lg hover:bg-green-500 transition-colors">
                          <LineIcon size={32} round />
                          <span className="text-xs font-medium">Line</span>
                        </div>
                      </LineShareButton>

                      {/* Pinterest (if post has images) */}
                      {post?.fileUrls && Array.isArray(post.fileUrls) && post.fileUrls.length > 0 && (
                        <PinterestShareButton
                          url={shareLink}
                          media={post.fileUrls[0]}
                          description={shareText}
                          onShareWindowClose={() => handleShareSuccess('Pinterest')}
                        >
                          <div className="flex flex-col items-center gap-2 p-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                            <PinterestIcon size={32} round />
                            <span className="text-xs font-medium">Pinterest</span>
                          </div>
                        </PinterestShareButton>
                      )}

                      {/* Tumblr */}
                      <TumblrShareButton
                        url={shareLink}
                        title={shareTitle}
                        caption={shareText}
                        tags={['Unify', 'SocialMedia']}
                        onShareWindowClose={() => handleShareSuccess('Tumblr')}
                      >
                        <div className="flex flex-col items-center gap-2 p-4 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors">
                          <TumblrIcon size={32} round />
                          <span className="text-xs font-medium">Tumblr</span>
                        </div>
                      </TumblrShareButton>
                    </div>

                    {/* Additional Info */}
                    <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      <p>Click any platform to share this post. Some platforms may require you to be logged in.</p>
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
