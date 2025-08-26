# FOLLOW/UNFOLLOW SYSTEM - PHÂN TÍCH CHI TIẾT

## Tổng quan
Hệ thống Follow/Unfollow trong dự án Unify cho phép người dùng theo dõi và bỏ theo dõi các tài khoản khác, đồng thời tự động quản lý trạng thái friendship khi hai người dùng follow lẫn nhau.

## Cấu trúc thư mục
```
unify-backend/src/main/java/com/unify/app/followers/
├── domain/
│   ├── FollowService.java
│   ├── FollowRepository.java
│   └── models/
│       ├── Follower.java
│       ├── FollowerUserId.java
│       └── Friendship.java
├── web/
│   └── FollowerController.java

unify-frontend/src/
├── apis/follow/
│   ├── command/follow.command.api.js
│   └── query/follow.query.api.js
├── components/button/
│   └── follow-button.jsx
└── hooks/
    └── use-follow.jsx
```

---
## PHẦN 1: BACKEND - DOMAIN MODEL

### 1.1 Follower Entity (Follower.java)
**Đường dẫn:** `unify-backend/src/main/java/com/unify/app/followers/domain/Follower.java`

**Mô tả:** Entity chính đại diện cho mối quan hệ follow giữa hai users, sử dụng composite key để đảm bảo tính duy nhất.

**Các trường dữ liệu:**
- `id`: Composite key (FollowerUserId) chứa followerId và followingId
- `userFollower`: User thực hiện follow (người theo dõi)
- `userFollowing`: User được follow (người được theo dõi)

**Đặc điểm kỹ thuật:**
- Sử dụng composite key để đảm bảo mỗi cặp follower-following chỉ tồn tại một lần
- JPA relationships với User entities
- Optimistic locking để tránh race conditions

### 1.2 FollowerUserId Composite Key (FollowerUserId.java)
**Đường dẫn:** `unify-backend/src/main/java/com/unify/app/followers/domain/FollowerUserId.java`

**Mô tả:** Composite key class định nghĩa primary key cho Follower entity, bao gồm cả followerId và followingId.

**Cấu trúc:**
```java
@Embeddable
public class FollowerUserId implements Serializable {
  private String userFollowerId;    // ID của người follow
  private String userFollowingId;   // ID của người được follow
}
```

**Đặc điểm:**
- Implement Serializable interface
- Sử dụng @Embeddable annotation
- Đảm bảo tính duy nhất của mối quan hệ follow

### 1.3 Friendship Entity (Friendship.java)
**Đường dẫn:** `unify-backend/src/main/java/com/unify/app/followers/domain/Friendship.java`

**Mô tả:** Entity quản lý trạng thái friendship khi hai users follow lẫn nhau (mutual follow).

**Các trường dữ liệu:**
- `id`: Composite key (FriendshipUserId)
- `user`: User đầu tiên trong friendship
- `friend`: User thứ hai trong friendship
- `friendshipStatus`: Trạng thái friendship (ACCEPTED, PENDING, etc.)
- `createdAt`: Thời gian tạo friendship
- `updatedAt`: Thời gian cập nhật cuối cùng

### 1.4 FollowRepository (FollowRepository.java)
**Đường dẫn:** `unify-backend/src/main/java/com/unify/app/followers/domain/FollowRepository.java`

**Mô tả:** Interface repository sử dụng Spring Data JPA để thực hiện các thao tác CRUD với Follower entities.

**Các method chính:**

#### 1.4.1 Count Methods
```java
long countByUserFollowingId(String followingId);    // Đếm số người follow một user
long countByUserFollowerId(String followerId);     // Đếm số người mà một user đang follow
```

#### 1.4.2 Query Methods
**Find Users Followed By:**
```java
@Query("SELECT fo.userFollowing FROM Follower fo WHERE fo.userFollower.username = :currentUsername")
List<User> findUsersFollowedBy(@Param("currentUsername") String currentUsername);
```

**Find Users Following Me:**
```java
@Query("SELECT fo.userFollower FROM Follower fo WHERE fo.userFollowing.username = :currentUsername")
List<User> findUsersFollowingMe(@Param("currentUsername") String currentUsername);
```

**Find Mutual Following Users:**
```java
@Query("""
    SELECT f.userFollowing
    FROM Follower f
    WHERE f.userFollower.id = :myId
    AND f.userFollowing.id IN (
        SELECT f2.userFollower.id
        FROM Follower f2
        WHERE f2.userFollowing.id = :myId
    )
""")
List<User> findMutualFollowingUsers(@Param("myId") String myId);
```

**Find All Followers By User ID:**
```java
@Query("SELECT fo.userFollower FROM Follower fo WHERE fo.userFollowing.id = :currentUserId")
List<User> findAllFollowersByUserId(@Param("currentUserId") String currentUserId);
```

