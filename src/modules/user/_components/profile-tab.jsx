import UserPosts from './user-posts';
import UserReels from './user-reels';
import SavedItems from './saved-item';
import TaggedPosts from './tagged-posts';
import PostIsPrivate from './post-is-private';

const ProfileTabs = ({ activeTab, username, savedItems, taggedPosts }) => {
  return (
    <div className="mt-4">
      {activeTab === 'post' && <UserPosts username={username} />}
      {activeTab === 'postIsPrivate' && <PostIsPrivate username={username} />}
      {activeTab === 'reel' && <UserReels username={username} />}
      {activeTab === 'saved' && <SavedItems items={savedItems} />}
      {activeTab === 'tagged' && <TaggedPosts taggedPosts={taggedPosts} />}
    </div>
  );
};

export default ProfileTabs;
