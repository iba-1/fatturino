import { render, screen } from "@testing-library/react";
import { FullPageLoader } from "@/components/FullPageLoader";

describe("FullPageLoader", () => {
  it("renders the Fatturino wordmark", () => {
    render(<FullPageLoader />);
    expect(screen.getByText("Fatturino")).toBeInTheDocument();
  });

  it("renders a status spinner", () => {
    const { container } = render(<FullPageLoader />);
    expect(container.querySelector('[role="status"]')).toBeInTheDocument();
  });

  it("announces loading state to screen readers", () => {
    const { container } = render(<FullPageLoader />);
    const spinner = container.querySelector('[role="status"]');
    expect(spinner).toHaveAttribute("aria-label", "Loading");
  });
});
