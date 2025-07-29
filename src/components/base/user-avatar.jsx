import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar';
import { Badge } from '@/src/components/ui/badge';
import { cn } from '@/src/lib/utils';

export default function UserAvatar({
  username,
  imageUrl,
  size = 48,
  isLive = false,
  showBadge = false,
}) {
  const dimensionStyle = {
    width: `${size}px`,
    height: `${size}px`,
  };

  return (
    <div className="relative" style={dimensionStyle}>
      {isLive && (
        <div
          className="animate-smallping absolute inset-0 transform rounded-full border-2 border-red-500 opacity-75"
          style={dimensionStyle}
        />
      )}

      <Avatar
        className={cn(
          'relative z-10 border-2 bg-purple-600 text-white',
          isLive && 'border-red-500'
        )}
        style={dimensionStyle}
      >
        <AvatarImage src={imageUrl} alt={username} />
        <AvatarFallback className="text-lg font-bold">
          {username?.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {isLive && showBadge && (
        <Badge className="absolute -bottom-2 left-1/2 z-20 -translate-x-1/2 rounded-md bg-red-500 px-2 py-[1px] font-mono text-[10px] text-white shadow hover:bg-red-500">
          LIVE
        </Badge>
      )}
    </div>
  );
}
