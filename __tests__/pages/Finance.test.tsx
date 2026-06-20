import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../helpers/wrappers";
import { Finance } from "../../pages/Finance";

async function setupAuth() {
  localStorage.setItem("wfp_token", "mock-token-123");
  localStorage.setItem("wfp_last_active", Date.now().toString());
}

describe("Finance page", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders finance heading", async () => {
    await setupAuth();
    renderWithProviders(<Finance />, { route: "/finance" });
    await waitFor(() => {
      expect(screen.getByText(/finance/i)).toBeInTheDocument();
    });
  });

  it("renders the records table after loading", async () => {
    await setupAuth();
    renderWithProviders(<Finance />, { route: "/finance" });
    await waitFor(() => {
      expect(screen.getByText(/monthly salary/i)).toBeInTheDocument();
    });
  });

  it("renders search input and filters", async () => {
    await setupAuth();
    renderWithProviders(<Finance />, { route: "/finance" });
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/all departments/i)).toBeInTheDocument();
    expect(screen.getByText(/all types/i)).toBeInTheDocument();
  });

  it("opens add record modal", async () => {
    await setupAuth();
    const user = userEvent.setup();
    renderWithProviders(<Finance />, { route: "/finance" });

    await waitFor(() => {
      expect(screen.getByText(/add.record/i)).toBeInTheDocument();
    });

    await user.click(screen.getByText(/add.record/i));

    await waitFor(() => {
      expect(screen.getByText(/select employee/i)).toBeInTheDocument();
    });
  });
});
