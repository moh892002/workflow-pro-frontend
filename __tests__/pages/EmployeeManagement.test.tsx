import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../helpers/wrappers";
import { EmployeeManagement } from "../../pages/EmployeeManagement";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

async function setupAuth() {
  localStorage.setItem("wfp_token", "mock-token-123");
  localStorage.setItem("wfp_last_active", Date.now().toString());
}

describe("EmployeeManagement page", () => {
  beforeEach(() => {
    localStorage.clear();
    mockNavigate.mockClear();
  });

  it("renders employee heading", async () => {
    await setupAuth();
    renderWithProviders(<EmployeeManagement />, { route: "/employees" });
    await waitFor(() => {
      expect(screen.getByText(/employees/i)).toBeInTheDocument();
    });
  });

  it("renders employee cards after loading", async () => {
    await setupAuth();
    renderWithProviders(<EmployeeManagement />, { route: "/employees" });
    await waitFor(() => {
      expect(screen.getByText(/abdalraheem fadda/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/jane employee/i)).toBeInTheDocument();
  });

  it("renders add employee button for admin", async () => {
    await setupAuth();
    renderWithProviders(<EmployeeManagement />, { route: "/employees" });
    await waitFor(() => {
      expect(screen.getByText(/add.employee/i)).toBeInTheDocument();
    });
  });

  it("opens add employee modal", async () => {
    await setupAuth();
    const user = userEvent.setup();
    renderWithProviders(<EmployeeManagement />, { route: "/employees" });

    await waitFor(() => {
      expect(screen.getByText(/add.employee/i)).toBeInTheDocument();
    });

    await user.click(screen.getByText(/add.employee/i));

    await waitFor(() => {
      expect(screen.getByText(/full.name/i)).toBeInTheDocument();
    });
  });

  it("shows requests tab for admin", async () => {
    await setupAuth();
    renderWithProviders(<EmployeeManagement />, { route: "/employees" });
    await waitFor(() => {
      expect(screen.getByText(/requests/i)).toBeInTheDocument();
    });
  });
});
