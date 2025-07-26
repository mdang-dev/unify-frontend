import { create } from 'zustand';

export const ChatVariant = {
  CHAT: 'CHAT',
  COMMUNITY: 'COMMUNITY',
};

export const useChatSidebarStore = create((set) => ({
  collapsed: false,
  variant: ChatVariant.CHAT,
  onExpand: () => set(() => ({ collapsed: false })),
  onCollapse: () => set(() => ({ collapsed: true })),
  onChangeVariant: (newVariant) => set(() => ({ variant: newVariant })),
}));
