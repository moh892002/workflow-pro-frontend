import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../helpers/wrappers";
import { Reports } from "../../pages/Reports";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

async function setupAuth() {
  localStorage.setItem("wfp_token", "mock-token-123");
  localStorage.setItem("wfp_last_active", Date.now().toString());
}

describe("Reports page", () => {
  beforeEach(() => {
    localStorage.clear();
    mockNavigate.mockClear();
  });

  it("renders reports heading", async () => {
    await setupAuth();
    renderWithProviders(<Reports />, { route: "/reports" });
    await waitFor(() => {
      expect(screen.getByText(/reports/i)).toBeInTheDocument();
    });
  });

  it("renders employee select dropdown", async () => {
    await setupAuth();
    renderWithProviders(<Reports />, { route: "/reports" });
    await waitFor(() => {
      expect(screen.getByText(/select employee/i)).toBeInTheDocument();
    });
  });

  it("renders date inputs", async () => {
    await setupAuth();
    renderWithProviders(<Reports />, { route: "/reports" });
    await waitFor(() => {
      expect(screen.getByText(/date from/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/date to/i)).toBeInTheDocument();
  });

  it("renders generate report button", async () => {
    await setupAuth();
    renderWithProviders(<Reports />, { route: "/reports" });
    await waitFor(() => {
      expect(screen.getByText(/generate/i)).toBeInTheDocument();
    });
  });
});
