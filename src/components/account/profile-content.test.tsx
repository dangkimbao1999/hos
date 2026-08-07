import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const toastCalls: { type: "error" | "success"; message: string }[] = [];
mock.module("sonner", () => ({
  toast: {
    error: (message: string) => toastCalls.push({ type: "error", message }),
    success: (message: string) => toastCalls.push({ type: "success", message }),
  },
}));

mock.module("next/navigation", () => ({
  useRouter: () => ({ refresh: () => {} }),
}));

mock.module("@/lib/supabase/profile-actions", () => ({
  updateProfile: async () => ({ success: true }),
}));

mock.module("@/lib/supabase/storage-actions", () => ({
  uploadAvatar: async () => ({ success: true, url: "https://example.com/avatar.png" }),
  uploadCover: async () => ({ success: true, url: "https://example.com/cover.png" }),
  uploadGalleryImage: async () => ({ success: true, url: "https://example.com/gallery.png" }),
  removeGalleryImage: async () => ({ success: true }),
}));

import { ProfileContent } from "@/components/account/profile-content";
import type { CurrentUser } from "@/lib/supabase/types";

afterEach(() => {
  cleanup();
  toastCalls.length = 0;
});

function makeProfile(overrides: Partial<CurrentUser> = {}): CurrentUser {
  return {
    id: "user-1",
    role: "talent",
    slug: "test-user",
    full_name: "Test User",
    avatar_url: null,
    bio: null,
    city_id: null,
    keywords: [],
    kyc_status: "verified",
    notifications_read_at: null,
    created_at: new Date().toISOString(),
    email: "test@example.com",
    cover_url: null,
    gallery_urls: [],
    social_links: [],
    achievements: [],
    services: [],
    date_of_birth: null,
    genre_id: null,
    category_id: null,
    subcategory_id: null,
    ...overrides,
  };
}

const LOOKUP_PROPS = { categories: [], cities: [], genres: [] };

describe("ProfileContent — Social Profile", () => {
  it("adds a row each time Add Social Link is clicked, for every role", () => {
    render(<ProfileContent role="organizer" profile={makeProfile({ role: "organizer" })} {...LOOKUP_PROPS} />);
    const addButton = screen.getByRole("button", { name: /add social link/i });
    expect(screen.queryAllByPlaceholderText("https://...")).toHaveLength(0);
    fireEvent.click(addButton);
    expect(screen.queryAllByPlaceholderText("https://...")).toHaveLength(1);
    fireEvent.click(addButton);
    expect(screen.queryAllByPlaceholderText("https://...")).toHaveLength(2);
  });

  it("renders Social Profile for Talent too, not just Organizer/Agency", () => {
    render(<ProfileContent role="talent" profile={makeProfile()} {...LOOKUP_PROPS} />);
    expect(screen.getByText("Social Profile")).toBeInTheDocument();
  });
});

describe("ProfileContent — Achievement", () => {
  it("adds a title + subtitle row when Add Achievement is clicked", () => {
    render(<ProfileContent role="talent" profile={makeProfile()} {...LOOKUP_PROPS} />);
    fireEvent.click(screen.getByRole("button", { name: /add achievement/i }));
    expect(screen.getByPlaceholderText("e.g. 2023 Nominee - BET Award")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g. Video Director of the Year")).toBeInTheDocument();
  });
});

describe("ProfileContent — Services", () => {
  it("adds a free-text row when Add Services is clicked", () => {
    render(<ProfileContent role="talent" profile={makeProfile()} {...LOOKUP_PROPS} />);
    fireEvent.click(screen.getByRole("button", { name: /add services/i }));
    expect(screen.getByPlaceholderText(/rapper performs for music festival/i)).toBeInTheDocument();
  });
});

describe("ProfileContent — cover photo", () => {
  it("renders a cover upload input for Talent only", () => {
    render(<ProfileContent role="talent" profile={makeProfile()} {...LOOKUP_PROPS} />);
    expect(document.querySelectorAll('input[type="file"]')).toHaveLength(3);
  });

  it("renders no cover upload input for Organizer", () => {
    render(<ProfileContent role="organizer" profile={makeProfile({ role: "organizer" })} {...LOOKUP_PROPS} />);
    expect(document.querySelectorAll('input[type="file"]')).toHaveLength(2);
  });
});

describe("ProfileContent — thumbnail gallery", () => {
  it("shows an upload slot when under 5 images", () => {
    render(
      <ProfileContent role="talent" profile={makeProfile({ gallery_urls: ["https://x/1.png"] })} {...LOOKUP_PROPS} />
    );
    expect(screen.getAllByAltText("")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Add thumbnail" })).toBeInTheDocument();
  });

  it("hides the upload slot once 5 images are present", () => {
    const urls = [1, 2, 3, 4, 5].map((n) => `https://x/${n}.png`);
    render(<ProfileContent role="talent" profile={makeProfile({ gallery_urls: urls })} {...LOOKUP_PROPS} />);
    expect(screen.getAllByAltText("")).toHaveLength(5);
    expect(screen.queryByRole("button", { name: "Add thumbnail" })).not.toBeInTheDocument();
  });
});

describe("ProfileContent — toasts", () => {
  it("shows a success toast when Save changes succeeds", async () => {
    render(<ProfileContent role="talent" profile={makeProfile()} {...LOOKUP_PROPS} />);
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(toastCalls).toContainEqual({ type: "success", message: "Profile updated." });
  });
});
