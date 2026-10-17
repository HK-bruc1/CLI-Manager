---
name: CLI-Manager Tap workspace
description: Quiet session-oriented workspace with a native dark terminal
colors:
  primary: "#7054c3"
  primary-soft: "#eee9f8"
  background: "#ffffff"
  surface: "#faf9fb"
  muted: "#f3f2f5"
  foreground: "#25232b"
  secondary: "#66616e"
  line: "#e7e4eb"
  terminal: "#1c1b22"
  terminal-text: "#eeeaf2"
  terminal-cursor: "#c5acf0"
  terminal-selection: "#71638388"
  terminal-muted: "#b4aebe"
  terminal-action: "#c9bedc"
  terminal-action-hover: "#35303f"
  warning-text-dark: "#f1c779"
  warning-surface-dark: "#352d21"
  scrim: "#0e0b194d"
  dark-background: "#17151c"
  dark-primary: "#b29ce8"
typography:
  body:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif'
    fontSize: "14px"
    lineHeight: 1.5
  navigation:
    fontSize: "13px"
  micro-phone:
    fontSize: "9px"
  metadata:
    fontSize: "10px"
  caption:
    fontSize: "11px"
  control:
    fontSize: "12px"
  sheet-title:
    fontSize: "15px"
  brand-and-phone-input:
    fontSize: "16px"
  phone-title:
    fontSize: "20px"
  empty-title:
    fontSize: "22px"
  login-title:
    fontSize: "23px"
  large-mark:
    fontSize: "43px"
  terminal-phone:
    fontFamily: '"Tap Mono", "Noto Sans Mono CJK SC", monospace'
rounded:
  tab: "4px"
  key: "5px"
  control: "6px"
  terminal: "7px"
  composer: "10px"
  user-bubble: "12px"
  sheet: "14px"
  phone-sheet: "16px"
spacing:
  key-gap: "4px"
  desktop-gutter: "20px"
  phone-gutter: "8px"
components:
  session-selected:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.primary}"
    rounded: "{rounded.control}"
  terminal:
    backgroundColor: "{colors.terminal}"
    textColor: "{colors.terminal-text}"
    rounded: "{rounded.terminal}"
---

# Design System: Tap workspace

## Overview

This Operate surface preserves the user's established Tap-Code direction: quiet neutral workspace, folder-grouped sessions, native dark terminal, bottom composition and a two-row keyboard strip. Product truth and constraints live in `PRODUCT.md`; this record describes the implemented visual system, not additional feature promises.

This scope is `apps/web-tap` only. Classic Web keeps its own glass/blue visual guidelines. Source of truth: `src/styles.css`, `Terminal.tsx` and the browser acceptance captures.

## Colors

Violet marks selection, focus and the send action. Neutral tonal surfaces carry hierarchy; muted foreground is still readable content, not disabled decoration. Status colors always accompany text or an icon.

Dark mode replaces surface/text/border tokens without changing composition. The native terminal remains dark in either workspace theme. Do not tint dense terminal output to match a page theme.

## Typography

System sans carries UI and conversation text. Navigation is compact but lower-priority than conversation content. System monospace carries desktop terminal/code; the OFL Inconsolata face, exposed as Tap Mono, narrows Latin glyphs on phones without squeezing the whole terminal as an image. CJK uses a system fallback.

Timestamps use 24-hour formatting; dimensions and counts use tabular numbers. User-adjusted terminal font size is independent of chat text.

## Layout

Desktop has a fixed-width (258px) project/session rail and a flexible workspace. Terminal and composer share the workspace gutters; composer/key rows are bounded at 1000px and chat at 820px. At 767px and below, navigation becomes a left drawer and gutters contract. Phone sheets sit above the keyboard in the portal layer.

The keyboard translates the app shell rather than shrinking message content. Hidden sessions remain inert. Native desktop grid ownership is separate from browser layout; the phone reading view reflows text, not the CLI grid.

## Elevation & Depth

The workspace is flat and divided by low-contrast one-pixel borders. Sheets alone use an ambient shadow and scrim. There is no decorative glass, gradient or dashboard-card grid in this optional surface. Sheet entry is brief (180ms); reduced-motion disables it.

## Shapes

Compact softly rounded controls, a slightly larger composer, and rounded sheets. Terminal geometry remains rectangular within its modest frame. Do not apply hover scaling or dimensions that move adjacent controls.

## Components

- Session rows: opaque violet selection, readable title, compact CLI/status icon and optional Worktree subtitle.
- Composer: a real multiline textarea with a visible focus-within border, image/direct-input/interrupt actions, and a separate send action. Disabled state does not erase the draft.
- Key strip: two equal-width seven-key rows; modifier state is pressed, not a persistent mode badge. Pointer interactions preserve textarea focus.
- Conversation: user bubble aligned right; assistant content is unboxed. Code has an opaque dark surface; footer metadata is quiet and 24-hour.
- Sheets: labelled dialogs with focus trap, inert background, Escape, explicit close and focus restoration. Dragging is limited to the handle.

## Do's and Don'ts

- Do preserve hierarchy, spacing and action positions in both languages and themes.
- Do keep offline, ended, unsupported and uncertain-delivery states explicit.
- Do use the native terminal for native permissions and menus.
- Don't show controls for unavailable queue/Push/usage capabilities.
- Don't import Classic Web view/state modules to approximate this identity.
- Don't shrink a desktop-owned terminal into unreadable phone text; offer the explicit reading/native toggle.