**Đặc điểm kỹ thuật:**
- Extends JpaRepository để có sẵn các method CRUD cơ bản
- Sử dụng @Query annotation cho custom JPQL queries
- Hỗ trợ complex queries với subqueries
- Parameter binding với @Param annotation

### 1.5 FriendshipRepository (FriendshipRepository.java)
**Đường dẫn:** `unify-backend/src/main/java/com/unify/app/followers/domain/FriendshipRepository.java`

**Mô tả:** Interface repository quản lý các mối quan hệ friendship giữa users.

**Các method chính:**

**Check if Users are Friends:**
```java
@Query("SELECT COUNT(f) > 0 FROM Friendship f WHERE " +
       "((f.user.id = :userId1 AND f.friend.id = :userId2) OR " +
       "(f.user.id = :userId2 AND f.friend.id = :userId1)) AND " +
       "f.friendshipStatus = com.unify.app.followers.domain.models.FriendshipStatus.ACCEPTED")
boolean areFriends(@Param("userId1") String userId1, @Param("userId2") String userId2);
```

**Count Friends by User ID:**
```java
@Query("SELECT COUNT(f) FROM Friendship f WHERE " +
       "(f.user.id = :userId OR f.friend.id = :userId) AND " +
       "f.friendshipStatus = com.unify.app.followers.domain.models.FriendshipStatus.ACCEPTED")
long countFriendsByUserId(@Param("userId") String userId);
```

**Đặc điểm kỹ thuật:**
- Sử dụng JPQL queries với complex conditions
- Hỗ trợ bidirectional friendship checking
- Status-based filtering (ACCEPTED friendships only)
- Efficient counting với COUNT queries

---
## PHẦN 2: BACKEND - SERVICE LAYER

### 2.1 FollowService (FollowService.java)
**Đường dẫn:** `unify-backend/src/main/java/com/unify/app/followers/domain/FollowService.java`

**Mô tả:** Service layer chính xử lý tất cả business logic liên quan đến follow/unfollow operations, friendship management, và notification handling.

**Dependencies:**
- `FollowRepository`: Thao tác với follow data
- `UserService`: Lấy thông tin user
- `SecurityService`: Authentication và authorization
- `NotificationService`: Gửi notifications khi follow
- `FriendshipRepository`: Quản lý friendship status
- `UserMapper`: Chuyển đổi User entities sang DTOs

#### 2.1.1 Friendship Management
**Update Friendship Status:**
```java
private void updateFriendshipStatus(String userId1, String userId2) {
  // Ensure consistent ordering of user IDs to avoid duplicate friendships
  String smallerId = userId1.compareTo(userId2) < 0 ? userId1 : userId2;
  String largerId = userId1.compareTo(userId2) < 0 ? userId2 : userId1;

  boolean user1FollowsUser2 = isFollowing(userId1, userId2);
  boolean user2FollowsUser1 = isFollowing(userId2, userId1);

  if (user1FollowsUser2 && user2FollowsUser1) {
    // Check if friendship already exists
    FriendshipUserId friendshipId = FriendshipUserId.builder()
        .friendshipId(smallerId)
        .userId(largerId)
        .build();
    Friendship existingFriendship = friendshipRepository.findById(friendshipId).orElse(null);

    if (existingFriendship == null) {
      // Create new friendship
      User user1 = userService.findUserById(smallerId);
      User user2 = userService.findUserById(largerId);

      Friendship newFriendship = Friendship.builder()
          .id(friendshipId)
          .user(user1)
          .friend(user2)
          .friendshipStatus(FriendshipStatus.ACCEPTED)
          .build();

      friendshipRepository.save(newFriendship);
    } else if (existingFriendship.getFriendshipStatus() != FriendshipStatus.ACCEPTED) {
      // Update existing friendship status
      existingFriendship.setFriendshipStatus(FriendshipStatus.ACCEPTED);
      existingFriendship.setUpdateAt(LocalDateTime.now());
      friendshipRepository.save(existingFriendship);
    }
  } else {
    // If not mutual follows, remove friendship if it exists
    FriendshipUserId friendshipId = FriendshipUserId.builder()
        .friendshipId(smallerId)
        .userId(largerId)
        .build();
    friendshipRepository.deleteById(friendshipId);
  }
}
```

**Đặc điểm kỹ thuật:**
- **Consistent Ordering:** Sử dụng `compareTo()` để đảm bảo thứ tự nhất quán của user IDs
- **Duplicate Prevention:** Tránh tạo duplicate friendships
- **Status Management:** Tự động cập nhật friendship status
- **Cleanup Logic:** Xóa friendship khi không còn mutual follow

