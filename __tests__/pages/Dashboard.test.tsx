import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../helpers/wrappers";
import { Dashboard } from "../../pages/Dashboard";

async function setupAuth() {
  localStorage.setItem("wfp_token", "mock-token-123");
  localStorage.setItem("wfp_last_active", Date.now().toString());
}

describe("Dashboard page", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders the dashboard heading", async () => {
    await setupAuth();
    renderWithProviders(<Dashboard />, { route: "/" });
    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    });
  });

  it("renders stat cards after loading", async () => {
    await setupAuth();
    renderWithProviders(<Dashboard />, { route: "/" });
    await waitFor(() => {
      expect(screen.getByText(/active tasks/i)).toBeInTheDocument();
    });
    expect(screen.getByText("Completed Tasks")).toBeInTheDocument();
    expect(screen.getByText("Overdue Tasks")).toBeInTheDocument();
  });

  it("renders the AI analyze button", async () => {
    await setupAuth();
    renderWithProviders(<Dashboard />, { route: "/" });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /analyze/i })).toBeInTheDocument();
    });
  });

  it("renders recent activity section", async () => {
    await setupAuth();
    renderWithProviders(<Dashboard />, { route: "/" });
    await waitFor(() => {
      expect(screen.getByText(/recent activity/i)).toBeInTheDocument();
    });
  });
});
