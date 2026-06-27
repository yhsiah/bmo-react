# bmo-react

An interactive BMO companion component for React/Next.js — the small computer friend from Adventure Time.

Live on [hansiah.com](https://hansiah.com) — click/tap him to see what he does.

![BMO](./bmo.gif)

## What it does

- Boots up with a power-on sequence on mount
- Blinks and makes random expressions while awake
- Falls asleep after 45 seconds of inactivity
- Shows "BACK IN 5 MINUTES" after 90 seconds of deep sleep
- Reacts to hover (happy face) and click (excited bounce)
- Wakes up grumpy if you disturb his sleep
- Responds to page-wide clicks with random expressions
- Exposes `window.bmo` for console play

## Requirements

- **Next.js 13+** (uses `'use client'` and styled-jsx)
- React 18+

## Usage

Copy `src/BMO.tsx` into your project and drop it in:

```tsx
import BMO from '@/components/BMO';

export default function Page() {
  return (
    <div>
      <BMO />
    </div>
  );
}
```

No props required — BMO boots and manages himself.

## Console easter egg

```js
window.bmo.wake()                  // Wake BMO
window.bmo.sleep()                 // Put him to sleep
window.bmo.expression('excited')   // Set an expression directly
window.bmo.expressions             // List all available expressions
```

Available expressions: `sleeping`, `awake`, `blinkClosed`, `surprised`, `smile`, `happy`, `veryHappy`, `excited`, `unhappy`, `confused`, `silly`, `backInFiveMinutes`, `powerOff`, `powering`, `yawn`

## Timing constants

Adjust at the top of `BMO.tsx`:

```ts
const SLEEP_DELAY_MS = 45000;       // Time until BMO falls asleep
const DEEP_SLEEP_DELAY_MS = 90000;  // Time until "BACK IN 5 MINUTES"
const HOVER_DELAY_MS = 150;         // Hover debounce
const BLINK_MIN_INTERVAL_MS = 3000; // Minimum blink interval
const BLINK_MAX_INTERVAL_MS = 10000; // Maximum blink interval
```

## Styling

BMO renders at `w-16 h-12` (64×48px) with a teal background and black border to match his canonical colours. Override with a wrapper `div` or edit the Tailwind classes in the JSX directly.

Requires **Tailwind CSS** — the component uses utility classes throughout.

## License

MIT