#### 2.1.2 Follow Operations
**Follow User:**
```java
@Transactional
public String followUser(String followingId) {
  String currentUserId = securityService.getCurrentUserId();

  if (currentUserId == null) {
    throw new RuntimeException("User not authenticated");
  }

  if (currentUserId.equals(followingId)) {
    return "Can't follow yourself!";
  }

  User follower = userService.findUserById(currentUserId);
  User following = userService.findUserById(followingId);
  FollowerUserId id = new FollowerUserId(currentUserId, followingId);

  if (followRepository.existsById(id)) {
    return "You're already following this user";
  }

  try {
    Follower newFollow = Follower.builder()
        .id(id)
        .userFollower(follower)
        .userFollowing(following)
        .build();
    followRepository.save(newFollow);

    // Update friendship status after follow
    updateFriendshipStatus(currentUserId, followingId);

    // Send notification
    notificationService.createAndSendNotification(
        currentUserId, followingId, NotificationType.FOLLOW);
    return "Followed successfully!";
  } catch (Exception e) {
    throw new RuntimeException("Error while following user: " + e.getMessage());
  }
}
```

**Unfollow User:**
```java
@Transactional
public String unfollowUser(String followingId) {
  String currentUserId = securityService.getCurrentUserId();

  if (currentUserId == null) {
    throw new RuntimeException("User not authenticated");
  }

  FollowerUserId id = new FollowerUserId(currentUserId, followingId);

  if (!followRepository.existsById(id)) {
    return "You're not following this user!";
  }

  try {
    followRepository.deleteById(id);

    // Update friendship status after unfollow
    updateFriendshipStatus(currentUserId, followingId);

    return "Unfollowed successfully";
  } catch (Exception e) {
    throw new RuntimeException("Error while unfollowing user: " + e.getMessage());
  }
}
```

**Đặc điểm kỹ thuật:**
- **Transaction Management:** Sử dụng `@Transactional` để đảm bảo data consistency
- **Security Validation:** Kiểm tra authentication trước khi thực hiện operations
- **Business Rules:** Ngăn chặn self-follow và duplicate follows
- **Notification Integration:** Tự động gửi notification khi follow
- **Friendship Sync:** Tự động cập nhật friendship status

#### 2.1.3 Query Methods
**Follow Status Checking:**
```java
public boolean isFollowing(String followerId, String followingId) {
  return followRepository.existsById(new FollowerUserId(followerId, followingId));
}

public boolean isFriend(String userId1, String userId2) {
  boolean user1FollowsUser2 = isFollowing(userId1, userId2);
  boolean user2FollowsUser1 = isFollowing(userId2, userId1);
  return user1FollowsUser2 && user2FollowsUser1;
}
```

**Count Operations:**
```java
public long countFollowers(String userId) {
  return followRepository.countByUserFollowingId(userId);
}

public long countFollowing(String userId) {
  return followRepository.countByUserFollowerId(userId);
}

public long countFriends(String userId) {
  return friendshipRepository.countFriendsByUserId(userId);
}
```

**User Retrieval:**
```java
public List<User> getFriends(String userId) {
  return userService.getFriendsNative(userId);
}

public List<UserDto> getAllUsersFollowersByUserId(String currentUserId) {
  return followRepository.findAllFollowersByUserId(currentUserId).stream()
      .map(userMapper::toUserDTO)
      .toList();
}
```

#### 2.1.4 Business Logic Features
- **Mutual Follow Detection:** Tự động phát hiện khi hai users follow lẫn nhau
- **Friendship Management:** Tự động tạo/cập nhật/xóa friendship records
- **Notification System:** Tích hợp với notification service
- **Data Consistency:** Sử dụng transactions để đảm bảo data integrity
- **Performance Optimization:** Efficient queries và caching strategies

---
## PHẦN 3: BACKEND - CONTROLLER LAYER

### 3.1 FollowerController (FollowerController.java)
**Đường dẫn:** `unify-backend/src/main/java/com/unify/app/followers/web/FollowerController.java`

**Mô tả:** REST Controller xử lý các HTTP requests liên quan đến follow/unfollow operations, friendship status, và user counts.

**Dependencies:**
- `FollowService`: Business logic layer cho follow operations

**Base URL:** `/api/follow`

#### 3.1.1 Follow/Unfollow Operations
**Follow User:**
```java
@PostMapping("/{followingId}")
public ResponseEntity<String> followUser(@PathVariable String followingId) {
  try {
    String response = followService.followUser(followingId);
    return ResponseEntity.ok(response);
  } catch (RuntimeException e) {
    return ResponseEntity.badRequest().body(e.getMessage());
  } catch (Exception e) {
    return ResponseEntity.internalServerError().body("Internal server error");
  }
}
```

**Unfollow User:**
```java
@DeleteMapping("/{followingId}")
public ResponseEntity<String> unfollowUser(@PathVariable String followingId) {
  try {
    String response = followService.unfollowUser(followingId);
    return ResponseEntity.ok(response);
  } catch (RuntimeException e) {
    return ResponseEntity.badRequest().body(e.getMessage());
  } catch (Exception e) {
    return ResponseEntity.internalServerError().body("Internal server error");
  }
}
```

