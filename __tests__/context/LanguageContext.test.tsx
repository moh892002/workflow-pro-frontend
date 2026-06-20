import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useLanguage, LanguageProvider } from "../../context/LanguageContext";

function TestComponent() {
  const { lang, toggleLanguage, t, dir } = useLanguage();
  return (
    <div>
      <div data-testid="lang">{lang}</div>
      <div data-testid="dir">{dir}</div>
      <div data-testid="translated">{t("tasks")}</div>
      <div data-testid="missing-key">{t("nonexistent_key")}</div>
      <button data-testid="toggle-btn" onClick={toggleLanguage}>
        Toggle
      </button>
    </div>
  );
}

function renderWithLanguage() {
  return render(
    <LanguageProvider>
      <TestComponent />
    </LanguageProvider>
  );
}

describe("LanguageContext", () => {
  beforeEach(() => {
    document.documentElement.lang = "";
    document.documentElement.dir = "";
    document.body.classList.remove("rtl");
  });

  it("defaults to English", () => {
    renderWithLanguage();
    expect(screen.getByTestId("lang")).toHaveTextContent("en");
    expect(screen.getByTestId("dir")).toHaveTextContent("ltr");
  });

  it("toggles to Arabic", async () => {
    const user = userEvent.setup();
    renderWithLanguage();
    await user.click(screen.getByTestId("toggle-btn"));
    expect(screen.getByTestId("lang")).toHaveTextContent("ar");
    expect(screen.getByTestId("dir")).toHaveTextContent("rtl");
  });

  it("returns translation for existing key", () => {
    renderWithLanguage();
    expect(screen.getByTestId("translated")).toHaveTextContent("Tasks");
  });

  it("returns key when translation is missing", () => {
    renderWithLanguage();
    expect(screen.getByTestId("missing-key")).toHaveTextContent("nonexistent_key");
  });

  it("sets document.documentElement attributes", async () => {
    const user = userEvent.setup();
    renderWithLanguage();
    expect(document.documentElement.lang).toBe("en");
    expect(document.documentElement.dir).toBe("ltr");

    await user.click(screen.getByTestId("toggle-btn"));
    expect(document.documentElement.lang).toBe("ar");
    expect(document.documentElement.dir).toBe("rtl");
  });

  it("adds rtl class to body in Arabic", async () => {
    const user = userEvent.setup();
    renderWithLanguage();
    expect(document.body.classList.contains("rtl")).toBe(false);

    await user.click(screen.getByTestId("toggle-btn"));
    expect(document.body.classList.contains("rtl")).toBe(true);
  });
});
