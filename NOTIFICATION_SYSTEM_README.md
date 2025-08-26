# NOTIFICATION SYSTEM - PHÂN TÍCH CHI TIẾT

## Tổng quan
Hệ thống notification trong dự án Unify bao gồm cả backend (Java Spring Boot) và frontend (React/Next.js), hỗ trợ real-time notifications thông qua WebSocket và REST API.

## Cấu trúc thư mục
```
unify-backend/src/main/java/com/unify/app/notifications/
├── domain/
│   ├── Notification.java
│   ├── NotificationService.java
│   └── NotificationRepository.java
├── web/
│   └── NotificationController.java
└── domain/models/
    ├── NotificationDto.java
    └── NotificationType.java

unify-frontend/src/
├── apis/notifications/
│   └── command/notifications.command.api.js
├── components/base/notification-group/
│   └── notification-group.jsx
└── hooks/
    ├── use-notification.jsx
    └── use-desktop-notifications.jsx
```

---
## PHẦN 1: BACKEND - DOMAIN MODEL

### 1.1 Notification Entity (Notification.java)
**Đường dẫn:** `unify-backend/src/main/java/com/unify/app/notifications/domain/Notification.java`

**Mô tả:** Entity chính đại diện cho một notification trong hệ thống, sử dụng MongoDB với annotation `@Document`.

**Các trường dữ liệu:**
- `id`: Định danh duy nhất của notification
- `sender`: ID của người gửi notification
- `receiver`: ID của người nhận notification  
- `type`: Loại notification (enum NotificationType)
- `timestamp`: Thời gian tạo notification
- `isRead`: Trạng thái đã đọc hay chưa
- `message`: Nội dung thông báo
- `link`: Link liên quan đến notification
- `data`: Dữ liệu JSON bổ sung (commentId, postId, etc.)

**Đặc điểm kỹ thuật:**
- Sử dụng Lombok để tự động tạo getter/setter
- Có custom setter cho `isRead` để đảm bảo xử lý đúng cách
- Implement Serializable interface
- Sử dụng MongoDB với collection name "notification"

**Code chính:**
```java
@Document(collection = "notification")
@FieldDefaults(level = AccessLevel.PRIVATE)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification implements Serializable {
  @Id String id;
  String sender;
  String receiver;

  @Enumerated(EnumType.STRING)
  NotificationType type;

  LocalDateTime timestamp;
  @Builder.Default boolean isRead = false;
  String message;
  String link;
  String data; // Store JSON data like commentId, postId
}
```

### 1.2 NotificationDto (NotificationDto.java)
**Đường dẫn:** `unify-backend/src/main/java/com/unify/app/notifications/domain/models/NotificationDto.java`

**Mô tả:** Data Transfer Object (DTO) để truyền dữ liệu notification giữa các layer, đặc biệt cho API responses và WebSocket messages.

**Các trường dữ liệu:**
- `id`: ID của notification
- `sender`: Thông tin người gửi (SenderDto object)
- `receiver`: ID của người nhận
- `type`: Loại notification
- `message`: Nội dung thông báo
- `timestamp`: Thời gian tạo
- `isRead`: Trạng thái đã đọc (với @JsonProperty để đảm bảo serialization)
- `link`: Link liên quan
- `data`: Dữ liệu JSON bổ sung

**SenderDto inner class:**
```java
public static class SenderDto {
  String id;
  String fullName;
  String avatar;
}
```

**Đặc điểm kỹ thuật:**
- Sử dụng @JsonProperty("isRead") để đảm bảo field boolean được serialize đúng cách
- Implement Serializable interface
- Sử dụng Lombok Builder pattern
- Có inner class SenderDto để chứa thông tin người gửi

### 1.3 NotificationType Enum (NotificationType.java)
**Đường dẫn:** `unify-backend/src/main/java/com/unify/app/notifications/domain/models/NotificationType.java`

**Mô tả:** Enum định nghĩa các loại notification khác nhau trong hệ thống.

**Các loại notification:**
- **Cơ bản:** POST, FOLLOW, MESSAGE, SYSTEM, LIKE, COMMENT, TAG, SHARE
- **Report:** REPORT, POST_REPORT, COMMENT_REPORT, USER_REPORT, REPORT_APPROVED
- **Account actions:** ACCOUNT_SUSPENDED, ACCOUNT_BANNED

**Method đặc biệt:**
```java
public static String getReportMessage(String reportType) {
  return switch (reportType.toLowerCase()) {
    case "post" -> "Your post has been reported and approved.";
    case "comment" -> "Your comment has been reported and approved.";
    case "user" -> "Your profile has been reported and approved.";
    case "story" -> "Your story has been reported and approved.";
    case "reel" -> "Your reel has been reported and approved.";
    case "message" -> "Your message has been reported and approved.";
    default -> "Your content has been reported and approved.";
  };
}
```

**Đặc điểm:**
- Sử dụng Java switch expression (Java 14+)
- Cung cấp message mặc định cho từng loại report
- Hỗ trợ đầy đủ các loại content có thể bị report

### 1.4 NotificationRepository (NotificationRepository.java)
**Đường dẫn:** `unify-backend/src/main/java/com/unify/app/notifications/domain/NotificationRepository.java`

**Mô tả:** Interface repository sử dụng Spring Data MongoDB để thực hiện các thao tác CRUD với notification collection.

**Các method chính:**
- `findByReceiverOrderByTimestampDesc(String receiver)`: Lấy tất cả notifications của một user, sắp xếp theo thời gian giảm dần
- `findByReceiverOrderByTimestampDesc(String receiver, Pageable pageable)`: Lấy notifications có phân trang
- `countByReceiverAndIsReadFalse(String receiver)`: Đếm số notifications chưa đọc của một user
- `countByReceiverAndTypeAndIsReadFalse(String receiver, NotificationType type)`: Đếm notifications chưa đọc theo loại
- `findTopBySenderAndReceiverAndTypeOrderByTimestampDesc(...)`: Tìm notification gần nhất theo sender, receiver và type
- `deleteBySenderAndReceiverAndType(...)`: Xóa notifications theo sender, receiver và type

