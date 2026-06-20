import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../helpers/wrappers";
import { Attendance } from "../../pages/Attendance";

async function setupAuth() {
  localStorage.setItem("wfp_token", "mock-token-123");
  localStorage.setItem("wfp_last_active", Date.now().toString());
}

describe("Attendance page", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders the attendance heading", async () => {
    await setupAuth();
    renderWithProviders(<Attendance />, { route: "/attendance" });
    await waitFor(() => {
      expect(screen.getByText(/attendance/i)).toBeInTheDocument();
    });
  });

  it("shows check-out button when already checked in", async () => {
    await setupAuth();
    renderWithProviders(<Attendance />, { route: "/attendance" });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /check out/i })).toBeInTheDocument();
    });
  });

  it("renders attendance history table", async () => {
    await setupAuth();
    renderWithProviders(<Attendance />, { route: "/attendance" });
    await waitFor(() => {
      expect(screen.getByText(/attendance history/i)).toBeInTheDocument();
    });
  });
});
