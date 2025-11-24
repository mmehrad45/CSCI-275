import React from "react";
import { render, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "../AuthContext";
import { readJSON, writeJSON } from "@/lib/storage";

// Mock storage and router
jest.mock("@/lib/storage", () => ({
  readJSON: jest.fn(),
  writeJSON: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

// Simple component to trigger auth actions
function Dummy() {
  const auth = useAuth();
  return (
    <div>
      <div data-testid="authed">{String(auth.isAuthed)}</div>

      <button
        data-testid="login-ok"
        onClick={() => auth.login("john", "123")}
      />

      <button
        data-testid="login-bad"
        onClick={() => auth.login("", "")}
      />

      <button
        data-testid="logout"
        onClick={() => auth.logout()}
      />
    </div>
  );
}

describe("AuthContext basic tests", () => {
  beforeEach(() => jest.clearAllMocks());

  test("successful login sets authenticated state", async () => {
    (readJSON as jest.Mock).mockReturnValue(null);

    const { getByTestId } = render(
      <AuthProvider><Dummy /></AuthProvider>
    );

    await act(async () => getByTestId("login-ok").click());

    expect(writeJSON).toHaveBeenCalled(); 
    expect(getByTestId("authed").textContent).toBe("true");
  });

  test("failed login keeps unauthenticated state", async () => {
    (readJSON as jest.Mock).mockReturnValue(null);

    const { getByTestId } = render(
      <AuthProvider><Dummy /></AuthProvider>
    );

    await act(async () => getByTestId("login-bad").click());

    expect(writeJSON).not.toHaveBeenCalled();
    expect(getByTestId("authed").textContent).toBe("false");
  });

  test("logout clears authentication", async () => {
    (readJSON as jest.Mock).mockReturnValue({
      username: "john",
      loggedInAt: Date.now(),
    });

    const { getByTestId } = render(
      <AuthProvider><Dummy /></AuthProvider>
    );

    await act(async () => getByTestId("logout").click());

    expect(writeJSON).toHaveBeenCalledWith("clinicflow_auth", null);
    expect(getByTestId("authed").textContent).toBe("false");
  });
});
