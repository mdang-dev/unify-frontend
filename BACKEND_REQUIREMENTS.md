# Backend Requirements for Real-time Following Live Status

## Overview
This document outlines the backend requirements to implement real-time following live status updates in the stream list page.

## API Endpoints

### 1. Get Followers with Live Status
**Endpoint:** `GET /api/follow/followers/{userId}/with-live-status`

**Purpose:** Retrieve all followers of a user with their current live streaming status.

**Response Format:**
```json
[
  {
    "id": "string",
    "username": "string",
    "avatar": {
      "url": "string"
    },
    "isLive": "boolean",
    "streamTitle": "string|null",
    "viewerCount": "number",
    "startTime": "string|null" // ISO 8601 timestamp
  }
]
```

**Example Response:**
```json
[
  {
    "id": "123",
    "username": "LunaDev",
    "avatar": {
      "url": "https://example.com/avatar.jpg"
    },
    "isLive": true,
    "streamTitle": "Chill Coding with JavaScript",
    "viewerCount": 387,
    "startTime": "2024-01-15T10:30:00Z"
  },
  {
    "id": "456",
    "username": "Zenita",
    "avatar": {
      "url": "https://example.com/avatar2.jpg"
    },
    "isLive": false,
    "streamTitle": null,
    "viewerCount": 0,
    "startTime": null
  }
]
```

## WebSocket Topics

### 1. Followers Live Status Updates
**Topic:** `/topic/users/{userId}/followers-live-status`

**Purpose:** Broadcast real-time updates when a follower's live status changes.

**Message Format:**
```json
{
  "type": "FOLLOWER_LIVE_STATUS",
  "userId": "string", // ID of the follower whose status changed
  "isLive": "boolean",
  "streamTitle": "string|null",
  "viewerCount": "number",
  "startTime": "string|null"
}
```

**Example Messages:**

**User Goes Live:**
```json
{
  "type": "FOLLOWER_LIVE_STATUS",
  "userId": "123",
  "isLive": true,
  "streamTitle": "Morning Yoga Flow",
  "viewerCount": 0,
  "startTime": "2024-01-15T10:30:00Z"
}
```

**User Goes Offline:**
```json
{
  "type": "FOLLOWER_LIVE_STATUS",
  "userId": "123",
  "isLive": false,
  "streamTitle": null,
  "viewerCount": 0,
  "startTime": null
}
```

**Viewer Count Update:**
```json
{
  "type": "FOLLOWER_LIVE_STATUS",
  "userId": "123",
  "isLive": true,
  "streamTitle": "Morning Yoga Flow",
  "viewerCount": 45,
  "startTime": "2024-01-15T10:30:00Z"
}
```

## Implementation Notes

### 1. When to Send Updates
- **User starts streaming** → Send `isLive: true` with stream details
- **User stops streaming** → Send `isLive: false` with null values
- **Viewer count changes** → Send update with new count
- **Stream title changes** → Send update with new title

### 2. Performance Considerations
- Only send updates when there are actual changes
- Consider debouncing viewer count updates (e.g., every 5-10 seconds)
- Use efficient WebSocket message serialization

### 3. Security
- Ensure users can only subscribe to their own followers' updates
- Validate that the requesting user has permission to view the follower's status
- Implement rate limiting for WebSocket messages

### 4. Error Handling
- Handle cases where followers are deleted or accounts are deactivated
- Provide fallback data when WebSocket connection fails
- Log WebSocket message failures for debugging

## Testing

### 1. API Testing
- Test with users who have many followers
- Test with users who have no followers
- Test with followers who are currently live/offline

### 2. WebSocket Testing
- Test real-time updates when followers go live/offline
- Test viewer count updates during live streams
- Test connection stability and reconnection

### 3. Edge Cases
- Test with very long usernames and stream titles
- Test with special characters in usernames
- Test with high viewer counts
- Test rapid status changes

## Frontend Integration

The frontend will:
1. Fetch initial data using the API endpoint
2. Subscribe to WebSocket topic for real-time updates
3. Update the UI immediately when WebSocket messages are received
4. Fall back to API polling if WebSocket connection fails
5. Sort followers with live users first, then by viewer count, then alphabetically

## Questions for Backend Team

1. **Rate Limiting:** What are the rate limits for WebSocket messages?
2. **Authentication:** How should WebSocket connections be authenticated?
3. **Scaling:** How will this handle users with thousands of followers?
4. **Caching:** Should follower data be cached, and if so, for how long?
5. **Monitoring:** What metrics should be tracked for this feature?
