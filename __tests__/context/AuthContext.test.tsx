import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { useAuth, AuthProvider } from "../../context/AuthContext";

function TestComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();
  return (
    <div>
      <div data-testid="auth-status">
        {isAuthenticated ? "authenticated" : "unauthenticated"}
      </div>
      {user && <div data-testid="user-name">{user.fullName}</div>}
      <button data-testid="login-btn" onClick={() => login("admin@example.com", "password")}>
        Login
      </button>
      <button data-testid="login-fail-btn" onClick={() => login("wrong@email.com", "wrongpass")}>
        LoginFail
      </button>
      <button data-testid="logout-btn" onClick={() => logout()}>
        Logout
      </button>
    </div>
  );
}

function renderWithAuth() {
  return render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts unauthenticated", () => {
    renderWithAuth();
    expect(screen.getByTestId("auth-status")).toHaveTextContent("unauthenticated");
  });

  it("logs in with valid credentials", async () => {
    renderWithAuth();
    screen.getByTestId("login-btn").click();

    await waitFor(() => {
      expect(screen.getByTestId("auth-status")).toHaveTextContent("authenticated");
    });
    expect(screen.getByTestId("user-name")).toHaveTextContent("Abdalraheem Fadda");
    expect(localStorage.getItem("wfp_token")).toBe("mock-token-123");
  });

  it("returns false for invalid credentials", async () => {
    renderWithAuth();
    screen.getByTestId("login-fail-btn").click();

    await waitFor(() => {
      expect(screen.getByTestId("auth-status")).toHaveTextContent("unauthenticated");
    });
    expect(localStorage.getItem("wfp_token")).toBeNull();
  });

  it("logs out and clears state", async () => {
    localStorage.setItem("wfp_token", "mock-token-123");
    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByTestId("auth-status")).toHaveTextContent("authenticated");
    });

    screen.getByTestId("logout-btn").click();

    await waitFor(() => {
      expect(screen.getByTestId("auth-status")).toHaveTextContent("unauthenticated");
    });
    expect(localStorage.getItem("wfp_token")).toBeNull();
  });

  it("restores session from token on mount", async () => {
    localStorage.setItem("wfp_token", "existing-token");
    localStorage.setItem("wfp_last_active", Date.now().toString());

    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByTestId("auth-status")).toHaveTextContent("authenticated");
    });
  });

  it("stays unauthenticated when session check returns 401", async () => {
    localStorage.setItem("wfp_token", "expired-token");
    localStorage.setItem("wfp_last_active", Date.now().toString());

    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByTestId("auth-status")).toHaveTextContent("unauthenticated");
    });
  });
});
