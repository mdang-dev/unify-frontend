# HỆ THỐNG SHARE TIN NHẮN - UNIFY PLATFORM

## 📋 TỔNG QUAN

Hệ thống share tin nhắn trong Unify cho phép người dùng chia sẻ bài đăng (posts) thông qua tin nhắn chat với bạn bè, cũng như chia sẻ ra các nền tảng mạng xã hội khác. Hệ thống này tích hợp chặt chẽ với hệ thống chat, notification và post management.

## 🏗️ KIẾN TRÚC TỔNG THỂ

### Frontend Architecture
```
unify-frontend/
├── src/
│   ├── components/
│   │   ├── button/
│   │   │   └── share-button.jsx          # Component chính cho share
│   │   └── base/
│   │       └── post-detail-modal/        # Modal hiển thị post chi tiết
│   ├── modules/
│   │   └── messages/
│   │       ├── _components/
│   │       │   ├── message.jsx           # Component hiển thị tin nhắn
│   │       │   └── message-shared-post.jsx # Component hiển thị post được share
│   │       └── message.jsx               # Trang chính của messages
│   └── app/
│       └── [locale]/
│           └── shared/
│               └── [id]/
│                   └── page.jsx          # Trang hiển thị post được share
```

### Backend Architecture
```
unify-backend/
├── src/main/java/com/unify/app/
│   ├── messages/
│   │   ├── domain/
│   │   │   ├── ShareService.java         # Business logic cho share
│   │   │   └── models/
│   │   │       ├── SharePostRequestDto.java
│   │   │       └── SharePostResponseDto.java
│   │   └── web/
│   │       └── ShareController.java      # REST API endpoints
│   └── notifications/
│       └── domain/
│           └── NotificationService.java   # Xử lý thông báo share
```

## 🔧 CHI TIẾT KỸ THUẬT

### 1. SHARE BUTTON COMPONENT

#### Vị trí: `unify-frontend/src/components/button/share-button.jsx`

#### Chức năng chính:
- **3 Tab chính:**
  - **Link**: Copy link trực tiếp
  - **Friends**: Chia sẻ với bạn bè qua chat
  - **Social**: Chia sẻ ra mạng xã hội

#### Props:
```javascript
const ShareButton = ({ post, className = '' })
```

#### State Management:
```javascript
const [search, setSearch] = useState('');           // Tìm kiếm bạn bè
const [selectedFriend, setSelectedFriend] = useState(null); // Bạn bè được chọn
const [sending, setSending] = useState(false);      // Trạng thái gửi
const [activeTab, setActiveTab] = useState('link'); // Tab hiện tại
```

#### Các phương thức chính:

##### 1.1. Chia sẻ với bạn bè:
```javascript
const handleSend = async (friend) => {
  if (!post?.id) {
    toast.error('Cannot share: post information missing');
    return;
  }
  
  setSending(true);
  const content = `POST_SHARE:${post.id}`;  // Format đặc biệt cho share
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
```

##### 1.2. Copy link:
```javascript
const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(shareLink);
    toast.success('Link copied to clipboard!');
  } catch (err) {
    toast.error('Failed to copy link');
  }
};
```

##### 1.3. Chia sẻ mạng xã hội:
```javascript
// Sử dụng react-share library
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
```

#### Các nền tảng được hỗ trợ:
- Facebook
- Facebook Messenger
- Twitter/X
- WhatsApp
- Telegram
- LinkedIn
- Pinterest
- Reddit
- Tumblr
- Email
- Viber
- Line

### 2. BACKEND SHARE SERVICE

#### Vị trí: `unify-backend/src/main/java/com/unify/app/messages/domain/ShareService.java`

#### Dependencies:
```java
@Service
@RequiredArgsConstructor
public class ShareService {
  private final PostService postService;
  private final FollowService followService;
  private final SecurityService securityService;
  private final NotificationService notificationService;
}
```

#### Business Logic:

##### 2.1. Kiểm tra quyền:
```java
// Check friendship - chỉ bạn bè mới được share
if (!followService.shouldBeFriends(currentUserId, postOwner.getId())) {
  throw new ResponseStatusException(
      HttpStatus.FORBIDDEN, "You are not friends with the post owner");
}
```

##### 2.2. Gửi thông báo:
```java
// Send real-time notification to post owner about the share
if (!currentUserId.equals(postOwner.getId())) {
  try {
    String message = "Someone shared your post";
    String link = "/posts/" + post.getId();
    String data = String.format("{\"postId\":\"%s\",\"sharedBy\":\"%s\"}", 
                               post.getId(), currentUserId);

    notificationService.createAndSendNotification(
        currentUserId, postOwner.getId(), NotificationType.SHARE, 
        message, link, data);

    log.info("Share notification sent to post owner {} for post {}", 
             postOwner.getId(), post.getId());
  } catch (Exception e) {
    log.error("Failed to send share notification: {}", e.getMessage(), e);
    // Don't fail the share operation if notification fails
  }
}
```

