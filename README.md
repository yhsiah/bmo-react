# bmo-react

An interactive BMO companion component for React — the small computer friend from Adventure Time.

Live on [hansiah.com](https://hansiah.com) — click/tap him to see what he does.

![BMO](https://raw.githubusercontent.com/yhsiah/bmo-react/main/bmo.gif)

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

- React 18+
- TypeScript (the component is `.tsx`)

**Next.js users:** add `'use client'` at the top of your importing file or a wrapper component.

## Usage

```bash
npm install bmo-react
```

```tsx
import BMO from 'bmo-react';

export default function Page() {
  return (
    <div>
      <BMO />
    </div>
  );
}
```

No props required — BMO boots and manages himself.

### Delay the boot sequence

Pass `startBoot` to control when BMO powers on — useful if you want him to boot after a loading screen, animation, or data fetch completes:

```tsx
const [ready, setReady] = useState(false);
// ...trigger setReady(true) whenever you're ready

<BMO startBoot={ready} />
```

BMO stays in `powerOff` state until `startBoot` flips to `true`, then runs his normal boot sequence.

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

BMO renders at 64×48px with a teal background and black border. Override size or position with a wrapper `div`, or edit the styles in `BMO.tsx` directly.

## License

MIT