**Đặc điểm kỹ thuật:**
- Extends MongoRepository để có sẵn các method CRUD cơ bản
- Sử dụng Spring Data MongoDB query methods
- Hỗ trợ phân trang với Pageable
- Có các method tùy chỉnh để xử lý business logic cụ thể

### 1.5 NotificationService (NotificationService.java)
**Đường dẫn:** `unify-backend/src/main/java/com/unify/app/notifications/domain/NotificationService.java`

**Mô tả:** Service layer chính xử lý tất cả business logic liên quan đến notifications, bao gồm tạo, gửi, quản lý trạng thái và WebSocket communication.

**Dependencies:**
- `NotificationRepository`: Thao tác với database
- `NotificationMapper`: Chuyển đổi giữa Entity và DTO
- `SimpMessagingTemplate`: Gửi WebSocket messages
- `UserService`: Lấy thông tin user

**Các method chính:**

#### 1.5.1 Core Methods
- `saveNotification(Notification)`: Lưu notification vào database
- `sendNotification(String receiverId, NotificationDto)`: Gửi notification qua WebSocket
- `createAndSendNotification(...)`: Tạo và gửi notification với nhiều overload

#### 1.5.2 Specialized Notification Creation
**Follow Notification:**
```java
private void createFollowNotification(String senderId, String receiverId, String message, String link, String data) {
  // Kiểm tra và xóa notification follow cũ để tránh duplicate
  Optional<Notification> existingNotification = notificationRepository
      .findTopBySenderAndReceiverAndTypeOrderByTimestampDesc(senderId, receiverId, NotificationType.FOLLOW);
  
  if (existingNotification.isPresent()) {
    notificationRepository.deleteBySenderAndReceiverAndType(senderId, receiverId, NotificationType.FOLLOW);
  }
  
  // Tạo notification mới và gửi qua WebSocket
  Notification notification = Notification.builder()
      .sender(senderId)
      .receiver(receiverId)
      .type(NotificationType.FOLLOW)
      .message(message != null ? message : generateMessage(senderId, NotificationType.FOLLOW))
      .link(link)
      .data(data)
      .timestamp(LocalDateTime.now())
      .isRead(false)
      .build();
}
```

**Tag Notification:**
```java
private void createTagNotification(String senderId, String receiverId, String message, String link, String data) {
  // Tạo notification tag và gửi qua WebSocket
  Notification notification = Notification.builder()
      .sender(senderId)
      .receiver(receiverId)
      .type(NotificationType.TAG)
      .message(message != null ? message : generateMessage(senderId, NotificationType.TAG))
      .link(link)
      .data(data)
      .timestamp(LocalDateTime.now())
      .isRead(false)
      .build();
}
```

**Report Notification:**
```java
private void createReportNotification(String senderId, String receiverId, NotificationType type, String message, String link, String data) {
  // Tạo notification report và gửi qua WebSocket
  Notification notification = Notification.builder()
      .sender(senderId)
      .receiver(receiverId)
      .type(type)
      .message(message != null ? message : generateMessage(senderId, type))
      .link(link)
      .data(data)
      .timestamp(LocalDateTime.now())
      .isRead(false)
      .build();
}
```

#### 1.5.3 Query Methods
- `getNotificationsForUser(String receiverId, Pageable pageable)`: Lấy notifications có phân trang
- `getNotificationsForUser(String receiverId)`: Lấy tất cả notifications (giới hạn 50)
- `getUnreadCount(String receiverId)`: Đếm số notifications chưa đọc

#### 1.5.4 Status Management
- `markAsRead(String notificationId, String receiverId)`: Đánh dấu một notification đã đọc
- `markAllAsRead(String receiverId)`: Đánh dấu tất cả notifications đã đọc

#### 1.5.5 WebSocket Integration
**Retry Logic:**
```java
private void sendNotificationWithRetry(String receiverId, NotificationDto notificationDTO) {
  int maxRetries = 3;
  int retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      simpMessagingTemplate.convertAndSend(
          "/user/" + receiverId + "/queue/notifications", notificationDTO);
      return; // Success, exit retry loop
    } catch (Exception e) {
      retryCount++;
      if (retryCount >= maxRetries) {
        log.error("Failed to send notification after {} attempts", maxRetries);
      } else {
        Thread.sleep(100 * retryCount);
      }
    }
  }
}
```

#### 1.5.6 Message Generation
**Personalized Messages:**
```java
private String generateMessage(String senderId, NotificationType type) {
  User sender = userService.findUserById(senderId);
  String senderName = sender != null ? 
      (sender.getFirstName() + " " + sender.getLastName()).trim() : "Someone";

  return switch (type) {
    case FOLLOW -> senderName + " started following you.";
    case LIKE -> senderName + " liked your post.";
    case COMMENT -> senderName + " commented on your post.";
    case TAG -> senderName + " tagged you in a post.";
    case SHARE -> senderName + " shared your post.";
    // ... other types
  };
}
```

**Fallback Messages:**
- Có fallback messages khi không thể lấy được thông tin user
- Sử dụng Java switch expression (Java 14+)

#### 1.5.7 Special Features
- **Duplicate Prevention:** Xóa notification follow cũ trước khi tạo mới
- **Error Handling:** Comprehensive try-catch với logging
- **Performance Optimization:** Batch user queries và caching
- **Real-time Updates:** WebSocket cho instant delivery
- **Report Count Updates:** Gửi cập nhật số lượng report qua WebSocket

