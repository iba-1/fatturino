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
});
