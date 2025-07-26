'use client';

import { ArrowLeftFromLine, ArrowRightFromLine } from 'lucide-react';
import { Hint } from '@/src/components/base';
import { useChatSidebarStore } from '@/src/stores/chat-sidebar.store';
import { ButtonCommon } from '@/src/components/button';

export default function ChatToggle() {
  const { collapsed, onExpand, onCollapse } = useChatSidebarStore((state) => state);
  let Icon = collapsed ? ArrowLeftFromLine : ArrowRightFromLine;

  const onToggle = () => {
    if (collapsed) {
      onExpand();
    } else {
      onCollapse();
    }
  };

  const label = collapsed ? 'Expand' : 'Collapse';

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