#### API Endpoint:
```java
@RestController
@RequestMapping("/shares")
class ShareController {
  private final ShareService shareService;

  @PostMapping
  public ResponseEntity<SharePostResponseDto> sharePost(@RequestBody SharePostRequestDto request) {
    SharePostResponseDto response = shareService.sharePost(request);
    return ResponseEntity.ok(response);
  }
}
```

### 3. MESSAGE SHARED POST COMPONENT

#### Vị trí: `unify-frontend/src/modules/messages/_components/message-shared-post.jsx`

#### Chức năng:
- Hiển thị preview của post được share trong chat
- Xử lý click để mở post chi tiết
- Loading state và error handling

#### Props:
```javascript
const SharedPost = ({ postId, preview, onPostClick })
```

#### Preview Structure:
```javascript
// Media preview
let mediaItem = Array.isArray(preview.media)
  ? preview.media.find((m) => m && (m.mediaType === 'IMAGE' || m.mediaType === 'VIDEO'))
  : null;
let mediaUrl = mediaItem?.url || '/images/A_black_image.jpg';
let isVideo = mediaItem?.mediaType === 'VIDEO';
```

#### UI Features:
- **Hover Effects**: Scale transform và shadow changes
- **Video Indicator**: Icon play cho video content
- **Responsive Design**: Min-width 280px, max-width sm
- **Loading Skeleton**: Animate pulse cho trạng thái loading

### 4. MESSAGE COMPONENT INTEGRATION

#### Vị trí: `unify-frontend/src/modules/messages/_components/message.jsx`

#### Regex Pattern:
```javascript
const POST_SHARE_REGEX = /^POST_SHARE:([0-9a-fA-F\-]{36})$/;
```

#### Logic xử lý:
```javascript
// Quét các postId cần preview
useEffect(() => {
  const idsToFetch = messages
    .map((msg) => {
      const match = msg.content?.match(POST_SHARE_REGEX);
      return match ? match[1] : null;
    })
    .filter((id) => id && !previewMap[id] && !loadingPreviewIds.includes(id));
  
  if (idsToFetch.length > 0) {
    setLoadingPreviewIds((prev) => [...prev, ...idsToFetch]);
    idsToFetch.forEach((postId) => {
      postsQueryApi
        .getPostsById(postId)
        .then((data) => setPreviewMap((prev) => ({ ...prev, [postId]: data })))
        .catch(() => setPreviewMap((prev) => ({ ...prev, [postId]: null })))
        .finally(() => setLoadingPreviewIds((prev) => prev.filter((id) => id !== postId)));
    });
  }
}, [messages, previewMap, loadingPreviewIds]);
```

#### Render Logic:
```javascript
{/* Share post - Render independently outside the message bubble */}
{message.content &&
  message.content.match(POST_SHARE_REGEX) &&
  (() => {
    const match = message.content.match(POST_SHARE_REGEX);
    const postId = match[1];
    const preview = previewMap[postId];
    return (
      <div className="mt-2">
        <SharedPost
          postId={postId}
          preview={preview}
          onPostClick={(postId) => setOpenPostId(postId)}
        />
        {/* Timestamp for share post */}
        <div className={`mt-2 flex items-center gap-2 ${isCurrentUser ? 'justify-between' : 'justify-end'}`}>
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatMessageTime(message.timestamp)}
            </span>
          </div>
          {/* Status indicators */}
        </div>
      </div>
    );
  })()}
```

### 5. SHARED POST PAGE

#### Vị trí: `unify-frontend/src/app/[locale]/shared/[id]/page.jsx`

#### Chức năng:
- Hiển thị post được share cho người dùng không có tài khoản
- Responsive design với grid layout
- Tích hợp đầy đủ chức năng: like, comment, bookmark

#### Authentication Flow:
```javascript
// Check for token directly
const token = getCookie(COOKIE_KEYS.AUTH_TOKEN);
const hasToken = !!token;

// Show login prompt for unauthenticated users
if (!hasToken) {
  return (
    <div className="min-h-screen mx-auto flex items-center justify-center bg-gray-50 dark:bg-neutral-900">
      {/* Login/Register UI */}
    </div>
  );
}
```

#### Layout Structure:
```javascript
<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
  {/* Left Side - Post Media */}
  <div className="bg-white dark:bg-neutral-800 rounded-lg overflow-hidden shadow-lg">
    <Slider srcs={post.media || []} onImageClick={() => {}} />
  </div>
  
  {/* Right Side - Post Info and Comments */}
  <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg flex flex-col h-[600px]">
    {/* Post Header, Content, Actions, Comments */}
  </div>
</div>
```

## 🔄 LUỒNG HOẠT ĐỘNG

### 1. Luồng Share Post với Bạn bè:

```
User clicks Share Button
         ↓
    Open Share Modal
         ↓
    Select Friends Tab
         ↓
    Search & Select Friend
         ↓
    Click Send Button
         ↓
    Generate POST_SHARE:{postId} content
         ↓
    Send via Chat System
         ↓
    Friend receives message
         ↓
    System detects POST_SHARE pattern
         ↓
    Fetch post preview data
         ↓
    Render SharedPost component
         ↓
    Friend can click to view full post
```

### 2. Luồng Share ra Mạng xã hội:

