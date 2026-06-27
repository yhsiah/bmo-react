import { useState, useEffect, useRef, useCallback } from 'react';

type BmoExpression =
  | 'sleeping'
  | 'awake'
  | 'blinkClosed'
  | 'surprised'
  | 'smile'
  | 'happy'
  | 'veryHappy'
  | 'excited'
  | 'unhappy'
  | 'confused'
  | 'silly'
  | 'backInFiveMinutes'
  | 'powerOff'
  | 'powering'
  | 'yawn';

interface WindowWithBmo extends Window {
  bmo?: {
    expression: (expr: BmoExpression) => void;
    wake: () => void;
    sleep: () => void;
    expressions: BmoExpression[];
  };
}

const SLEEP_DELAY_MS = 45000;
const DEEP_SLEEP_DELAY_MS = 90000;
const HOVER_DELAY_MS = 150;
const LEAVE_DELAY_MS = 150;
const BLINK_MIN_INTERVAL_MS = 3000;
const BLINK_MAX_INTERVAL_MS = 10000;
const RANDOM_EXPRESSION_COOLDOWN_MS = 1000;

// Note: If you're using this component in Next.js App Router, add 'use client'
// at the top of your file or in a wrapper component to opt in to client-side rendering.
export default function BMO() {
  const [showSpinner, setShowSpinner] = useState(false);
  const [isBooting, setIsBooting] = useState(true);
  const [bmoExpression, setBmoExpression] = useState<BmoExpression>('powerOff');
  const [bmoIsAwake, setBmoIsAwake] = useState(false);
  const [bmoBounce, setBmoBounce] = useState(false);
  const [bmoWiggle, setBmoWiggle] = useState(false);
  const [isHoveringBMO, setIsHoveringBMO] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [lastRandomExpressionTrigger, setLastRandomExpressionTrigger] = useState(0);
  const [lastInteractionTime, setLastInteractionTime] = useState(Date.now());
  const [hasShownBackInFive, setHasShownBackInFive] = useState(false);

  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const bmoRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bmoStateRef = useRef({ bmoIsAwake, bmoExpression, isAnimating });

  const safeSetTimeout = (callback: () => void, delay: number) => {
    const timeout = setTimeout(callback, delay);
    timeoutsRef.current.push(timeout);
    return timeout;
  };

  const showRandomExpression = useCallback(() => {
    const now = Date.now();
    const timeSinceLastRandom = now - lastRandomExpressionTrigger;
    if (bmoIsAwake && bmoExpression === 'awake' && !isAnimating && timeSinceLastRandom > RANDOM_EXPRESSION_COOLDOWN_MS) {
      setLastRandomExpressionTrigger(now);
      const expressions: BmoExpression[] = ['surprised', 'silly', 'unhappy', 'confused'];
      const randomExpression = expressions[Math.floor(Math.random() * expressions.length)];
      setBmoExpression(randomExpression);
      safeSetTimeout(() => setBmoExpression('awake'), 1000);
    }
  }, [bmoIsAwake, bmoExpression, isAnimating, lastRandomExpressionTrigger]);

  // Easter egg: window.bmo API for developer console play
  useEffect(() => {
    (window as WindowWithBmo).bmo = {
      expression: (expr: BmoExpression) => {
        setBmoExpression(expr);
        if (!bmoIsAwake && expr !== 'sleeping' && expr !== 'backInFiveMinutes') {
          setBmoIsAwake(true);
        }
      },
      wake: () => {
        setBmoIsAwake(true);
        setBmoExpression('awake');
        setLastInteractionTime(Date.now());
      },
      sleep: () => {
        setBmoIsAwake(false);
        setBmoExpression('sleeping');
      },
      expressions: [
        'sleeping', 'awake', 'blinkClosed', 'surprised',
        'smile', 'happy', 'veryHappy', 'excited',
        'unhappy', 'confused', 'silly', 'backInFiveMinutes',
        'powerOff', 'powering', 'yawn',
      ],
    };
    return () => { delete (window as WindowWithBmo).bmo; };
  }, [bmoIsAwake]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      timeoutsRef.current = [];
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
    };
  }, []);

  // Keep state ref current for timeout callbacks
  useEffect(() => {
    bmoStateRef.current = { bmoIsAwake, bmoExpression, isAnimating };
  }, [bmoIsAwake, bmoExpression, isAnimating]);

  // Global click/tap handler - triggers random expression on clicks outside BMO
  useEffect(() => {
    let touchStartY = 0;
    let touchStartTime = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndY = e.changedTouches[0].clientY;
      const touchDuration = Date.now() - touchStartTime;
      const touchDistance = Math.abs(touchEndY - touchStartY);
      const wasTap = touchDuration < 300 && touchDistance < 10;
      if (wasTap && bmoRef.current && !bmoRef.current.contains(e.target as Node)) {
        showRandomExpression();
      }
    };

    const handlePageClick = (e: MouseEvent) => {
      if (bmoRef.current && !bmoRef.current.contains(e.target as Node)) {
        showRandomExpression();
      }
    };

    document.addEventListener('click', handlePageClick);
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);
    return () => {
      document.removeEventListener('click', handlePageClick);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [showRandomExpression]);

  // Boot sequence on mount
  useEffect(() => {
    setShowSpinner(true);

    safeSetTimeout(() => {
      setBmoExpression('powering');
      const faceContent = bmoRef.current?.querySelector('[data-bmo-face]') as HTMLElement | null;
      if (faceContent) {
        faceContent.classList.add('pixelate-transition');
        setTimeout(() => { faceContent?.classList.remove('pixelate-transition'); }, 400);
      }
    }, 200);

    safeSetTimeout(() => {
      setShowSpinner(false);
      setBmoExpression('sleeping');
    }, 1200);

    const shouldYawn = Math.random() > 0.5;

    if (shouldYawn) {
      safeSetTimeout(() => setBmoExpression('yawn'), 1800);
      safeSetTimeout(() => setBmoExpression('sleeping'), 2200);
      safeSetTimeout(() => setBmoExpression('happy'), 2600);
    } else {
      safeSetTimeout(() => setBmoExpression('happy'), 1800);
    }

    safeSetTimeout(() => {
      setBmoExpression('veryHappy');
      setBmoBounce(true);
    }, shouldYawn ? 3000 : 2200);
    safeSetTimeout(() => setBmoBounce(false), shouldYawn ? 3900 : 3100);
    safeSetTimeout(() => {
      setBmoExpression('awake');
      setBmoIsAwake(true);
      setLastInteractionTime(Date.now());
      setIsBooting(false);
    }, shouldYawn ? 4200 : 3400);
  }, []);

  // Blink animations
  useEffect(() => {
    const performBlink = () => {
      if (!isHoveringBMO && bmoIsAwake && bmoExpression === 'awake' && !isAnimating) {
        const blinkType = Math.random();
        if (blinkType < 0.4) {
          safeSetTimeout(() => setBmoExpression('blinkClosed'), 0);
          safeSetTimeout(() => setBmoExpression('awake'), 150);
          safeSetTimeout(() => setBmoExpression('blinkClosed'), 300);
          safeSetTimeout(() => setBmoExpression('awake'), 450);
        } else if (blinkType < 0.6) {
          safeSetTimeout(() => setBmoExpression('blinkClosed'), 0);
          safeSetTimeout(() => setBmoExpression('awake'), 400);
        } else if (blinkType < 0.75) {
          safeSetTimeout(() => setBmoExpression('surprised'), 0);
          safeSetTimeout(() => setBmoExpression('awake'), 800);
        } else if (blinkType < 0.9) {
          safeSetTimeout(() => setBmoExpression('confused'), 0);
          safeSetTimeout(() => setBmoExpression('awake'), 1000);
        } else {
          safeSetTimeout(() => setBmoExpression('blinkClosed'), 0);
          safeSetTimeout(() => setBmoExpression('awake'), 120);
          safeSetTimeout(() => setBmoExpression('blinkClosed'), 240);
          safeSetTimeout(() => setBmoExpression('awake'), 360);
          safeSetTimeout(() => setBmoExpression('blinkClosed'), 480);
          safeSetTimeout(() => setBmoExpression('awake'), 600);
        }
      }
    };

    const randomInterval = Math.random() * (BLINK_MAX_INTERVAL_MS - BLINK_MIN_INTERVAL_MS) + BLINK_MIN_INTERVAL_MS;
    const blinkInterval = setInterval(performBlink, randomInterval);
    return () => clearInterval(blinkInterval);
  }, [isHoveringBMO, bmoIsAwake, isAnimating, bmoExpression]);

  // Sleep/wake cycle
  useEffect(() => {
    const sleepCheckInterval = setInterval(() => {
      const timeSinceLastInteraction = Date.now() - lastInteractionTime;

      if (bmoIsAwake && timeSinceLastInteraction > SLEEP_DELAY_MS) {
        if (!bmoBounce && !isAnimating) {
          setBmoExpression('sleeping');
          setBmoIsAwake(false);
          setHasShownBackInFive(false);
        }
      }

      if (!bmoIsAwake && timeSinceLastInteraction > DEEP_SLEEP_DELAY_MS &&
          bmoExpression === 'sleeping' && !hasShownBackInFive) {
        setHasShownBackInFive(true);
        setBmoExpression('yawn');
        safeSetTimeout(() => setBmoExpression('sleeping'), 800);
        safeSetTimeout(() => {
          const faceContent = bmoRef.current?.querySelector('[data-bmo-face]') as HTMLElement | null;
          if (faceContent) {
            faceContent.classList.add('pixelate-transition');
            setTimeout(() => {
              setBmoExpression('backInFiveMinutes');
              setTimeout(() => { faceContent?.classList.remove('pixelate-transition'); }, 200);
            }, 100);
          } else {
            setBmoExpression('backInFiveMinutes');
          }
        }, 1400);
      }
    }, 1000);

    return () => clearInterval(sleepCheckInterval);
  }, [lastInteractionTime, bmoIsAwake, hasShownBackInFive, bmoBounce, isAnimating, bmoExpression]);

  const wakeUpBMO = () => {
    setLastInteractionTime(Date.now());

    if (bmoExpression === 'backInFiveMinutes') {
      setHasShownBackInFive(false);
      const shouldYawn = Math.random() > 0.5;
      const faceContent = bmoRef.current?.querySelector('[data-bmo-face]') as HTMLElement | null;
      if (faceContent) {
        faceContent.classList.add('pixelate-transition');
        setTimeout(() => {
          setBmoExpression('sleeping');
          setTimeout(() => { faceContent?.classList.remove('pixelate-transition'); }, 200);
        }, 100);
      } else {
        setBmoExpression('sleeping');
      }

      if (shouldYawn) {
        safeSetTimeout(() => setBmoExpression('yawn'), 400);
        safeSetTimeout(() => setBmoExpression('sleeping'), 1000);
        safeSetTimeout(() => setBmoExpression('unhappy'), 1400);
        safeSetTimeout(() => setBmoExpression('sleeping'), 1550);
        safeSetTimeout(() => setBmoExpression('unhappy'), 1700);
        safeSetTimeout(() => setBmoExpression('sleeping'), 1850);
        safeSetTimeout(() => setBmoExpression('unhappy'), 2200);
        safeSetTimeout(() => setBmoExpression('sleeping'), 2500);
        safeSetTimeout(() => {
          setBmoExpression('awake');
          setBmoIsAwake(true);
          setBmoWiggle(true);
          safeSetTimeout(() => setBmoWiggle(false), 400);
        }, 3300);
      } else {
        safeSetTimeout(() => setBmoExpression('unhappy'), 400);
        safeSetTimeout(() => setBmoExpression('sleeping'), 550);
        safeSetTimeout(() => setBmoExpression('unhappy'), 700);
        safeSetTimeout(() => setBmoExpression('sleeping'), 850);
        safeSetTimeout(() => setBmoExpression('unhappy'), 1200);
        safeSetTimeout(() => setBmoExpression('sleeping'), 1500);
        safeSetTimeout(() => {
          setBmoExpression('awake');
          setBmoIsAwake(true);
          setBmoWiggle(true);
          safeSetTimeout(() => setBmoWiggle(false), 400);
        }, 2300);
      }
      return;
    }

    const isGrumpy = Math.random() > 0.5;
    const shouldYawn = Math.random() > 0.7;

    if (isGrumpy) {
      if (shouldYawn) {
        safeSetTimeout(() => setBmoExpression('yawn'), 200);
        safeSetTimeout(() => setBmoExpression('unhappy'), 800);
        safeSetTimeout(() => {
          setBmoExpression('awake');
          setBmoIsAwake(true);
          setBmoWiggle(true);
          safeSetTimeout(() => setBmoWiggle(false), 300);
        }, 1600);
      } else {
        setBmoExpression('unhappy');
        safeSetTimeout(() => {
          setBmoExpression('awake');
          setBmoIsAwake(true);
          setBmoWiggle(true);
          safeSetTimeout(() => setBmoWiggle(false), 300);
        }, 800);
      }
    } else {
      if (shouldYawn) {
        safeSetTimeout(() => setBmoExpression('yawn'), 200);
        safeSetTimeout(() => {
          setBmoExpression('awake');
          setBmoIsAwake(true);
          setBmoWiggle(true);
          safeSetTimeout(() => setBmoWiggle(false), 300);
        }, 800);
      } else {
        setBmoExpression('awake');
        setBmoIsAwake(true);
        setBmoWiggle(true);
        safeSetTimeout(() => setBmoWiggle(false), 300);
      }
    }
  };

  const handleBMOClick = () => {
    setLastInteractionTime(Date.now());
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    if (!bmoIsAwake) {
      wakeUpBMO();
    } else {
      const isVeryExcited = Math.random() > 0.5;
      if (isVeryExcited) {
        setIsAnimating(true);
        setBmoExpression('excited');
        setBmoBounce(true);
        safeSetTimeout(() => setBmoExpression('veryHappy'), 300);
        safeSetTimeout(() => setBmoExpression('excited'), 600);
        safeSetTimeout(() => {
          setBmoExpression('awake');
          setBmoBounce(false);
          setIsAnimating(false);
        }, 1200);
      } else {
        setIsAnimating(true);
        setBmoExpression('happy');
        setBmoBounce(true);
        safeSetTimeout(() => setBmoExpression('happy'), 300);
        safeSetTimeout(() => {
          setBmoExpression('awake');
          setBmoBounce(false);
          setIsAnimating(false);
        }, 800);
      }
    }
  };

  const faceBase = {
    width: '100%',
    height: '100%',
    backgroundColor: '#5eead4',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  } as const;

  const eyeRow = {
    display: 'flex',
    justifyContent: 'space-between',
    width: 40,
    marginBottom: 8,
  } as const;

  const bmoFaces: Record<BmoExpression, React.JSX.Element> = {
    powerOff: (
      <div data-bmo-face style={{ ...faceBase, backgroundColor: '#134e4a' }}></div>
    ),
    powering: (
      <div data-bmo-face style={faceBase}></div>
    ),
    yawn: (
      <div data-bmo-face style={faceBase}>
        <div style={eyeRow}>
          <div style={{ width: 8, height: 1, backgroundColor: 'black' }}></div>
          <div style={{ width: 8, height: 1, backgroundColor: 'black' }}></div>
        </div>
        <div style={{ width: 12, height: 8, border: '2px solid black', borderRadius: 9999, backgroundColor: '#5eead4' }}></div>
      </div>
    ),
    sleeping: (
      <div data-bmo-face style={faceBase}>
        <div style={eyeRow}>
          <div style={{ width: 8, height: 1, backgroundColor: 'black' }}></div>
          <div style={{ width: 8, height: 1, backgroundColor: 'black' }}></div>
        </div>
        <div style={{ width: 24, height: 1, backgroundColor: 'black' }}></div>
      </div>
    ),
    awake: (
      <div data-bmo-face style={faceBase}>
        <div style={eyeRow}>
          <div style={{ width: 4, height: 4, borderRadius: 9999, backgroundColor: 'black' }}></div>
          <div style={{ width: 4, height: 4, borderRadius: 9999, backgroundColor: 'black' }}></div>
        </div>
        <div style={{ width: 24, height: 1, backgroundColor: 'black' }}></div>
      </div>
    ),
    blinkClosed: (
      <div data-bmo-face style={faceBase}>
        <div style={eyeRow}>
          <div style={{ width: 8, height: 1, backgroundColor: 'black' }}></div>
          <div style={{ width: 8, height: 1, backgroundColor: 'black' }}></div>
        </div>
        <div style={{ width: 24, height: 1, backgroundColor: 'black' }}></div>
      </div>
    ),
    surprised: (
      <div data-bmo-face style={faceBase}>
        <div style={eyeRow}>
          <div style={{ width: 6, height: 6, borderRadius: 9999, backgroundColor: 'black' }}></div>
          <div style={{ width: 6, height: 6, borderRadius: 9999, backgroundColor: 'black' }}></div>
        </div>
        <div style={{ width: 12, height: 4, borderRadius: 9999, backgroundColor: 'black' }}></div>
      </div>
    ),
    smile: (
      <div data-bmo-face style={faceBase}>
        <div style={eyeRow}>
          <div style={{ width: 8, height: 1, backgroundColor: 'black' }}></div>
          <div style={{ width: 8, height: 1, backgroundColor: 'black' }}></div>
        </div>
        <div style={{ width: 20, height: 2, backgroundColor: 'black', borderRadius: 9999 }}></div>
      </div>
    ),
    happy: (
      <div data-bmo-face style={faceBase}>
        <div style={eyeRow}>
          <div style={{ width: 12, height: 6, borderTop: '1px solid black', borderRadius: 9999 }}></div>
          <div style={{ width: 12, height: 6, borderTop: '1px solid black', borderRadius: 9999 }}></div>
        </div>
        <div style={{ width: 20, height: 4, backgroundColor: 'black', borderRadius: 9999 }}></div>
      </div>
    ),
    veryHappy: (
      <div data-bmo-face style={faceBase}>
        <div style={eyeRow}>
          <div style={{ width: 10, height: 8, borderTop: '1px solid black', borderLeft: '1px solid black', transform: 'rotate(45deg)' }}></div>
          <div style={{ width: 10, height: 8, borderTop: '1px solid black', borderRight: '1px solid black', transform: 'rotate(-45deg)' }}></div>
        </div>
        <div style={{ width: 20, height: 4, backgroundColor: 'black', borderRadius: 9999 }}></div>
      </div>
    ),
    excited: (
      <div data-bmo-face style={faceBase}>
        <div style={eyeRow}>
          <div style={{ width: 10, height: 8, borderTop: '1px solid black', borderLeft: '1px solid black', transform: 'rotate(45deg)' }}></div>
          <div style={{ width: 10, height: 8, borderTop: '1px solid black', borderRight: '1px solid black', transform: 'rotate(-45deg)' }}></div>
        </div>
        <div style={{ width: 20, height: 6, backgroundColor: 'black', borderRadius: 9999 }}></div>
      </div>
    ),
    unhappy: (
      <div data-bmo-face style={faceBase}>
        <div style={eyeRow}>
          <div style={{ width: 8, height: 4, backgroundColor: 'black' }}></div>
          <div style={{ width: 8, height: 4, backgroundColor: 'black' }}></div>
        </div>
        <div style={{ width: 16, height: 2, backgroundColor: 'black', borderRadius: 9999, transform: 'scaleY(-1)' }}></div>
      </div>
    ),
    confused: (
      <div data-bmo-face style={faceBase}>
        <div style={eyeRow}>
          <div style={{ width: 4, height: 4, borderRadius: 9999, backgroundColor: 'black' }}></div>
          <div style={{ width: 4, height: 4, borderRadius: 9999, backgroundColor: 'black' }}></div>
        </div>
        <svg width="20" height="6" viewBox="0 0 20 6">
          <path d="M 2 3 Q 5 1, 10 3 T 18 3" stroke="black" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
      </div>
    ),
    silly: (
      <div data-bmo-face style={faceBase}>
        <div style={eyeRow}>
          <div style={{ width: 4, height: 4, borderRadius: 9999, backgroundColor: 'black' }}></div>
          <div style={{ width: 4, height: 4, borderRadius: 9999, backgroundColor: 'black' }}></div>
        </div>
        <span style={{ color: 'black', fontSize: 12, letterSpacing: '-0.25em', marginLeft: '-0.125em' }}>)——(</span>
      </div>
    ),
    backInFiveMinutes: (
      <div data-bmo-face style={{ ...faceBase, padding: 4 }}>
        <div style={{ color: 'black', fontSize: 9, fontWeight: 'bold', lineHeight: 1.25, textAlign: 'center' }}>
          BACK<br />IN<br />5 MINUTES
        </div>
      </div>
    ),
  };

  return (
    <>
      <style>{`
        @keyframes pixelate {
          0%, 100% { filter: blur(0px); opacity: 1; }
          50% { filter: blur(2px); opacity: 0.7; }
        }
        .pixelate-transition { animation: pixelate 0.2s ease-in-out; }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        .bmo-bounce { animation: bounce 0.3s ease-in-out infinite; }
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-3deg); }
          75% { transform: rotate(3deg); }
        }
        .bmo-wiggle { animation: wiggle 0.3s ease-in-out; }
        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        .loading-dots { display: flex; gap: 3px; align-items: center; }
        .loading-dots div { width: 3px; height: 3px; background: black; opacity: 0.3; }
        .loading-dots div:nth-child(1) { animation: blink 0.9s step-end infinite; animation-delay: 0s; }
        .loading-dots div:nth-child(2) { animation: blink 0.9s step-end infinite; animation-delay: 0.3s; }
        .loading-dots div:nth-child(3) { animation: blink 0.9s step-end infinite; animation-delay: 0.6s; }
        .bmo-container { transition: box-shadow 0.15s; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); }
        .bmo-container:hover { box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); }
      `}</style>
      <div
        ref={bmoRef}
        role="button"
        tabIndex={0}
        style={{ cursor: 'pointer' }}
        className={`${bmoBounce ? 'bmo-bounce' : ''} ${bmoWiggle ? 'bmo-wiggle' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          if (isBooting) return;
          handleBMOClick();
        }}
        onKeyDown={(e) => {
          if (isBooting) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleBMOClick();
          }
        }}
        onMouseEnter={() => {
          if (isBooting) return;
          setIsHoveringBMO(true);
          setLastInteractionTime(Date.now());
          if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
          if (isAnimating) return;
          if (bmoExpression === 'backInFiveMinutes') {
            setBmoWiggle(true);
            safeSetTimeout(() => setBmoWiggle(false), 300);
            wakeUpBMO();
            return;
          }
          if (!bmoIsAwake) {
            wakeUpBMO();
          } else if (bmoExpression === 'awake') {
            hoverTimeoutRef.current = setTimeout(() => {
              const { bmoIsAwake: isAwake, bmoExpression: expr, isAnimating: animating } = bmoStateRef.current;
              if (isAwake && expr === 'awake' && !animating) {
                setIsAnimating(true);
                setBmoExpression('happy');
                setBmoWiggle(true);
                safeSetTimeout(() => setBmoWiggle(false), 300);
              }
            }, HOVER_DELAY_MS);
          }
        }}
        onMouseLeave={() => {
          setIsHoveringBMO(false);
          if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
          }
          if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
          if (bmoExpression === 'happy' && bmoIsAwake) {
            leaveTimeoutRef.current = setTimeout(() => {
              if (bmoStateRef.current.bmoExpression === 'happy') {
                setBmoExpression('awake');
                setIsAnimating(false);
              }
            }, LEAVE_DELAY_MS);
          }
        }}
        aria-label="BMO companion - click or press Enter to interact"
      >
        <div
          className="bmo-container"
          style={{
            width: 64,
            height: 48,
            backgroundColor: '#2dd4bf',
            borderRadius: 4,
            border: '2px solid black',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {bmoFaces[bmoExpression]}
          {showSpinner && (bmoExpression === 'powerOff' || bmoExpression === 'powering') && (
            <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="loading-dots">
                <div></div>
                <div></div>
                <div></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
