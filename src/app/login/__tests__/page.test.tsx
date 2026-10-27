import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { useIbanga } from "@/lib/store";
import LoginPage from "../page";

type LoginStore = Pick<ReturnType<typeof useIbanga>, "login" | "currentUser">;

const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
};

const mockSearchParams = {
  get: vi.fn(() => null),
};

const mockUseIbanga = vi.hoisted(() => vi.fn<() => LoginStore>());

vi.mock("@/lib/store", () => ({
  useIbanga: mockUseIbanga,
  dashboardPath: (role: string) =>
    role === "IMPORTER" ? "/dashboard/importer" : "/dashboard",
}));

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => mockSearchParams,
}));

vi.mock("@/lib/demo", () => ({
  demoAccounts: [],
  demoEnabled: false,
}));

vi.mock("@/components/auth-shell", () => ({
  AuthShell: ({ children }: { children: React.ReactNode }) => (
    <main>{children}</main>
  ),
}));

const importer = {
  id: "user-1",
  name: "Jeanine Importer",
  email: "jeanine@importco.rw",
  phone: "+250780000000",
  role: "IMPORTER" as const,
  location: "Kigali",
  active: true,
};

function renderLogin(overrides: Partial<LoginStore> = {}) {
  const login = vi.fn<LoginStore["login"]>().mockResolvedValue({
    user: null,
    error: null,
  });
  mockUseIbanga.mockReturnValue({
    login,
    currentUser: null,
    ...overrides,
  });

  render(<LoginPage />);
  return { login };
}

beforeEach(() => {
  mockRouter.push.mockReset();
  mockRouter.replace.mockReset();
  mockSearchParams.get.mockReset();
  mockSearchParams.get.mockReturnValue(null);
});

afterEach(() => {
  cleanup();
});

describe("LoginPage", () => {
  it("renders the login form with accessible controls", () => {
    renderLogin();

    expect(
      screen.getByRole("heading", { name: "Welcome back" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAttribute(
      "placeholder",
      "you@company.com",
    );
    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "placeholder",
      "••••••••",
    );
    expect(screen.getByRole("button", { name: /Continue/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Forgot password?" })).toHaveAttribute(
      "href",
      "/forgot-password",
    );
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
  });

  it("does not submit empty or invalid fields", () => {
    const { login } = renderLogin();
    const email = screen.getByLabelText("Email");
    const password = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: /Continue/ });

    fireEvent.click(submitButton);
    expect(login).not.toHaveBeenCalled();
    expect(email).toBeInvalid();
    expect(password).toBeInvalid();

    fireEvent.change(email, { target: { value: "not-an-email" } });
    fireEvent.change(password, { target: { value: "short" } });
    fireEvent.click(submitButton);

    expect(login).not.toHaveBeenCalled();
    expect(email).toBeInvalid();
    expect(password).toHaveAttribute("minlength", "6");
  });

  it("observes jsdom allowing a valid email with a five-character password to reach login", async () => {
    const { login } = renderLogin();
    const email = screen.getByLabelText("Email");
    const password = screen.getByLabelText("Password");

    fireEvent.change(email, { target: { value: "person@example.com" } });
    fireEvent.change(password, { target: { value: "short" } });

    expect(email).toBeValid();
    expect(password).toBeValid();
    fireEvent.click(screen.getByRole("button", { name: /Continue/ }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith("person@example.com", "short");
    });
  });

  it("accepts valid-looking credentials and passes them to login", async () => {
    const { login } = renderLogin();
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "person@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "correct-password" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Continue/ }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith(
        "person@example.com",
        "correct-password",
      );
    });
  });

  it("shows the authentication error and does not redirect after a failed login", async () => {
    const login = vi.fn<LoginStore["login"]>().mockResolvedValue({
      user: null,
      error: "Invalid email or password.",
    });
    renderLogin({ login });

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "person@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "wrong-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Continue/ }));

    expect(
      await screen.findByText("Invalid email or password."),
    ).toBeInTheDocument();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it("redirects to the authenticated user's dashboard after a successful login", async () => {
    const login = vi.fn<LoginStore["login"]>().mockResolvedValue({
      user: importer,
      error: null,
    });
    renderLogin({ login });

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: importer.email },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "correct-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Continue/ }));

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith("/dashboard/importer");
    });
  });

  it("disables the submit button while login is pending", async () => {
    let resolveLogin!: (result: Awaited<ReturnType<LoginStore["login"]>>) => void;
    const login = vi.fn<LoginStore["login"]>().mockImplementation(
      () => new Promise((resolve) => {
        resolveLogin = resolve;
      }),
    );
    renderLogin({ login });

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "person@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "correct-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Continue/ }));

    expect(await screen.findByRole("button", { name: /Signing in/ })).toBeDisabled();
    resolveLogin({ user: null, error: "Invalid email or password." });
  });

  it("toggles password visibility without changing the entered value", () => {
    renderLogin();
    const password = screen.getByLabelText("Password");

    fireEvent.change(password, { target: { value: "correct-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Show password" }));

    expect(password).toHaveAttribute("type", "text");
    expect(password).toHaveValue("correct-password");
    expect(screen.getByRole("button", { name: "Hide password" })).toBeInTheDocument();
  });

  it("redirects an already authenticated user to the role dashboard", async () => {
    renderLogin({ currentUser: importer });

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith("/dashboard/importer");
    });
  });
});