### 1.6 NotificationController (NotificationController.java)
**Đường dẫn:** `unify-backend/src/main/java/com/unify/app/notifications/web/NotificationController.java`

**Mô tả:** REST Controller xử lý các HTTP requests liên quan đến notifications, đồng thời hỗ trợ WebSocket message handling.

**Dependencies:**
- `NotificationService`: Business logic layer
- `SimpMessagingTemplate`: WebSocket messaging

**Các endpoint chính:**

#### 1.6.1 REST API Endpoints
**Get User Notifications:**
```java
@GetMapping("/{userId}")
public ResponseEntity<NotificationResponse> getUserNotifications(
    @PathVariable String userId,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size) {
  
  Pageable pageable = PageRequest.of(page, Math.min(size, 100)); // Limit max size to 100
  Page<NotificationDto> notifications = notificationService.getNotificationsForUser(userId, pageable);
  long unreadCount = notificationService.getUnreadCount(userId);
  
  NotificationResponse response = new NotificationResponse(
      notifications.getContent(),
      notifications.getTotalElements(),
      notifications.getTotalPages(),
      notifications.getNumber(),
      unreadCount);
  
  return ResponseEntity.ok(response);
}
```

**Get Unread Count:**
```java
@GetMapping("/{userId}/unread-count")
public ResponseEntity<UnreadCountResponse> getUnreadCount(@PathVariable String userId) {
  long unreadCount = notificationService.getUnreadCount(userId);
  return ResponseEntity.ok(new UnreadCountResponse(unreadCount));
}
```

**Mark as Read:**
```java
@PostMapping("/mark-as-read")
public ResponseEntity<?> markAsRead(@RequestBody MarkAsReadRequest request) {
  notificationService.markAsRead(request.notificationId(), request.userId());
  return ResponseEntity.ok().build();
}
```

**Mark All as Read:**
```java
@PatchMapping("/mark-all-as-read")
public ResponseEntity<?> markAllAsRead(@RequestBody MarkAllAsReadRequest request) {
  notificationService.markAllAsRead(request.userId());
  return ResponseEntity.ok().build();
}
```

**Mark as Read on Modal Close:**
```java
@PostMapping("/mark-as-read-on-modal-close")
public ResponseEntity<?> markAsReadOnModalClose(@RequestBody MarkAsReadOnModalCloseRequest request) {
  // Mark all unread notifications as read when modal closes
  notificationService.markAllAsRead(request.userId());
  return ResponseEntity.ok().build();
}
```

#### 1.6.2 WebSocket Message Handlers
**Notification Acknowledgment:**
```java
@MessageMapping("/notifications/ack")
public void handleNotificationAck(@Payload String ackMessage) {
  // Log connection acknowledgment
  log.info("User notification acknowledgment received: {}", ackMessage);
}
```

**Notification Received:**
```java
@MessageMapping("/notifications/received")
public void handleNotificationReceived(@Payload String receivedMessage) {
  // Log notification received acknowledgment
  log.debug("Notification received acknowledgment: {}", receivedMessage);
}
```

**Send Notification via WebSocket:**
```java
@MessageMapping("/send")
@SendToUser("/queue/notifications")
public void sendNotification(NotificationDto dto) {
  messagingTemplate.convertAndSendToUser(dto.getReceiver(), "/queue/notifications", dto);
}
```

#### 1.6.3 Response DTOs
**NotificationResponse:**
```java
public record NotificationResponse(
    List<NotificationDto> notifications,
    long totalElements,
    int totalPages,
    int currentPage,
    long unreadCount) {}
```

**UnreadCountResponse:**
```java
public record UnreadCountResponse(long unreadCount) {}
```

#### 1.6.4 Request DTOs
```java
record MarkAsReadRequest(String notificationId, String userId) {}
record MarkAllAsReadRequest(String userId) {}
record MarkAsReadOnModalCloseRequest(String userId) {}
```

#### 1.6.5 Đặc điểm kỹ thuật
- **Pagination:** Hỗ trợ phân trang với giới hạn tối đa 100 items
- **Error Handling:** Comprehensive error handling với appropriate HTTP status codes
- **Validation:** Kiểm tra input parameters trước khi xử lý
- **Logging:** Detailed logging cho debugging và monitoring
- **WebSocket Integration:** Hỗ trợ cả REST API và WebSocket messaging
- **Response Structure:** Structured response với metadata (pagination, counts)

---
## PHẦN 2: FRONTEND - API LAYER

### 2.1 Notifications Command API (notifications.command.api.js)
**Đường dẫn:** `unify-frontend/src/apis/notifications/command/notifications.command.api.js`

**Mô tả:** API client layer xử lý tất cả HTTP requests đến backend notification endpoints.

**Các method chính:**

#### 2.1.1 Fetch Notifications
```javascript
fetch: async (userId, page = 0, size = 20) => {
  const res = await httpClient.get(`${url}/${userId}`, { 
    params: { page, size } 
  });
  return res.data;
}
```

#### 2.1.2 Get Unread Count
```javascript
getUnreadCount: async (userId) => {
  const res = await httpClient.get(`${url}/${userId}/unread-count`);
  return res.data.unreadCount;
}
```

#### 2.1.3 Mark as Read
```javascript
markAsRead: async (notificationId, userId) => {
  const res = await httpClient.post(`${url}/mark-as-read`, { notificationId, userId });
  return res.data;
}
```

#### 2.1.4 Mark All as Read
```javascript
markAllAsRead: async (userId) => {
  const res = await httpClient.patch(`${url}/mark-all-as-read`, { userId });
  return res.data;
}
```

