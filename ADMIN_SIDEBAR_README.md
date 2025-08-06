# Admin Sidebar Implementation

This document describes the new admin sidebar implementation using shadcn/ui sidebar components.

## Overview

The admin sidebar has been completely redesigned using the shadcn/ui sidebar component system. This provides:

- **Modern Design**: Clean, professional appearance with proper theming
- **Collapsible Functionality**: Sidebar can collapse to icons only
- **Responsive Design**: Works on both desktop and mobile
- **Accessibility**: Built-in accessibility features
- **Keyboard Shortcuts**: Ctrl/Cmd + B to toggle sidebar
- **Persistent State**: Sidebar state is saved in cookies

## Key Features

### 1. Collapsible Sidebar

- The sidebar can be collapsed to show only icons
- Use the sidebar trigger button or Ctrl/Cmd + B to toggle
- Tooltips appear when hovering over icons in collapsed state

### 2. Active State Detection

- Menu items highlight when they match the current route
- Uses Next.js `usePathname()` for accurate route detection

### 3. User Profile Section

- Displays admin user information
- Logout button with proper styling
- Avatar integration

### 4. Menu Structure

- Organized into logical groups (Users, Posts, Comments)
- Each group has a label and icon
- Sub-items with their own icons and links

## Components Used

### From shadcn/ui sidebar:

- `SidebarProvider`: Context provider for sidebar state
- `Sidebar`: Main sidebar container
- `SidebarHeader`: Header section with logo
- `SidebarContent`: Scrollable content area
- `SidebarGroup`: Group container for menu sections
- `SidebarGroupLabel`: Labels for menu groups
- `SidebarGroupContent`: Content wrapper for groups
- `SidebarMenu`: Menu container
- `SidebarMenuItem`: Individual menu items
- `SidebarMenuButton`: Clickable menu buttons
- `SidebarFooter`: Footer section
- `SidebarSeparator`: Visual separators
- `SidebarTrigger`: Toggle button for sidebar

### From HeroUI:

- `User`: User profile component
- `Avatar`: Avatar display

## Styling

The sidebar uses CSS custom properties for theming:

```css
--sidebar-background: 0 0% 98%;
--sidebar-foreground: 240 5.3% 26.1%;
--sidebar-primary: 240 5.9% 10%;
--sidebar-primary-foreground: 0 0% 98%;
--sidebar-accent: 240 4.8% 95.9%;
--sidebar-accent-foreground: 240 5.9% 10%;
--sidebar-border: 220 13% 91%;
--sidebar-ring: 217.2 91.2% 59.8%;
```

## Usage

The sidebar is automatically included in the admin layout:

```jsx
// src/layouts/admin-layout.jsx
<SidebarProvider>
  <div className="flex w-full">
    <AdminSidebar />
    <main>
      <SidebarTrigger />
      {children}
    </main>
  </div>
</SidebarProvider>
```

## Configuration

Menu items are configured in the `menuItems` array:

```jsx
const menuItems = [
  {
    title: 'USERS',
    icon: 'fa-solid fa-users',
    items: [
      {
        title: 'View Users',
        icon: 'fa-solid fa-user',
        href: '/manage/users/view',
      },
      {
        title: 'Reported Users',
        icon: 'fa-solid fa-user-xmark',
        href: '/manage/users/reports',
      },
      {
        title: 'Blocked Users',
        icon: 'fa-solid fa-ban',
        href: '/manage/users/list',
      },
    ],
  },
  {
    title: 'POSTS',
    icon: 'fa-solid fa-blog',
    items: [
      {
        title: 'View Posts',
        icon: 'fa-solid fa-file-lines',
        href: '/manage/posts/view',
      },
      {
        title: 'Reported Posts',
        icon: 'fa-solid fa-triangle-exclamation',
        href: '/manage/posts/list',
      },
    ],
  },
  {
    title: 'COMMENTS',
    icon: 'fa-solid fa-comment',
    items: [
      {
        title: 'View Comments',
        icon: 'fa-solid fa-comments',
        href: '/manage/comments/view',
      },
      {
        title: 'Reported Comments',
        icon: 'fa-solid fa-comment-slash',
        href: '/manage/comments/list',
      },
    ],
  },
];
```

## Menu Structure

The admin sidebar now includes the following menu items:

### Users Section

- **View Users**: Browse and filter all users in the system
- **Reported Users**: Manage users who have been reported
- **Blocked Users**: View and manage blocked user accounts

### Posts Section

- **View Posts**: Browse and filter all posts in the system
- **Reported Posts**: Manage posts that have been reported

### Comments Section

- **View Comments**: Browse and filter all comments in the system
- **Reported Comments**: Manage comments that have been reported

## Benefits Over Previous Implementation

1. **Better UX**: Smooth animations and transitions
2. **Accessibility**: Proper ARIA labels and keyboard navigation
3. **Responsive**: Works well on all screen sizes
4. **Maintainable**: Clean, modular code structure
5. **Themable**: Easy to customize colors and styling
6. **Modern**: Uses latest React patterns and best practices

## Migration Notes

- Removed dependency on HeroUI Accordion components
- Replaced custom NavButton component with shadcn/ui components
- Simplified layout structure
- Added proper state management for sidebar visibility
- Improved mobile experience with sheet-based sidebar

## Future Enhancements

- Add search functionality
- Implement nested menu items
- Add badges for notifications
- Support for custom themes
- Integration with breadcrumbs
