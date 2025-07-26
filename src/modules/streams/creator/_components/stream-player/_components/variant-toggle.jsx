'use client';

import { Hint } from '@/src/components/base';
import { ChatVariant, useChatSidebarStore } from '@/src/stores/chat-sidebar.store';
import { ButtonCommon } from '@/src/components/button';
import { MessageSquare, Users } from 'lucide-react';

export default function VariantToggle() {
  const { variant, onChangeVariant } = useChatSidebarStore((state) => state);

  const isChat = variant === ChatVariant.CHAT;

  let Icon = isChat ? Users : MessageSquare;

  const onToggle = () => {
    const newVariant = isChat ? ChatVariant.COMMUNITY : ChatVariant.CHAT;
    onChangeVariant(newVariant);
  };

  const label = isChat ? 'Community' : 'Go back to chat';

  return (
    <Hint label={label} side="left" asChild>
      <ButtonCommon
        onClick={onToggle}
        variant="ghost"
        className="h-auto bg-transparent p-2 hover:bg-white/10 hover:text-primary"
      >
        <Icon className="h-4 w-4" />
      </ButtonCommon>
    </Hint>
  );
}