#### 2.1.5 Mark as Read on Modal Close
```javascript
markAsReadOnModalClose: async (userId) => {
  const res = await httpClient.post(`${url}/mark-as-read-on-modal-close`, { userId });
  return res.data;
}
```

#### 2.1.6 Delete Notification
```javascript
deleteNotification: async (notificationId) => {
  const res = await httpClient.delete(`${url}/${notificationId}`);
  return res.data;
}
```

**Đặc điểm kỹ thuật:**
- Sử dụng custom `httpClient` utility
- Base URL: `/api/notifications`
- Hỗ trợ pagination với page và size parameters
- RESTful API design pattern
- Error handling thông qua HTTP client

---
## PHẦN 3: FRONTEND - HOOKS & STATE MANAGEMENT

### 3.1 useNotification Hook (use-notification.jsx)
**Đường dẫn:** `unify-frontend/src/hooks/use-notification.jsx`

**Mô tả:** Custom React hook xử lý toàn bộ logic notification system, bao gồm data fetching, WebSocket connection, caching, và state management.

**Dependencies:**
- `@tanstack/react-query`: Data fetching và caching
- `@stomp/stompjs`: WebSocket STOMP client
- `sockjs-client`: WebSocket transport layer
- `useDesktopNotifications`: Desktop notification support

**State Management:**
```javascript
const [isModalOpen, setIsModalOpen] = useState(false);
const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
const [webSocketError, setWebSocketError] = useState(null);
const [reconnectAttempts, setReconnectAttempts] = useState(0);
```

**Refs:**
```javascript
const messageBatchRef = useRef([]);           // Batch messages for processing
const batchTimeoutRef = useRef(null);         // Batch processing timeout
const stompClientRef = useRef(null);          // STOMP WebSocket client
const subscriptionsRef = useRef(null);        // WebSocket subscriptions
```

#### 3.1.1 Data Fetching với React Query
**Unread Count Query:**
```javascript
const { data: unreadCount = 0 } = useQuery({
  queryKey: [QUERY_KEYS.NOTIFICATIONS_UNREAD_COUNT, userId],
  queryFn: () => notificationsCommandApi.getUnreadCount(userId),
  enabled: !!userId && !isWebSocketConnected,
  staleTime: Infinity,
  refetchInterval: !isWebSocketConnected ? 30000 : false,
});
```

**Infinite Query cho Notifications:**
```javascript
const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error, refetch } =
  useInfiniteQuery({
    queryKey: [QUERY_KEYS.NOTIFICATIONS, userId],
    queryFn: ({ pageParam = 0 }) => notificationsCommandApi.fetch(userId, pageParam),
    getNextPageParam: (lastPage) => {
      if (lastPage && lastPage.totalPages && lastPage.currentPage < lastPage.totalPages - 1) {
        return lastPage.currentPage + 1;
      }
      return undefined;
    },
    enabled: !!userId && !isWebSocketConnected,
    staleTime: Infinity,
    refetchInterval: !isWebSocketConnected ? 30000 : false,
  });
```

#### 3.1.2 Mutations
**Mark as Read:**
```javascript
const markAsRead = useMutation({
  mutationFn: ({ notificationId }) => notificationsCommandApi.markAsRead(notificationId),
  onSuccess: () => {
    queryClient.invalidateQueries([QUERY_KEYS.NOTIFICATIONS, userId]);
    queryClient.invalidateQueries([QUERY_KEYS.NOTIFICATIONS_UNREAD_COUNT, userId]);
  },
});
```

**Mark All as Read:**
```javascript
const markAllAsReadMutation = useMutation({
  mutationFn: () => notificationsCommandApi.markAllAsRead(userId),
  onSuccess: () => {
    // Update cache directly for immediate UI update
    queryClient.setQueryData([QUERY_KEYS.NOTIFICATIONS, userId], (oldData) => {
      if (!oldData) return oldData;
      
      const newPages = oldData.pages.map((page) => ({
        ...page,
        notifications: page.notifications?.map((notification) => ({
          ...notification,
          isRead: true,
        })) || [],
      }));
      
      return { ...oldData, pages: newPages };
    });
    
    queryClient.setQueryData([QUERY_KEYS.NOTIFICATIONS_UNREAD_COUNT, userId], 0);
  },
});
```

**Mark as Read on Modal Close:**
```javascript
const markAsReadOnModalClose = useMutation({
  mutationFn: () => notificationsCommandApi.markAsReadOnModalClose(userId),
  onSuccess: () => {
    queryClient.invalidateQueries([QUERY_KEYS.NOTIFICATIONS, userId]);
    queryClient.invalidateQueries([QUERY_KEYS.NOTIFICATIONS_UNREAD_COUNT, userId]);
  },
});
```

#### 3.1.3 WebSocket Integration
**Connection Setup:**
```javascript
const setupWebSocket = useCallback(async () => {
  if (!userId) return;
  
  try {
    const token = getCookie(COOKIE_KEYS.AUTH_TOKEN);
    if (!token) {
      setWebSocketError('Authentication token missing');
      return;
    }
    
    // Test API connectivity first
    const testResponse = await fetch(`${apiUrl}/actuator/health`, { 
      method: 'GET',
      signal: controller.signal
    });
    
    if (!testResponse.ok) {
      setWebSocketError('Backend service unavailable');
      return;
    }
    
    // Create WebSocket connection with multiple transport fallbacks
    const wsUrl = `${apiUrl}/ws?token=${encodeURIComponent(token)}`;
    const transportMethods = [
      ['websocket'],
      ['xhr-streaming'],
      ['xhr-polling'],
      ['websocket', 'xhr-streaming', 'xhr-polling']
    ];
    
    // Try different transport methods
    for (const transports of transportMethods) {
      try {
        socket = new SockJS(wsUrl, null, {
          transports: transports,
          timeout: 10000,
        });
        // ... connection logic
      } catch (error) {
        // Try next transport method
      }
    }
  } catch (error) {
    setWebSocketError('WebSocket setup failed');
  }
}, [userId]);
```

