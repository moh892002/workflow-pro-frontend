import React, { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../../context/AuthContext";
import { ThemeProvider } from "../../context/ThemeContext";
import { LanguageProvider } from "../../context/LanguageContext";
import { User } from "../../types";

interface RenderWithProvidersOptions extends Omit<RenderOptions, "wrapper"> {
  route?: string;
  user?: User | null;
}

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

function AllProviders({ children, route }: { children: React.ReactNode; route?: string }) {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={route ? [route] : undefined}>
        <AuthProvider>
          <ThemeProvider>
            <LanguageProvider>{children}</LanguageProvider>
          </ThemeProvider>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

export function renderWithProviders(
  ui: ReactElement,
  { route, ...renderOptions }: RenderWithProvidersOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <AllProviders route={route}>{children}</AllProviders>;
  }
  return render(ui, { wrapper: Wrapper, ...renderOptions });
}