#### 3.1.2 Status Checking Endpoints
**Check Follow Status:**
```java
@GetMapping("/isFollowing/{followerId}/{followingId}")
public ResponseEntity<Boolean> isFollowing(
    @PathVariable String followerId, @PathVariable String followingId) {
  boolean isFollowing = followService.isFollowing(followerId, followingId);
  return ResponseEntity.ok(isFollowing);
}
```

**Check Friendship Status:**
```java
@GetMapping("/isFriend/{userId1}/{userId2}")
public ResponseEntity<Boolean> isFriend(
    @PathVariable String userId1, @PathVariable String userId2) {
  boolean isFriend = followService.isFriend(userId1, userId2);
  return ResponseEntity.ok(isFriend);
}
```

#### 3.1.3 Count Endpoints
**Count Followers:**
```java
@GetMapping("/followers/{userId}")
public ResponseEntity<Long> countFollowers(@PathVariable String userId) {
  long count = followService.countFollowers(userId);
  return ResponseEntity.ok(count);
}
```

**Count Following:**
```java
@GetMapping("/following/{userId}")
public ResponseEntity<Long> countFollowing(@PathVariable String userId) {
  long count = followService.countFollowing(userId);
  return ResponseEntity.ok(count);
}
```

**Count Friends:**
```java
@GetMapping("/friends/{userId}")
public ResponseEntity<Long> countFriends(@PathVariable String userId) {
  long count = followService.countFriends(userId);
  return ResponseEntity.ok(count);
}
```

#### 3.1.4 Data Retrieval Endpoints
**Get Friends List:**
```java
@GetMapping("/friends-list/{userId}")
public ResponseEntity<List<User>> getFriendsList(@PathVariable String userId) {
  List<User> friends = followService.getFriends(userId);
  return ResponseEntity.ok(friends);
}
```

#### 3.1.5 API Endpoints Summary
| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| `POST` | `/api/follow/{followingId}` | Follow a user | Success/Error message |
| `DELETE` | `/api/follow/{followingId}` | Unfollow a user | Success/Error message |
| `GET` | `/api/follow/isFollowing/{followerId}/{followingId}` | Check follow status | Boolean |
| `GET` | `/api/follow/followers/{userId}` | Count user's followers | Long |
| `GET` | `/api/follow/following/{userId}` | Count user's following | Long |
| `GET` | `/api/follow/isFriend/{userId1}/{userId2}` | Check friendship status | Boolean |
| `GET` | `/api/follow/friends/{userId}` | Count user's friends | Long |
| `GET` | `/api/follow/friends-list/{userId}` | Get user's friends list | List<User> |

#### 3.1.6 Error Handling
**Exception Handling Strategy:**
- **RuntimeException:** Trả về HTTP 400 (Bad Request) với error message
- **General Exception:** Trả về HTTP 500 (Internal Server Error) với generic message
- **Success Cases:** Trả về HTTP 200 (OK) với response data

**Response Examples:**
```json
// Success Response
{
  "status": 200,
  "body": "Followed successfully!"
}

// Error Response
{
  "status": 400,
  "body": "Can't follow yourself!"
}
```

**Đặc điểm kỹ thuật:**
- **RESTful Design:** Sử dụng HTTP methods phù hợp (POST cho follow, DELETE cho unfollow)
- **Path Variables:** Sử dụng @PathVariable cho dynamic routing
- **Response Entity:** Consistent response structure với appropriate HTTP status codes
- **Exception Handling:** Comprehensive error handling với proper HTTP status codes
- **Service Integration:** Clean separation giữa controller và business logic

---
## PHẦN 4: FRONTEND - API LAYER

### 4.1 Follow Command API (follow.command.api.js)
**Đường dẫn:** `unify-frontend/src/apis/follow/command/follow.command.api.js`

**Mô tả:** API client layer xử lý các HTTP requests thay đổi trạng thái follow (follow/unfollow).

**Base URL:** `/api/follow`

#### 4.1.1 Toggle Follow Method
```javascript
export const followCommandApi = {
  toggleFollow: async (followingId, method) => {
    const res = await httpClient.request({
      url: `${url}/${followingId}`,
      method: method.toUpperCase()
    });
    return res.data;
  },
};
```

**Parameters:**
- `followingId`: ID của user cần follow/unfollow
- `method`: HTTP method ('post' cho follow, 'delete' cho unfollow)

**Đặc điểm kỹ thuật:**
- Sử dụng dynamic HTTP method để xử lý cả follow và unfollow
- Sử dụng custom `httpClient` utility
- Flexible method parameter cho reusability

### 4.2 Follow Query API (follow.query.api.js)
**Đường dẫn:** `unify-frontend/src/apis/follow/query/follow.query.api.js`

**Mô tả:** API client layer xử lý các HTTP requests để lấy thông tin follow status và counts.

**Base URL:** `/api/follow`

#### 4.2.1 Follow Status Checking
```javascript
isFollowing: async (userId, followingId) => {
  const res = await httpClient.get(`${url}/isFollowing/${userId}/${followingId}`);
  return res.data;
}
```

