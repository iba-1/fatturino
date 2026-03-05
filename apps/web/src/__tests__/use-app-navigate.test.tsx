import { renderHook } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { useAppNavigate } from "@/hooks/use-app-navigate";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

describe("useAppNavigate", () => {
  beforeEach(() => mockNavigate.mockClear());

  it("adds viewTransition: true automatically", () => {
    const { result } = renderHook(() => useAppNavigate(), {
      wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter>,
    });
    result.current("/invoices");
    expect(mockNavigate).toHaveBeenCalledWith("/invoices", { viewTransition: true });
  });

  it("merges caller options, keeping viewTransition", () => {
    const { result } = renderHook(() => useAppNavigate(), {
      wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter>,
    });
    result.current("/invoices", { replace: true });
    expect(mockNavigate).toHaveBeenCalledWith("/invoices", {
      replace: true,
      viewTransition: true,
    });
  });

  it("passes numeric delta directly without options", () => {
    const { result } = renderHook(() => useAppNavigate(), {
      wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter>,
    });
    result.current(-1);
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
