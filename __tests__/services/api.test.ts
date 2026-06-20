import { describe, it, expect, beforeEach } from "vitest";
import api from "../../services/api";

describe("api interceptor", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("attaches Authorization header when token exists", async () => {
    localStorage.setItem("wfp_token", "test-token-123");
    const response = await api.get("/user");
    expect(response.config.headers.Authorization).toBe("Bearer test-token-123");
  });

  it("does not attach Authorization header when no token exists", async () => {
    try {
      await api.get("/user");
    } catch (error: any) {
      expect(error.config.headers.Authorization).toBeUndefined();
    }
  });

  it("sets Content-Type to application/json", () => {
    expect(api.defaults.headers["Content-Type"]).toBe("application/json");
  });

  it("sets Accept to application/json", () => {
    expect(api.defaults.headers["Accept"]).toBe("application/json");
  });
});
