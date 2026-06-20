import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../helpers/wrappers";
import { Tasks } from "../../pages/Tasks";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

async function setupAuth() {
  localStorage.setItem("wfp_token", "mock-token-123");
  localStorage.setItem("wfp_last_active", Date.now().toString());
}

describe("Tasks page", () => {
  beforeEach(() => {
    localStorage.clear();
    mockNavigate.mockClear();
  });

  it("renders the tasks heading", async () => {
    await setupAuth();
    renderWithProviders(<Tasks />, { route: "/tasks" });
    await waitFor(() => {
      expect(screen.getByText(/tasks/i)).toBeInTheDocument();
    });
  });

  it("renders task cards after loading", async () => {
    await setupAuth();
    renderWithProviders(<Tasks />, { route: "/tasks" });
    await waitFor(() => {
      expect(screen.getByText("Q1 Sales Report")).toBeInTheDocument();
    });
    expect(screen.getByText("Recruitment Plan")).toBeInTheDocument();
  });

  it("renders the search input", async () => {
    await setupAuth();
    renderWithProviders(<Tasks />, { route: "/tasks" });
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });
  });

  it("filters tasks by search input", async () => {
    await setupAuth();
    const user = userEvent.setup();
    renderWithProviders(<Tasks />, { route: "/tasks" });

    await waitFor(() => {
      expect(screen.getByText("Q1 Sales Report")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, "Recruitment");

    expect(screen.queryByText("Q1 Sales Report")).not.toBeInTheDocument();
    expect(screen.getByText("Recruitment Plan")).toBeInTheDocument();
  });

  it("shows status dropdown for each task", async () => {
    await setupAuth();
    renderWithProviders(<Tasks />, { route: "/tasks" });

    await waitFor(() => {
      const selects = screen.getAllByRole("combobox");
      expect(selects.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("opens create task modal for admin", async () => {
    await setupAuth();
    const user = userEvent.setup();
    renderWithProviders(<Tasks />, { route: "/tasks" });

    await waitFor(() => {
      expect(screen.getByText(/Create New Task/i)).toBeInTheDocument();
    });

    await user.click(screen.getByText(/Create New Task/i));

    await waitFor(() => {
      expect(screen.getByText(/title/i)).toBeInTheDocument();
      expect(screen.getByText(/description/i)).toBeInTheDocument();
      expect(screen.getByText(/priority/i)).toBeInTheDocument();
      expect(screen.getByText(/deadline/i)).toBeInTheDocument();
    });
  });
});
