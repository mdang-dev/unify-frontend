import { Skeleton } from '@/src/components/base';
import ChatMessage from './chat-message';

export default function ChatList({ messages, isHidden }) {
  if (isHidden || !messages || messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p>{isHidden ? 'Chat is disabled' : 'Welcome to the chat! No messages yet.'}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col-reverse overflow-y-auto p-3">
      {messages.map((message) => (
        <ChatMessage key={message?.timestamp} data={message} />
      ))}
    </div>
  );
}

export const ChatListSkeleton = () => {
  return (
    <div className="flex h-full items-center justify-center">
      <Skeleton className="h-6 w-1/2" />
    </div>
  );
};