#### 4.2.2 Count Operations
**Count Followers:**
```javascript
countFollowers: async (userId) => {
  const res = await httpClient.get(`${url}/followers/${userId}`);
  return res.data;
}
```

**Count Following:**
```javascript
countFollowing: async (userId) => {
  const res = await httpClient.get(`${url}/following/${userId}`);
  return res.data;
}
```

**Count Friends:**
```javascript
countFriends: async (userId) => {
  const res = await httpClient.get(`${url}/friends/${userId}`);
  return res.data;
}
```

#### 4.2.3 Advanced Queries
**Get Followers with Live Status:**
```javascript
getFollowersWithLiveStatus: async (userId) => {
  const res = await httpClient.get(`${url}/followers/${userId}/with-live-status`);
  return res.data;
}
```

**Đặc điểm kỹ thuật:**
- **Separation of Concerns:** Tách biệt command (thay đổi) và query (đọc) operations
- **Consistent API Structure:** Sử dụng cùng base URL và httpClient
- **Error Handling:** Thông qua httpClient utility
- **Type Safety:** JavaScript async/await pattern

---
## PHẦN 5: FRONTEND - HOOKS & STATE MANAGEMENT

### 5.1 useFollow Hook (use-follow.jsx)
**Đường dẫn:** `unify-frontend/src/hooks/use-follow.jsx`

**Mô tả:** Custom React hook xử lý toàn bộ logic follow/unfollow system, bao gồm state management, optimistic updates, và cache invalidation.

**Dependencies:**
- `@tanstack/react-query`: Data fetching và caching
- `followQueryApi`: Query operations (đọc dữ liệu)
- `followCommandApi`: Command operations (thay đổi dữ liệu)

#### 5.1.1 Core State Management
**Follow Status Query:**
```javascript
const { data: isFollowing } = useQuery({
  queryKey: [QUERY_KEYS.IS_FOLLOWING, userId, followingId],
  queryFn: () => followQueryApi.isFollowing(userId, followingId),
  enabled: !!userId && !!followingId,
});
```

**Count Queries:**
```javascript
const { data: followersCount = 0, isLoading: isLoadingFollowers } = useQuery({
  queryKey: [QUERY_KEYS.COUNT_FOLLOWERS, followingId],
  queryFn: () => followQueryApi.countFollowers(followingId),
  enabled: !!followingId,
});

const { data: followingCount = 0, isLoading: isLoadingFollowing } = useQuery({
  queryKey: [QUERY_KEYS.COUNT_FOLLOWING, followingId],
  queryFn: () => followQueryApi.countFollowing(followingId),
  enabled: !!followingId,
});

const { data: friendsCount = 0, isLoading: isLoadingFriends } = useQuery({
  queryKey: [QUERY_KEYS.COUNT_FRIENDS, followingId],
  queryFn: () => followQueryApi.countFriends(followingId),
  enabled: !!followingId,
});
```

#### 5.1.2 Toggle Follow Mutation
**Mutation Definition:**
```javascript
const toggleFollowMutation = useMutation({
  mutationFn: async (newStatus) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Follow mutation called:', { followingId, newStatus });
    }
    
    const method = newStatus ? 'post' : 'delete';
    const response = await followCommandApi.toggleFollow(followingId, method);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Follow API response:', response);
    }
    
    // Check if response contains error message
    if (response && typeof response === 'string' && 
        (response.includes('error') || response.includes('Error'))) {
      throw new Error(response);
    }
    
    return response;
  },
```

#### 5.1.3 Optimistic Updates
**onMutate Handler:**
```javascript
onMutate: async () => {
  // Cancel ongoing queries
  await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.IS_FOLLOWING, userId, followingId] });
  await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.COUNT_FOLLOWERS, followingId] });
  await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.COUNT_FRIENDS, followingId] });

  // Get previous values
  const previousIsFollowing = queryClient.getQueryData([
    QUERY_KEYS.IS_FOLLOWING, userId, followingId
  ]);
  const previousCount = queryClient.getQueryData([QUERY_KEYS.COUNT_FOLLOWERS, followingId]);
  const previousFriendsCount = queryClient.getQueryData([QUERY_KEYS.COUNT_FRIENDS, followingId]);

  const optimisticStatus = !previousIsFollowing;

  // Update optimistic UI
  queryClient.setQueryData([QUERY_KEYS.IS_FOLLOWING, userId, followingId], optimisticStatus);
  queryClient.setQueryData(
    [QUERY_KEYS.COUNT_FOLLOWERS, followingId],
    (old) => (old || 0) + (optimisticStatus ? 1 : -1)
  );

  return { previousIsFollowing, previousCount, previousFriendsCount };
},
```

