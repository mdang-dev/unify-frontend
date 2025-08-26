import { stringToColor } from '@/src/lib/utils';
import { format } from 'date-fns';


export default function ChatMessage({ data }) {
  const { from, message, timestamp } = data;
  const { fullName, avatar: avatarUrl } = JSON.parse(from?.metadata || '{}');

  const username = fullName || from?.name || 'Unknown';
  const color = stringToColor(username);

  return (
    <div className="flex items-start space-x-3 rounded-md px-3 py-2 hover:bg-white/5">
      {/* Avatar */}
      {avatarUrl ? (
        <img src={avatarUrl} alt="avatar" className="h-8 w-8 rounded-full object-cover" />
      ) : (
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: color }}
        >
          {username[0]}
        </div>
      )}

      {/* Message content */}
      <div className="flex flex-col">
        <div className="flex items-center space-x-2">
          <span className="text-sm" style={{ color: color }} title={from?.name}>
            {username}
          </span>
          <span className="text-xs text-black dark:text-white/40">{new Date(timestamp).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
          })}</span>
        </div>
        <p className="break-words text-sm leading-snug dark:text-white text-black">{message}</p>
      </div>
    </div>
  );
}
