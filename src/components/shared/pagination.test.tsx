import { afterEach, describe, expect, it } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { Pagination } from "@/components/shared/pagination";

afterEach(cleanup);

function makeHref(page: number) {
  return `/orders?page=${page}`;
}

describe("Pagination", () => {
  it("renders nothing when there's only one page", () => {
    const { container } = render(<Pagination currentPage={1} totalPages={1} makeHref={makeHref} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a link for every page when there are few", () => {
    render(<Pagination currentPage={2} totalPages={3} makeHref={makeHref} />);
    for (const page of [1, 2, 3]) {
      expect(screen.getByRole("link", { name: String(page) })).toHaveAttribute("href", `/orders?page=${page}`);
    }
  });

  it("marks the current page with aria-current", () => {
    render(<Pagination currentPage={2} totalPages={3} makeHref={makeHref} />);
    expect(screen.getByRole("link", { name: "2" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "1" })).not.toHaveAttribute("aria-current");
  });

  it("shows ellipses and windows around the current page for many pages", () => {
    render(<Pagination currentPage={10} totalPages={20} makeHref={makeHref} />);
    expect(screen.getAllByText("…")).toHaveLength(2);
    for (const page of [1, 9, 10, 11, 20]) {
      expect(screen.getByRole("link", { name: String(page) })).toBeInTheDocument();
    }
    expect(screen.queryByRole("link", { name: "5" })).not.toBeInTheDocument();
  });

  it("disables Previous on the first page and Next on the last page", () => {
    render(<Pagination currentPage={1} totalPages={3} makeHref={makeHref} />);
    expect(screen.getByRole("link", { name: /previous/i })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("link", { name: /next/i })).not.toHaveAttribute("aria-disabled");
  });

  it("links Previous/Next to the adjacent page", () => {
    render(<Pagination currentPage={2} totalPages={3} makeHref={makeHref} />);
    expect(screen.getByRole("link", { name: /previous/i })).toHaveAttribute("href", "/orders?page=1");
    expect(screen.getByRole("link", { name: /next/i })).toHaveAttribute("href", "/orders?page=3");
  });
});