```
User clicks Share Button
         ↓
    Open Share Modal
         ↓
    Select Social Tab
         ↓
    Click Social Platform Button
         ↓
    Generate share URL & content
         ↓
    Open platform's share dialog
         ↓
    User completes sharing
         ↓
    Show success toast
```

### 3. Luồng Notification:

```
Post is shared
         ↓
    ShareService.sharePost()
         ↓
    Check friendship status
         ↓
    Create notification data
         ↓
    NotificationService.createAndSendNotification()
         ↓
    Save to database
         ↓
    Send via WebSocket
         ↓
    Post owner receives real-time notification
```

## 🎨 UI/UX FEATURES

### 1. Visual Design:
- **Gradient Backgrounds**: Blue to purple to pink accents
- **Hover Animations**: Scale transforms, shadow changes
- **Smooth Transitions**: 300ms duration for all interactions
- **Dark Mode Support**: Full dark theme compatibility

### 2. Responsive Design:
- **Mobile First**: Optimized for mobile devices
- **Grid Layout**: Adaptive columns based on screen size
- **Touch Friendly**: Appropriate button sizes and spacing

### 3. Loading States:
- **Skeleton Loading**: Animate pulse for content loading
- **Progressive Loading**: Load post previews as needed
- **Error Handling**: Graceful fallbacks for failed requests

## 🔒 BẢO MẬT VÀ QUYỀN TRUY CẬP

### 1. Authentication:
- **Token Validation**: Kiểm tra JWT token cho mọi request
- **User Verification**: Xác thực người dùng trước khi share

### 2. Authorization:
- **Friendship Check**: Chỉ bạn bè mới được share post
- **Post Ownership**: Kiểm tra quyền sở hữu post

### 3. Data Validation:
- **Input Sanitization**: Làm sạch dữ liệu đầu vào
- **SQL Injection Prevention**: Sử dụng prepared statements

## 📊 PERFORMANCE OPTIMIZATIONS

### 1. Frontend:
- **Lazy Loading**: Dynamic imports cho components nặng
- **Memoization**: useMemo cho filtered friends list
- **Debounced Search**: Tối ưu tìm kiếm bạn bè
- **Optimistic Updates**: Cập nhật UI ngay lập tức

### 2. Backend:
- **Caching**: Redis cache cho post data
- **Async Processing**: Non-blocking notification sending
- **Connection Pooling**: Database connection optimization

### 3. Network:
- **CDN**: Static assets delivery
- **Image Optimization**: WebP format, responsive images
- **Bundle Splitting**: Code splitting cho better loading

## 🧪 TESTING STRATEGY

### 1. Unit Tests:
- **Service Layer**: Test business logic
- **Component Tests**: Test UI components
- **API Tests**: Test endpoints

### 2. Integration Tests:
- **End-to-End**: Complete user flows
- **API Integration**: Frontend-Backend communication
- **Database Integration**: Data persistence

### 3. Performance Tests:
- **Load Testing**: High concurrent users
- **Stress Testing**: System limits
- **Memory Leaks**: Long-running operations

## 🚀 DEPLOYMENT & MONITORING

### 1. Environment Configuration:
```javascript
// Frontend
NEXT_PUBLIC_API_URL=https://api.unify.com
NEXT_PUBLIC_WS_URL=wss://ws.unify.com

// Backend
spring.profiles.active=production
logging.level.com.unify.app=INFO
```

### 2. Monitoring:
- **Application Metrics**: Response times, error rates
- **Business Metrics**: Share counts, user engagement
- **Infrastructure**: CPU, memory, network usage

### 3. Logging:
```java
@Slf4j
public class ShareService {
  log.info("Share notification sent to post owner {} for post {}", 
           postOwner.getId(), post.getId());
  log.error("Failed to send share notification: {}", e.getMessage(), e);
}
```

## 🔮 FUTURE ENHANCEMENTS

### 1. Planned Features:
- **Analytics Dashboard**: Track sharing patterns
- **Advanced Privacy**: Granular sharing permissions
- **Cross-Platform Sync**: Share across multiple devices

### 2. Technical Improvements:
- **GraphQL**: More efficient data fetching
- **Real-time Updates**: Live share notifications
- **AI Integration**: Smart content recommendations

### 3. User Experience:
- **Custom Share Messages**: Personalized sharing
- **Share Scheduling**: Time-delayed sharing
- **Share Templates**: Pre-defined share formats

## 📚 TÀI LIỆU THAM KHẢO

### 1. Libraries Used:
- **react-share**: Social media sharing
- **framer-motion**: Animations
- **@heroui/react**: UI components
- **sonner**: Toast notifications

### 2. APIs:
- **Chat API**: WebSocket communication
- **Post API**: Post management
- **User API**: User authentication
- **Notification API**: Real-time notifications

### 3. Standards:
- **RESTful API**: HTTP endpoints
- **WebSocket**: Real-time communication
- **JWT**: Authentication tokens
- **OAuth 2.0**: Social login integration

---

**Tác giả**: Unify Development Team  
**Phiên bản**: 1.0.0  
**Cập nhật cuối**: 2024  
**Trạng thái**: Production Ready