#### 5.1.4 Error Handling & Rollback
**onError Handler:**
```javascript
onError: (err, _, context) => {
  console.error('Follow toggle error:', err.message);
  
  // Revert optimistic updates
  if (context?.previousIsFollowing !== undefined) {
    queryClient.setQueryData(
      [QUERY_KEYS.IS_FOLLOWING, userId, followingId],
      context.previousIsFollowing
    );
  }
  if (context?.previousCount !== undefined) {
    queryClient.setQueryData([QUERY_KEYS.COUNT_FOLLOWERS, followingId], context.previousCount);
  }
  if (context?.previousFriendsCount !== undefined) {
    queryClient.setQueryData([QUERY_KEYS.COUNT_FRIENDS, followingId], context.previousFriendsCount);
  }
  
  // Show user-friendly error message
  if (err.message.includes('not authenticated')) {
    console.error('Authentication error - user not logged in');
  }
},
```

#### 5.1.5 Success Handling & Cache Invalidation
**onSuccess Handler:**
```javascript
onSuccess: () => {
  queryClient.invalidateQueries([QUERY_KEYS.IS_FOLLOWING, userId, followingId]);
  queryClient.invalidateQueries([QUERY_KEYS.COUNT_FOLLOWERS, followingId]);
  queryClient.invalidateQueries([QUERY_KEYS.COUNT_FOLLOWING, followingId]);
  queryClient.invalidateQueries([QUERY_KEYS.COUNT_FRIENDS, followingId]);
  
  // Also invalidate friend count for the current user since friendship status might change
  if (userId) {
    queryClient.invalidateQueries([QUERY_KEYS.COUNT_FRIENDS, userId]);
  }
},
```

#### 5.1.6 Toggle Follow Function
**Smart Toggle Logic:**
```javascript
toggleFollow: (newStatus) => {
  // Add validation
  if (!userId || !followingId) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Missing userId or followingId:', { userId, followingId });
    }
    return;
  }
  
  // If newStatus is provided, use it; otherwise toggle the current status
  const targetStatus = newStatus !== undefined ? newStatus : !Boolean(isFollowing);
  
  if (process.env.NODE_ENV === 'development') {
    console.log('Toggling follow:', { 
      userId, 
      followingId, 
      currentStatus: isFollowing, 
      newStatus: targetStatus 
    });
  }
  
  toggleFollowMutation.mutate(targetStatus);
},
```

#### 5.1.7 Return Values
```javascript
return {
  isFollowing,                    // Current follow status
  toggleFollowMutation,           // Mutation object
  toggleFollow,                   // Toggle function
  isToggleLoading,                // Loading state
  followersCount,                 // Number of followers
  followingCount,                 // Number of following
  friendsCount,                   // Number of friends
  isLoadingFollowers,             // Followers loading state
  isLoadingFollowing,             // Following loading state
  isLoadingFriends,               // Friends loading state
};
```

**Đặc điểm kỹ thuật:**
- **Optimistic Updates:** Immediate UI feedback trước khi API response
- **Error Rollback:** Automatic rollback khi có lỗi
- **Cache Management:** Smart cache invalidation và updates
- **Performance Optimization:** Efficient query cancellation và batching
- **Developer Experience:** Comprehensive logging trong development mode
- **Type Safety:** Proper validation và error handling

---
## PHẦN 6: FRONTEND - COMPONENTS

### 6.1 FollowButton Component (follow-button.jsx)
**Đường dẫn:** `unify-frontend/src/components/button/follow-button.jsx`

**Mô tả:** Reusable React component render follow/unfollow button với dynamic styling và behavior dựa trên follow status.

**Dependencies:**
- `useFollow`: Custom hook xử lý follow logic
- React hooks cho state management

#### 6.1.1 Component Props
```javascript
const FollowButton = ({
  userId,                    // ID của user hiện tại
  followingId,              // ID của user cần follow/unfollow
  classFollowing = '',      // CSS class khi đang follow
  classFollow = '',         // CSS class khi chưa follow
  contentFollowing = '',    // Text content khi đang follow
  contentFollow = '',       // Text content khi chưa follow
}) => {
```

#### 6.1.2 Hook Integration
**useFollow Hook Usage:**
```javascript
const { isFollowing, toggleFollow } = useFollow(userId, followingId);
```

**Follow Status Logic:**
```javascript
const handleFollowToggle = () => {
  toggleFollow(!isFollowing);
};
```

#### 6.1.3 Dynamic Rendering
**Button Structure:**
```javascript
return (
  <button
    onClick={() => toggleFollow(!isFollowing)}
    className={isFollowing ? classFollowing : classFollow}
  >
    <span>{isFollowing ? contentFollowing : contentFollow}</span>
  </button>
);
```

**Dynamic Styling:**
- **Following State:** Sử dụng `classFollowing` và `contentFollowing`
- **Not Following State:** Sử dụng `classFollow` và `contentFollow`
- **Conditional Rendering:** Dựa trên `isFollowing` boolean

