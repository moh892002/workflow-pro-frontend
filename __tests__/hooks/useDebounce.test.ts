import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDebounce } from "../../hooks/useDebounce";

describe("useDebounce", () => {
  afterEach(() => {
    vi.clearAllTimers();
  });

  it("returns the initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("hello", 500));
    expect(result.current).toBe("hello");
  });

  it("updates after the delay", async () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "hello", delay: 500 } }
    );

    expect(result.current).toBe("hello");

    rerender({ value: "world", delay: 500 });

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe("hello");

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe("world");

    vi.useRealTimers();
  });

  it("cancels previous timer on rapid changes", async () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "a", delay: 500 } }
    );

    rerender({ value: "b", delay: 500 });
    rerender({ value: "c", delay: 500 });

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current).toBe("c");

    vi.useRealTimers();
  });
});
