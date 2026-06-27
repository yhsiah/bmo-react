import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import BMO from './BMO';

const SLEEP_DELAY_MS = 45000;
const DEEP_SLEEP_DELAY_MS = 90000;
const HOVER_DELAY_MS = 150;
const LEAVE_DELAY_MS = 150;

function getExpression() {
  return screen.getByRole('button').getAttribute('data-bmo-expression');
}

async function bootBMO() {
  render(<BMO />);
  // Math.random mocked to 0 → no yawn → boot completes in 3400ms
  await act(async () => await vi.advanceTimersByTimeAsync(3500));
  expect(getExpression()).toBe('awake');
}

describe('BMO', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // --- Smoke ---

  it('renders with a button role', () => {
    render(<BMO />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('has an accessible label', () => {
    render(<BMO />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-label');
  });

  // --- startBoot prop ---

  describe('startBoot prop', () => {
    it('stays in powerOff when startBoot is false', async () => {
      render(<BMO startBoot={false} />);
      await act(async () => await vi.advanceTimersByTimeAsync(5000));
      expect(getExpression()).toBe('powerOff');
    });

    it('boots to awake when startBoot defaults to true', async () => {
      render(<BMO />);
      await act(async () => await vi.advanceTimersByTimeAsync(3500));
      expect(getExpression()).toBe('awake');
    });

    it('boots when startBoot flips from false to true', async () => {
      const { rerender } = render(<BMO startBoot={false} />);
      await act(async () => await vi.advanceTimersByTimeAsync(1000));
      expect(getExpression()).toBe('powerOff');

      rerender(<BMO startBoot={true} />);
      await act(async () => await vi.advanceTimersByTimeAsync(3500));
      expect(getExpression()).toBe('awake');
    });
  });

  // --- Sleep / wake cycle ---

  describe('sleep/wake cycle', () => {
    it('falls asleep after inactivity', async () => {
      await bootBMO();
      await act(async () => await vi.advanceTimersByTimeAsync(SLEEP_DELAY_MS + 1000));
      expect(getExpression()).toBe('sleeping');
    });

    it('shows BACK IN 5 MINUTES after deep sleep', async () => {
      await bootBMO();
      // Advance past sleep threshold in stages so React re-renders between transitions
      await act(async () => await vi.advanceTimersByTimeAsync(SLEEP_DELAY_MS + 2000));
      expect(getExpression()).toBe('sleeping');
      await act(async () => await vi.advanceTimersByTimeAsync(DEEP_SLEEP_DELAY_MS - SLEEP_DELAY_MS + 2000));
      await act(async () => await vi.advanceTimersByTimeAsync(5000));
      expect(getExpression()).toBe('backInFiveMinutes');
      expect(screen.getByText(/BACK/)).toBeInTheDocument();
    });

    it('wakes up when clicked while sleeping', async () => {
      await bootBMO();
      await act(async () => await vi.advanceTimersByTimeAsync(SLEEP_DELAY_MS + 1000));
      expect(getExpression()).toBe('sleeping');

      await act(async () => {
        fireEvent.click(screen.getByRole('button'));
        await vi.advanceTimersByTimeAsync(2500);
      });
      expect(getExpression()).toBe('awake');
    });
  });

  // --- Click interactions ---

  describe('click while awake', () => {
    it('returns to awake after click animation completes', async () => {
      await bootBMO();
      await act(async () => {
        fireEvent.click(screen.getByRole('button'));
        await vi.advanceTimersByTimeAsync(1500);
      });
      expect(getExpression()).toBe('awake');
    });

    it('resets interaction timer so BMO does not immediately sleep after click', async () => {
      await bootBMO();
      // Advance close to sleep threshold
      await act(async () => await vi.advanceTimersByTimeAsync(SLEEP_DELAY_MS - 5000));
      // Click resets the timer
      fireEvent.click(screen.getByRole('button'));
      // Advance past the original threshold — BMO should still be awake
      await act(async () => await vi.advanceTimersByTimeAsync(6000));
      expect(getExpression()).not.toBe('sleeping');
    });
  });

  // --- Hover interactions ---

  describe('hover', () => {
    it('shows happy face after hovering', async () => {
      await bootBMO();
      await act(async () => {
        fireEvent.mouseEnter(screen.getByRole('button'));
        await vi.advanceTimersByTimeAsync(HOVER_DELAY_MS + 50);
      });
      expect(getExpression()).toBe('happy');
    });

    it('returns to awake when mouse leaves', async () => {
      await bootBMO();
      await act(async () => {
        fireEvent.mouseEnter(screen.getByRole('button'));
        await vi.advanceTimersByTimeAsync(HOVER_DELAY_MS + 50);
      });
      expect(getExpression()).toBe('happy');

      await act(async () => {
        fireEvent.mouseLeave(screen.getByRole('button'));
        await vi.advanceTimersByTimeAsync(LEAVE_DELAY_MS + 50);
      });
      expect(getExpression()).toBe('awake');
    });
  });

  // --- window.bmo easter egg ---

  describe('window.bmo easter egg', () => {
    it('registers window.bmo on mount', () => {
      render(<BMO />);
      expect((window as WindowWithBmo).bmo).toBeDefined();
    });

    it('exposes wake, sleep, and expression functions', () => {
      render(<BMO />);
      const bmo = (window as WindowWithBmo).bmo!;
      expect(typeof bmo.wake).toBe('function');
      expect(typeof bmo.sleep).toBe('function');
      expect(typeof bmo.expression).toBe('function');
    });

    it('exposes the full list of expressions', () => {
      render(<BMO />);
      const bmo = (window as WindowWithBmo).bmo!;
      expect(bmo.expressions).toContain('awake');
      expect(bmo.expressions).toContain('sleeping');
      expect(bmo.expressions).toContain('backInFiveMinutes');
    });

    it('removes window.bmo on unmount', () => {
      const { unmount } = render(<BMO />);
      unmount();
      expect((window as WindowWithBmo).bmo).toBeUndefined();
    });
  });
});

interface WindowWithBmo extends Window {
  bmo?: {
    expression: (expr: string) => void;
    wake: () => void;
    sleep: () => void;
    expressions: string[];
  };
}
