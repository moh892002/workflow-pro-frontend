import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../helpers/wrappers";
import Login from "../../pages/Login";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

describe("Login page", () => {
  beforeEach(() => {
    localStorage.clear();
    mockNavigate.mockClear();
  });

  it("renders email and password fields", () => {
    renderWithProviders(<Login />, { route: "/login" });
    expect(screen.getByText(/email/i)).toBeInTheDocument();
    expect(screen.getByText(/password/i)).toBeInTheDocument();
  });

  it("renders the login button", () => {
    renderWithProviders(<Login />, { route: "/login" });
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
  });

  it("shows error on failed login", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />, { route: "/login" });

    await user.type(screen.getByPlaceholderText("Email"), "wrong@email.com");
    await user.type(screen.getByPlaceholderText("Password"), "wrongpass");
    await user.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it("renders the app logo and title", () => {
    renderWithProviders(<Login />, { route: "/login" });
    expect(screen.getByText("WorkFlow Pro")).toBeInTheDocument();
    expect(screen.getByText("Enterprise Management System")).toBeInTheDocument();
  });
});