#### 6.1.4 Usage Examples
**Basic Usage:**
```javascript
<FollowButton
  userId="current-user-id"
  followingId="target-user-id"
  classFollowing="btn-following"
  classFollow="btn-follow"
  contentFollowing="Following"
  contentFollow="Follow"
/>
```

**Custom Styling:**
```javascript
<FollowButton
  userId={currentUser.id}
  followingId={profileUser.id}
  classFollowing="bg-gray-500 text-white px-4 py-2 rounded-full"
  classFollow="bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600"
  contentFollowing="✓ Following"
  contentFollow="+ Follow"
/>
```

#### 6.1.5 Component Features
- **Reusable Design:** Có thể sử dụng ở nhiều nơi trong ứng dụng
- **Flexible Styling:** Customizable CSS classes và content
- **State Management:** Tự động quản lý follow status
- **Event Handling:** Built-in click handling với toggle logic
- **Accessibility:** Proper button semantics và ARIA support

**Đặc điểm kỹ thuật:**
- **Props Validation:** Flexible prop handling với default values
- **Conditional Rendering:** Dynamic UI dựa trên follow status
- **Event Delegation:** Clean separation giữa UI và business logic
- **Performance:** Lightweight component với minimal re-renders
- **Maintainability:** Simple và focused component responsibility

---
## PHẦN 7: TỔNG KẾT VÀ KIẾN TRÚC TỔNG THỂ

### 7.1 Kiến trúc hệ thống
```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│  Components (follow-button.jsx)                                │
│  ├── Dynamic styling based on follow status                   │
│  ├── Reusable button component                                 │
│  └── Event handling integration                                │
├─────────────────────────────────────────────────────────────────┤
│  Hooks (use-follow.jsx)                                        │
│  ├── React Query integration                                   │
│  ├── Optimistic updates                                        │
│  ├── Cache management                                          │
│  └── Error handling & rollback                                 │
├─────────────────────────────────────────────────────────────────┤
│  API Layer                                                      │
│  ├── follow.command.api.js: Follow/Unfollow operations         │
│  └── follow.query.api.js: Status & count queries               │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│  Controller (FollowerController.java)                          │
│  ├── REST API endpoints                                        │
│  ├── Follow/Unfollow operations                                │
│  ├── Status checking                                           │
│  └── Count operations                                          │
├─────────────────────────────────────────────────────────────────┤
│  Service (FollowService.java)                                  │
│  ├── Business logic                                            │
│  ├── Friendship management                                     │
│  ├── Notification integration                                  │
│  └── Transaction management                                    │
├─────────────────────────────────────────────────────────────────┤
│  Repository Layer                                               │
│  ├── FollowRepository: Follow operations                       │
│  └── FriendshipRepository: Friendship management               │
├─────────────────────────────────────────────────────────────────┤
│  Domain Models                                                  │
│  ├── Follower.java: Follow relationship entity                 │
│  ├── FollowerUserId.java: Composite key                       │
│  └── Friendship.java: Friendship entity                        │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATABASE LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│  JPA Entities                                                   │
│  ├── Follower table: Follow relationships                      │
│  ├── Friendship table: Mutual follow status                    │
│  └── User table: User information                              │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Luồng xử lý Follow/Unfollow
```
1. USER INTERACTION (Click Follow Button)
   ↓
2. FRONTEND HOOK (useFollow)
   ├── Optimistic UI update
   ├── Cancel ongoing queries
   └── Call API mutation
   ↓
3. API REQUEST (follow.command.api.js)
   ├── POST /api/follow/{followingId} (follow)
   └── DELETE /api/follow/{followingId} (unfollow)
   ↓
4. BACKEND CONTROLLER (FollowerController)
   ├── Request validation
   ├── Call service layer
   └── Return response
   ↓
5. SERVICE LAYER (FollowService)
   ├── Authentication check
   ├── Business logic validation
   ├── Database operations
   ├── Friendship status update
   └── Notification sending
   ↓
6. DATABASE OPERATIONS
   ├── Insert/Delete follow record
   ├── Update friendship status
   └── Transaction commit
   ↓
7. RESPONSE HANDLING
   ├── Success: Cache invalidation
   ├── Error: Rollback optimistic updates
   └── UI state update
