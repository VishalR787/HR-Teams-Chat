# Design Guidelines for HR Teams Chat

## Design Approach
**Reference-Based: Microsoft Teams**
- Follow Microsoft Teams desktop application design patterns
- Three-pane layout architecture with fixed rail and sidebar
- Clean, professional workplace communication aesthetic
- Focus on information density and workplace efficiency

## Layout System

### Three-Pane Structure (Fixed Measurements)
- **Left Rail**: 56px width, vertical navigation/app selector
- **Sidebar**: 260px width, channels and user controls
- **Main Content**: Remaining space, chat messages and composer

### Spacing Primitives
Use Tailwind spacing units: **2, 3, 4, 6, 8** for consistent rhythm
- Component padding: p-4, p-6
- Section spacing: gap-4, space-y-6
- Message gaps: space-y-3

## Typography

### Font System
- Primary: System font stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto`)
- Headings: font-semibold
- Body: font-normal
- Labels: font-medium, text-sm

### Hierarchy
- Channel names: text-base, font-medium
- Messages: text-sm
- Timestamps: text-xs, opacity-70
- Role badges: text-xs, font-medium, uppercase

## Component Library

### Sidebar Components
- **User Profile Section**: Name input + Role dropdown (Employee/HR) with "Set" button, persists to localStorage
- **Channel List**: Prefix channels with `#`, active state with background highlight
- **Action Button**: "+ New Poll (HR)" - enabled only for HR role, prominent placement

### Main Chat Area
- **Top Bar**: Shows current room name + "You (Role)" indicator
- **Poll Panel**: Positioned above messages, shows active poll with vote buttons and live counts, "Close Poll" visible only to HR
- **Message List**: Scrollable area with timestamps, role badges (Employee/HR/system for HR-Bot)
- **Message Composer**: Input field + Send button, **disabled in #hr-announcements for non-HR users**

### Message Rendering
- **Command Messages**: Display small "Command" chip/badge before message content for messages starting with `/`
- **User Messages**: Username, role badge, text content, timestamp
- **Bot Messages**: Special styling for HR-Bot (system role)
- **No Media**: Plain text only, no embeds or rich content

### Poll Component
```
Poll Card:
- Question text (font-medium, text-base)
- Options as clickable buttons with vote counts
- Visual indicator for user's vote
- Live updating counts via Socket.IO
- "Close Poll" button (HR only)
- Disabled state when poll is closed
```

### Role-Based UI
- HR users: All features enabled
- Employee users: 
  - Composer disabled in #hr-announcements
  - Cannot create/close polls
  - "New Poll" button hidden

## Interactive States

### Input States
- Focus: Border highlight, no dramatic effects
- Disabled: Reduced opacity, cursor not-allowed
- Active channel: Subtle background color

### Button States
- Hover: Slight background darkening
- Active: Pressed state indication
- Disabled: Muted appearance

## Functional Requirements

### Real-time Updates
- Messages appear instantly via Socket.IO
- Poll votes update live for all viewers
- No page refresh needed

### Accessibility
- Semantic HTML (nav, main, article for messages)
- ARIA labels for icon buttons
- Keyboard navigation support
- Role badges screen-reader friendly

## Visual Principles
- **Professional workplace tone**: Clean, minimal distractions
- **Information density**: Compact but readable message list
- **Clarity over decoration**: Focus on communication, not embellishment
- **Consistent spacing**: Predictable rhythm throughout interface

## Images
No hero images or decorative imagery - this is a functional workplace tool focused on communication efficiency.