**Message Handling:**
```javascript
const handleWebSocketMessage = useCallback((message) => {
  try {
    if (!message || !message.body) return;
    
    const parsed = JSON.parse(message.body);
    
    // Validate message
    if (!parsed || typeof parsed !== 'object') return;
    
    // Send acknowledgment back to backend
    if (stompClientRef.current && stompClientRef.current.connected) {
      stompClientRef.current.publish({
        destination: '/app/notifications/received',
        body: JSON.stringify({ 
          notificationId: parsed.id, 
          userId, 
          timestamp: new Date().toISOString() 
        })
      });
    }
    
    // Add to batch for processing
    messageBatchRef.current.push(parsed);
    clearTimeout(batchTimeoutRef.current);
    batchTimeoutRef.current = setTimeout(processBatch, BATCH_DELAY);
    
  } catch (err) {
    console.error('Failed to parse WebSocket message:', err);
  }
}, [userId]);
```

#### 3.1.4 Batch Processing
**Batch Processing Logic:**
```javascript
const processBatch = useCallback(() => {
  try {
    if (messageBatchRef.current.length === 0) return;
    
    const batch = [...messageBatchRef.current];
    messageBatchRef.current = [];
    
    if (!isModalOpen) {
      updateNotificationsCache(batch);
      updateUnreadCount(batch.length);
      showDesktopNotifications(batch);
    }
  } catch (error) {
    console.error('Failed to process notification batch:', error);
  }
}, [isModalOpen, updateNotificationsCache, updateUnreadCount, showDesktopNotifications]);
```

**Cache Update:**
```javascript
const updateNotificationsCache = useCallback((batch) => {
  try {
    queryClient.setQueryData([QUERY_KEYS.NOTIFICATIONS, userId], (oldData) => {
      if (!oldData) return oldData;
      
      const newPages = [...oldData.pages];
      
      batch.forEach((parsed) => {
        if (parsed.isRead === undefined) {
          parsed.isRead = false;
        }
        updateOrAddNotification(newPages, parsed);
      });
      
      return { ...oldData, pages: newPages };
    });
  } catch (error) {
    console.error('Failed to update notifications cache:', error);
  }
}, [queryClient, userId, updateOrAddNotification]);
```

#### 3.1.5 Reconnection Logic
**Exponential Backoff:**
```javascript
useEffect(() => {
  if (!isWebSocketConnected && userId && !webSocketError) {
    const reconnectDelay = Math.min(5000 * Math.pow(2, reconnectAttempts), 30000);
    
    const reconnectTimer = setTimeout(() => {
      setReconnectAttempts(prev => prev + 1);
      setupWebSocket();
    }, reconnectDelay);
    
    return () => clearTimeout(reconnectTimer);
  } else if (isWebSocketConnected) {
    setReconnectAttempts(0);
  }
}, [isWebSocketConnected, userId, webSocketError, setupWebSocket, reconnectAttempts]);
```

#### 3.1.6 Notification Click Handling
**Smart Navigation:**
```javascript
const handleNotificationClick = useCallback((notification) => {
  if (!notification) return;
  
  switch (notification.type?.toLowerCase()) {
    case 'follow':
      if (notification.sender?.id) {
        router.push(`/profile/${notification.sender.id}`);
      }
      break;
    case 'like':
    case 'comment':
      let postId = null;
      
      if (notification.data?.postId) {
        postId = notification.data.postId;
      } else if (notification.link) {
        const match = notification.link.match(/\/posts\/([^\/]+)/);
        if (match) {
          postId = match[1];
        }
      } else if (notification.postId) {
        postId = notification.postId;
      }
      
      if (postId) {
        router.push(`/posts/${postId}`);
      }
      break;
    default:
      if (notification.link) {
        router.push(notification.link);
      }
      break;
  }
}, [router]);
```

#### 3.1.7 Return Values
```javascript
return {
  notifications,                    // Array of notifications
  unreadCount,                     // Number of unread notifications
  isLoading,                       // Loading state
  error,                          // Error state
  hasNextPage,                    // Pagination info
  isFetchingNextPage,             // Next page loading state
  markAsRead,                     // Mark single notification as read
  markAllAsRead,                  // Mark all notifications as read
  markAllAsReadSilently,          // Silent mark all as read
  markAsReadOnModalClose,         // Mark as read when modal closes
  deleteNotification,              // Delete notification
  handleNotificationClick,         // Handle notification clicks
  fetchNextPage,                  // Load next page
  refetch,                        // Refetch data
  setModalOpen,                   // Control modal state
  isWebSocketConnected,           // WebSocket connection status
  webSocketError,                 // WebSocket error state
  safeData,                       // Safe data access
};
```

**Đặc điểm kỹ thuật:**
- **Hybrid Approach:** Kết hợp REST API và WebSocket
- **Smart Caching:** Optimistic updates và cache invalidation
- **Batch Processing:** Xử lý notifications theo batch để tối ưu performance
- **Fallback Strategy:** Polling khi WebSocket không khả dụng
- **Error Handling:** Comprehensive error handling với retry logic
- **Performance Optimization:** Debounced updates và efficient cache management

### 3.2 useDesktopNotifications Hook (use-desktop-notifications.jsx)
**Đường dẫn:** `unify-frontend/src/hooks/use-desktop-notifications.jsx`

**Mô tả:** Custom React hook xử lý desktop notifications, bao gồm permission management, notification display, và type-specific notification handling.