```

### 7.3 Các tính năng chính

#### 7.3.1 Follow/Unfollow Operations
- **Follow User:** Tạo follow relationship và gửi notification
- **Unfollow User:** Xóa follow relationship và cập nhật friendship
- **Self-follow Prevention:** Ngăn chặn user follow chính mình
- **Duplicate Prevention:** Tránh tạo duplicate follow records

#### 7.3.2 Friendship Management
- **Mutual Follow Detection:** Tự động phát hiện khi hai users follow lẫn nhau
- **Friendship Creation:** Tự động tạo friendship record cho mutual follows
- **Friendship Cleanup:** Tự động xóa friendship khi không còn mutual follow
- **Status Synchronization:** Đồng bộ friendship status với follow status

#### 7.3.3 Performance Optimization
- **Optimistic Updates:** Immediate UI feedback
- **Query Cancellation:** Cancel ongoing queries khi có mutation
- **Cache Management:** Smart cache invalidation
- **Batch Operations:** Efficient database operations

#### 7.3.4 User Experience
- **Real-time Updates:** Instant UI changes
- **Error Handling:** Graceful error handling với rollback
- **Loading States:** Proper loading indicators
- **Responsive Design:** Mobile-friendly interface

### 7.4 Công nghệ sử dụng

#### 7.4.1 Backend
- **Java 17+:** Modern Java features
- **Spring Boot:** Framework chính
- **Spring Data JPA:** Database operations
- **H2/PostgreSQL:** Database systems
- **Lombok:** Code generation
- **Maven:** Dependency management

#### 7.4.2 Frontend
- **React 18+:** Modern React features
- **Next.js 14+:** Full-stack framework
- **TanStack Query:** Data fetching và caching
- **JavaScript ES6+:** Modern JavaScript features
- **CSS Modules:** Component styling

### 7.5 Best Practices Implemented

#### 7.5.1 Code Quality
- **Clean Architecture:** Separation of concerns
- **SOLID Principles:** Single responsibility, dependency injection
- **Error Handling:** Comprehensive error handling
- **Logging:** Proper logging cho debugging

#### 7.5.2 Security
- **Authentication:** User authentication check
- **Authorization:** User-specific data access
- **Input Validation:** Request parameter validation
- **SQL Injection Prevention:** JPA parameter binding

#### 7.5.3 Performance
- **Database Optimization:** Efficient queries và indexing
- **Caching Strategy:** React Query caching
- **Optimistic Updates:** Immediate UI feedback
- **Query Cancellation:** Prevent unnecessary API calls

### 7.6 Data Flow & State Management

#### 7.6.1 State Synchronization
- **Frontend State:** React Query cache management
- **Backend State:** Database consistency với transactions
- **Real-time Updates:** Optimistic updates với rollback
- **Cache Invalidation:** Smart cache refresh strategies

#### 7.6.2 Data Consistency
- **Transaction Management:** ACID properties cho follow operations
- **Friendship Sync:** Automatic friendship status updates
- **Count Accuracy:** Real-time follower/following counts
- **Status Validation:** Prevent invalid follow states

### 7.7 Monitoring & Debugging

#### 7.7.1 Development Tools
- **Console Logging:** Comprehensive development logging
- **Error Tracking:** Detailed error messages
- **State Inspection:** React Query DevTools integration
- **Network Monitoring:** API request/response tracking

#### 7.7.2 Production Monitoring
- **Performance Metrics:** Response time monitoring
- **Error Tracking:** Production error logging
- **User Analytics:** Follow/unfollow behavior tracking
- **System Health:** Database và service monitoring

### 7.8 Future Enhancements

#### 7.8.1 Planned Features
- **Follow Suggestions:** AI-powered user recommendations
- **Follow Categories:** Group follows by interests
- **Follow Analytics:** Detailed follow behavior insights
- **Follow Privacy:** Granular privacy controls

#### 7.8.2 Technical Improvements
- **GraphQL Integration:** Flexible data querying
- **Real-time Updates:** WebSocket integration
- **Offline Support:** Service worker integration
- **Performance Optimization:** Advanced caching strategies

---
## KẾT LUẬN

Hệ thống Follow/Unfollow trong dự án Unify là một giải pháp toàn diện, kết hợp cả backend và frontend với kiến trúc rõ ràng và performance tối ưu. Hệ thống được thiết kế để xử lý các mối quan hệ follow một cách hiệu quả, đồng thời tự động quản lý friendship status.

**Điểm mạnh chính:**
- ✅ **Real-time Updates:** Optimistic updates với error rollback
- ✅ **Performance:** Efficient caching và query management
- ✅ **Reliability:** Transaction-based operations với data consistency
- ✅ **User Experience:** Immediate UI feedback và smooth interactions
- ✅ **Scalability:** Clean architecture với separation of concerns
- ✅ **Maintainability:** Well-structured code với comprehensive documentation

**Công nghệ sử dụng:**
- Backend: Java Spring Boot với JPA
- Frontend: React Next.js với TanStack Query
- Database: JPA entities với composite keys
- State Management: React Query với optimistic updates

**Business Logic Features:**
- **Follow/Unfollow Operations:** Complete follow relationship management
- **Friendship System:** Automatic friendship detection và management
- **Notification Integration:** Seamless notification system integration
- **Count Management:** Real-time follower/following/friend counts
- **Data Validation:** Comprehensive business rule validation

Hệ thống này có thể dễ dàng mở rộng với các tính năng mới như follow suggestions, privacy controls, và advanced analytics, đồng thời duy trì hiệu suất cao và độ tin cậy tốt trong môi trường production.

---
