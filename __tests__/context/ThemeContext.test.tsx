import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useTheme, ThemeProvider } from "../../context/ThemeContext";

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({ user: null }),
}));

function TestComponent() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div>
      <div data-testid="theme">{theme}</div>
      <button data-testid="toggle-btn" onClick={toggleTheme}>
        Toggle
      </button>
    </div>
  );
}

function renderWithTheme() {
  return render(
    <ThemeProvider>
      <TestComponent />
    </ThemeProvider>
  );
}

describe("ThemeContext", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("light", "dark");
  });

  it("defaults to light when no preference saved", () => {
    renderWithTheme();
    expect(screen.getByTestId("theme")).toHaveTextContent("light");
  });

  it("toggles to dark and back", async () => {
    const user = userEvent.setup();
    renderWithTheme();
    expect(screen.getByTestId("theme")).toHaveTextContent("light");

    await user.click(screen.getByTestId("toggle-btn"));
    expect(screen.getByTestId("theme")).toHaveTextContent("dark");

    await user.click(screen.getByTestId("toggle-btn"));
    expect(screen.getByTestId("theme")).toHaveTextContent("light");
  });

  it("persists theme to localStorage", async () => {
    const user = userEvent.setup();
    renderWithTheme();
    expect(localStorage.getItem("wfp_theme")).toBe("light");

    await user.click(screen.getByTestId("toggle-btn"));
    expect(localStorage.getItem("wfp_theme")).toBe("dark");
  });

  it("loads theme from localStorage on mount", () => {
    localStorage.setItem("wfp_theme", "dark");
    renderWithTheme();
    expect(screen.getByTestId("theme")).toHaveTextContent("dark");
  });

  it("applies dark class to documentElement", async () => {
    const user = userEvent.setup();
    renderWithTheme();

    await user.click(screen.getByTestId("toggle-btn"));
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.classList.contains("light")).toBe(false);
  });

  it("removes previous theme class when toggling", async () => {
    const user = userEvent.setup();
    localStorage.setItem("wfp_theme", "dark");
    renderWithTheme();

    expect(document.documentElement.classList.contains("dark")).toBe(true);

    await user.click(screen.getByTestId("toggle-btn"));
    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});