**State Management:**
```javascript
const [permission, setPermission] = useState('default');    // Notification permission status
const [isSupported, setIsSupported] = useState(false);     // Browser support check
```

#### 3.2.1 Browser Support Detection
**Check Support:**
```javascript
useEffect(() => {
  setIsSupported('Notification' in window);
  
  if ('Notification' in window) {
    setPermission(Notification.permission);
  }
}, []);
```

#### 3.2.2 Permission Management
**Request Permission:**
```javascript
const requestPermission = useCallback(async () => {
  if (!isSupported) {
    return false;
  }

  try {
    const result = await Notification.requestPermission();
    setPermission(result);
    return result === 'granted';
  } catch (error) {
    console.error('Failed to request notification permission:', error);
    return false;
  }
}, [isSupported]);
```

#### 3.2.3 Core Notification Display
**Show Notification:**
```javascript
const showNotification = useCallback(({ title, body, icon, tag, data, onClick }) => {
  if (!isSupported || permission !== 'granted') {
    return null;
  }

  try {
    const notification = new Notification(title, {
      body,
      icon: icon || '/favicon.ico',
      tag: tag || 'unify-notification',
      data,
      requireInteraction: false,
      silent: false,
    });

    // Handle notification click
    if (onClick) {
      notification.onclick = (event) => {
        event.preventDefault();
        onClick(notification, event);
        
        // Focus the window if it's not focused
        if (window.focus) {
          window.focus();
        }
        
        notification.close();
      };
    }

    // Auto close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);

    return notification;
  } catch (error) {
    console.error('Failed to show desktop notification:', error);
    return null;
  }
}, [isSupported, permission]);
```

#### 3.2.4 Type-Specific Notifications
**Follow Notification:**
```javascript
const showFollowNotification = useCallback((senderName) => {
  return showNotification({
    title: 'New Follower',
    body: `${senderName} started following you`,
    icon: '/images/avatar.png',
    tag: 'follow-notification',
    onClick: () => {
      if (typeof window !== 'undefined') {
        window.location.href = '/notifications';
      }
    },
  });
}, [showNotification]);
```

**Like Notification:**
```javascript
const showLikeNotification = useCallback((senderName, postTitle) => {
  return showNotification({
    title: 'New Like',
    body: `${senderName} liked your post${postTitle ? `: ${postTitle}` : ''}`,
    icon: '/images/heart-icon.png',
    tag: 'like-notification',
    onClick: () => {
      if (typeof window !== 'undefined') {
        window.location.href = '/notifications';
      }
    },
  });
}, [showNotification]);
```

**Comment Notification:**
```javascript
const showCommentNotification = useCallback((senderName, postTitle) => {
  return showNotification({
    title: 'New Comment',
    body: `${senderName} commented on your post${postTitle ? `: ${postTitle}` : ''}`,
    icon: '/images/comment-icon.png',
    tag: 'comment-notification',
    onClick: () => {
      if (typeof window !== 'undefined') {
        window.location.href = '/notifications';
      }
    },
  });
}, [showNotification]);
```

**Tag Notification:**
```javascript
const showTagNotification = useCallback((senderName, postTitle) => {
  return showNotification({
    title: 'You were tagged',
    body: `${senderName} tagged you in a post${postTitle ? `: ${postTitle}` : ''}`,
    icon: '/images/tag-icon.png',
    tag: 'tag-notification',
    onClick: () => {
      if (typeof window !== 'undefined') {
        window.location.href = '/notifications';
      }
    },
  });
}, [showNotification]);
```

#### 3.2.5 Settings Management
**Check Notification Settings:**
```javascript
const isNotificationsEnabled = useCallback(() => {
  if (typeof window === 'undefined') return false;
  
  try {
    const settings = localStorage.getItem('notificationSettings');
    if (settings) {
      const parsed = JSON.parse(settings);
      return parsed.pushNotifications !== false; // Default to true
    }
    return true; // Default to enabled
  } catch (error) {
    console.warn('Failed to parse notification settings:', error);
    return true;
  }
}, []);
```

#### 3.2.6 Smart Notification Routing
**Show Notification by Type:**
```javascript
const showNotificationByType = useCallback((notification) => {
  if (!isNotificationsEnabled()) {
    return null;
  }

  const senderName = notification.sender?.name || notification.sender?.username || 'Someone';
  const postTitle = notification.message || '';

  switch (notification.type?.toLowerCase()) {
    case 'follow':
      return showFollowNotification(senderName);
    case 'like':
      return showLikeNotification(senderName, postTitle);
    case 'comment':
      return showCommentNotification(senderName, postTitle);
    case 'tag':
      return showTagNotification(senderName, postTitle);
    default:
      return showNotification({
        title: 'New Notification',
        body: notification.message || 'You have a new notification',
        onClick: () => {
          if (typeof window !== 'undefined') {
            window.location.href = '/notifications';
          }
        },
      });
  }
}, [isNotificationsEnabled, showFollowNotification, showLikeNotification, showCommentNotification, showTagNotification, showNotification]);
```

#### 3.2.7 Return Values
```javascript
return {
  // State
  permission,                    // Current permission status
  isSupported,                   // Browser support status
  
  // Actions
  requestPermission,             // Request notification permission
  showNotification,              // Show generic notification
  showNotificationByType,        // Show notification based on type
  
  // Convenience methods
  showFollowNotification,        // Show follow notification
  showLikeNotification,          // Show like notification
  showCommentNotification,       // Show comment notification
  showTagNotification,           // Show tag notification
  
  // Utilities
  isNotificationsEnabled,        // Check if notifications are enabled
};
```

