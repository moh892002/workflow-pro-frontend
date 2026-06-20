import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../helpers/wrappers";
import { RecycleBin } from "../../pages/RecycleBin";

async function setupAuth() {
  localStorage.setItem("wfp_token", "mock-token-123");
  localStorage.setItem("wfp_last_active", Date.now().toString());
}

describe("RecycleBin page", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders recycle bin heading", async () => {
    await setupAuth();
    renderWithProviders(<RecycleBin />, { route: "/recycle-bin" });
    await waitFor(() => {
      expect(screen.getByText(/recycle bin/i)).toBeInTheDocument();
    });
  });

  it("renders deleted items after loading", async () => {
    await setupAuth();
    renderWithProviders(<RecycleBin />, { route: "/recycle-bin" });
    await waitFor(() => {
      expect(screen.getByText(/old task/i)).toBeInTheDocument();
    });
  });

  it("shows restore and delete buttons for admin", async () => {
    await setupAuth();
    renderWithProviders(<RecycleBin />, { route: "/recycle-bin" });
    await waitFor(() => {
      expect(screen.getByText(/restore/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/permanent.delete/i)).toBeInTheDocument();
  });
});