**Đặc điểm kỹ thuật:**
- **Browser API Integration:** Sử dụng Web Notifications API
- **Permission Management:** Automatic permission detection và request
- **Type-Specific Handling:** Customized notifications cho từng loại
- **Click Handling:** Navigation khi click vào notification
- **Auto-close:** Tự động đóng sau 5 giây
- **Settings Integration:** Kiểm tra user preferences từ localStorage
- **Fallback Support:** Graceful degradation khi không hỗ trợ

---
## PHẦN 4: FRONTEND - COMPONENTS

### 4.1 NotificationGroup Component (notification-group.jsx)
**Đường dẫn:** `unify-frontend/src/components/base/notification-group/notification-group.jsx`

**Mô tả:** Component chính render danh sách notifications với dynamic component mapping dựa trên notification type.

**Dependencies:**
- `FollowNotification`: Component cho follow notifications
- `LikeNotification`: Component cho like notifications
- `CommentNotification`: Component cho comment notifications
- `TagNotification`: Component cho tag notifications
- `ReportApprovedNotification`: Component cho report approved notifications
- `AccountSuspendedNotification`: Component cho account suspended notifications
- `AccountBannedNotification`: Component cho account banned notifications
- `PostReportNotification`: Component cho post report notifications
- `CommentReportNotification`: Component cho comment report notifications
- `UserReportNotification`: Component cho user report notifications

#### 4.1.1 Component Mapping
**Dynamic Component Registry:**
```javascript
const notificationComponents = useMemo(() => ({
  follow: FollowNotification,
  like: LikeNotification,
  comment: CommentNotification,
  tag: TagNotification,
  report_approved: ReportApprovedNotification,
  account_suspended: AccountSuspendedNotification,
  account_banned: AccountBannedNotification,
  post_report: PostReportNotification,
  comment_report: CommentReportNotification,
  user_report: UserReportNotification,
}), []);
```

#### 4.1.2 Notification Rendering Logic
**Smart Rendering:**
```javascript
const renderNotification = useMemo(() => (notification) => {
  if (!isValidNotification(notification)) return null;

  const type = notification.type.toLowerCase();
  const Component = notificationComponents[type];
  
  if (!Component) return null;

  // Special case for TagNotification (different props)
  if (type === 'tag') {
    return <Component key={notification.id} isSeen={notification.isRead === true} />;
  }

  return <Component key={notification.id} {...getNotificationProps(notification, onNotificationClick)} />;
}, [notificationComponents, onNotificationClick]);
```

#### 4.1.3 Empty State Handling
**Empty State Component:**
```javascript
const EmptyState = useMemo(() => (
  <div className="flex flex-col items-center justify-center py-8">
    <i className="fa-solid fa-bell text-4xl text-gray-300 dark:text-gray-600 mb-4"></i>
    <p className="text-center text-gray-400 dark:text-gray-600">
      No notifications yet
    </p>
    <p className="text-center text-sm text-gray-300 dark:text-gray-700 mt-2">
      When you get notifications, they&apos;ll show up here
    </p>
  </div>
), []);

// Early return for empty state
if (!Array.isArray(notifications) || notifications.length === 0) {
  return EmptyState;
}
```

#### 4.1.4 Main Render
**Component Structure:**
```javascript
return (
  <div className="space-y-2">
    {notifications.map(renderNotification)}
  </div>
);
```

**Props:**
- `notifications`: Array of notification objects
- `onNotificationClick`: Callback function for notification clicks

**Đặc điểm kỹ thuật:**
- **Dynamic Rendering:** Sử dụng component mapping dựa trên notification type
- **Performance Optimization:** Sử dụng useMemo để tối ưu re-renders
- **Type Safety:** Validation thông qua `isValidNotification` utility
- **Special Cases:** Xử lý đặc biệt cho TagNotification với props khác biệt
- **Empty State:** Graceful handling khi không có notifications
- **Responsive Design:** Sử dụng Tailwind CSS với dark mode support

---
## PHẦN 5: TỔNG KẾT VÀ KIẾN TRÚC TỔNG THỂ

### 5.1 Kiến trúc hệ thống
```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│  Components (notification-group.jsx)                           │
│  ├── Dynamic rendering based on notification type              │
│  ├── Empty state handling                                     │
│  └── Responsive design with Tailwind CSS                      │
├─────────────────────────────────────────────────────────────────┤
│  Hooks                                                         │
│  ├── useNotification: Main notification logic                  │
│  │   ├── React Query integration                              │
│  │   ├── WebSocket connection management                      │
│  │   ├── Batch processing                                     │
│  │   └── Cache management                                     │
│  └── useDesktopNotifications: Desktop notification support     │
│      ├── Permission management                                 │
│      ├── Type-specific notifications                          │
│      └── Click handling                                       │
├─────────────────────────────────────────────────────────────────┤
│  API Layer (notifications.command.api.js)                     │
│  ├── REST API endpoints                                       │
│  ├── HTTP client integration                                  │
│  └── Error handling                                           │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│  Controller (NotificationController.java)                      │
│  ├── REST API endpoints                                       │
│  ├── WebSocket message handlers                               │
│  ├── Pagination support                                       │
│  └── Response DTOs                                            │
├─────────────────────────────────────────────────────────────────┤
│  Service (NotificationService.java)                            │
│  ├── Business logic                                           │
│  ├── WebSocket integration                                    │
│  ├── Message generation                                       │
│  ├── Duplicate prevention                                     │
│  └── Retry logic                                              │
├─────────────────────────────────────────────────────────────────┤
│  Repository (NotificationRepository.java)                      │
│  ├── MongoDB integration                                      │
│  ├── Custom query methods                                     │
│  └── Pagination support                                       │
├─────────────────────────────────────────────────────────────────┤
│  Domain Models                                                 │
│  ├── Notification.java: Main entity                           │
│  ├── NotificationDto.java: Data transfer object               │
│  └── NotificationType.java: Enum definitions                  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATABASE LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│  MongoDB Collection: "notification"                            │
│  ├── Document structure                                       │
│  ├── Indexing strategy                                        │
│  └── Data persistence                                         │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Luồng xử lý notification
```
1. EVENT TRIGGER (Follow, Like, Comment, etc.)
   ↓
2. BACKEND SERVICE
   ├── Create notification entity
   ├── Save to MongoDB
   ├── Generate personalized message
   └── Send via WebSocket
   ↓
3. WEBSOCKET DELIVERY
   ├── Real-time message delivery
   ├── Retry logic (3 attempts)
   ├── Exponential backoff
   └── Fallback to database
   ↓
4. FRONTEND RECEPTION
   ├── WebSocket message handling
   ├── Batch processing (100ms delay)
   ├── Cache updates
   └── Desktop notifications
   ↓
5. USER INTERACTION
   ├── Click handling
   ├── Navigation
   ├── Mark as read
   └── State updates
```

### 5.3 Các tính năng chính

#### 5.3.1 Real-time Notifications
- **WebSocket Integration:** STOMP protocol với SockJS fallback
- **Multiple Transport Methods:** WebSocket, XHR-streaming, XHR-polling
- **Connection Management:** Automatic reconnection với exponential backoff
- **Message Acknowledgment:** Two-way communication với backend

#### 5.3.2 Performance Optimization
- **Batch Processing:** Xử lý notifications theo batch để giảm re-renders
- **Smart Caching:** React Query với optimistic updates
- **Lazy Loading:** Infinite scroll với pagination
- **Debounced Updates:** Tránh spam updates

#### 5.3.3 User Experience
- **Desktop Notifications:** Browser API integration
- **Type-specific Handling:** Customized notifications cho từng loại
- **Smart Navigation:** Automatic routing dựa trên notification type
- **Responsive Design:** Mobile-first approach với Tailwind CSS

#### 5.3.4 Reliability & Error Handling
- **Fallback Strategy:** Polling khi WebSocket không khả dụng
- **Retry Logic:** Automatic retry với exponential backoff
- **Graceful Degradation:** Graceful handling khi services unavailable
- **Comprehensive Logging:** Detailed logging cho debugging

### 5.4 Công nghệ sử dụng

#### 5.4.1 Backend
- **Java 17+:** Modern Java features (switch expressions, records)
- **Spring Boot:** Framework chính
- **Spring WebSocket:** STOMP messaging
- **MongoDB:** NoSQL database
- **Lombok:** Code generation
- **SLF4J:** Logging framework

#### 5.4.2 Frontend
- **React 18+:** Modern React features
- **Next.js 14+:** Full-stack framework
- **TanStack Query:** Data fetching và caching
- **STOMP.js:** WebSocket client
- **SockJS:** WebSocket transport layer
- **Tailwind CSS:** Utility-first CSS framework

### 5.5 Best Practices Implemented

#### 5.5.1 Code Quality
- **Type Safety:** Comprehensive validation và error handling
- **Performance:** Optimized rendering với useMemo và useCallback
- **Maintainability:** Clean architecture với separation of concerns
- **Testing:** Error handling cho edge cases

#### 5.5.2 Security
- **Authentication:** Token-based authentication cho WebSocket
- **Validation:** Input validation ở tất cả layers
- **Authorization:** User-specific data access
- **Sanitization:** Safe data handling

#### 5.5.3 Scalability
- **Horizontal Scaling:** Stateless design
- **Database Optimization:** Efficient querying và indexing
- **Caching Strategy:** Multi-layer caching approach
- **Load Balancing:** WebSocket connection distribution

### 5.6 Monitoring & Debugging

#### 5.6.1 Logging Strategy
- **Structured Logging:** Consistent log format
- **Error Tracking:** Comprehensive error logging
- **Performance Metrics:** Response time monitoring
- **User Activity:** User interaction tracking

#### 5.6.2 Health Checks
- **API Health:** `/actuator/health` endpoint
- **WebSocket Status:** Connection state monitoring
- **Database Connectivity:** MongoDB connection status
- **Service Availability:** Backend service health

### 5.7 Future Enhancements

#### 5.7.1 Planned Features
- **Push Notifications:** Mobile push notification support
- **Notification Preferences:** User-customizable settings
- **Advanced Filtering:** Type-based và time-based filtering
- **Analytics Dashboard:** Notification engagement metrics

#### 5.7.2 Technical Improvements
- **GraphQL Integration:** Flexible data querying
- **Redis Caching:** Distributed caching layer
- **Message Queue:** Reliable message delivery
- **Microservices:** Service decomposition

---
## KẾT LUẬN

Hệ thống notification trong dự án Unify là một giải pháp toàn diện, kết hợp cả backend và frontend với các công nghệ hiện đại. Hệ thống được thiết kế với kiến trúc rõ ràng, performance tối ưu, và user experience tuyệt vời.

**Điểm mạnh chính:**
- ✅ **Real-time Delivery:** WebSocket integration với fallback strategy
- ✅ **Performance:** Batch processing và smart caching
- ✅ **Reliability:** Comprehensive error handling và retry logic
- ✅ **User Experience:** Desktop notifications và smart navigation
- ✅ **Scalability:** Stateless design và efficient database queries
- ✅ **Maintainability:** Clean code structure và comprehensive documentation

**Công nghệ sử dụng:**
- Backend: Java Spring Boot với MongoDB
- Frontend: React Next.js với modern hooks
- Communication: WebSocket STOMP với SockJS fallback
- State Management: TanStack Query cho data fetching

Hệ thống này có thể dễ dàng mở rộng và tích hợp với các tính năng mới, đồng thời duy trì hiệu suất cao và độ tin cậy tốt trong môi trường production.

---
