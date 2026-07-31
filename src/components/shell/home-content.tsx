import Link from "next/link";
import { CardCarousel } from "@/components/shell/card-carousel";
import { ListingCard, ListingRow } from "@/components/shell/listing-card";
import { PromoCard } from "@/components/shell/promo-card";
import { mockFeaturedListings, mockRecentListings } from "@/lib/mock-listings";
import { mockTalentDetail } from "@/lib/mock-talent-detail";
import type { Role } from "@/lib/nav-items";

const copy: Record<Role, { featuredTitle: string; promoTitle: string; promoCta: string; promoHref: string }> = {
  organizer: {
    featuredTitle: "Most Popular Talents in Heart of Show",
    promoTitle: "Are you looking for Talent for your Event?",
    promoCta: "Create new Event",
    promoHref: "/organizer/create",
  },
  talent: {
    featuredTitle: "Most Popular Events in Heart of Show",
    promoTitle: "Ready to find your next gig?",
    promoCta: "Create new Package",
    promoHref: "/talent/create",
  },
  agency: {
    featuredTitle: "Most Popular Events in Heart of Show",
    promoTitle: "Grow your roster with new bookings",
    promoCta: "Create new Package",
    promoHref: "/agency/create",
  },
};

export function HomeContent({ role }: { role: Role }) {
  const { featuredTitle, promoTitle, promoCta, promoHref } = copy[role];
  // HomeContent is only ever rendered for role="organizer" — talent/agency use
  // EventHomeContent instead, which is wired to real event data.
  const detailHref = `/organizer/talents/${mockTalentDetail.slug}`;

  return (
    <div className="flex flex-col gap-14 py-8">
      <CardCarousel title={featuredTitle} viewAllHref={`/${role}/discover`}>
        {mockFeaturedListings.map((item) => (
          <ListingCard key={item.id} data={item} href={detailHref} />
        ))}
      </CardCarousel>

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-[606px_1fr]">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-medium tracking-[-0.03em] text-foreground">Recently Added</h2>
            <Link href={`/${role}/discover`} className="text-sm font-medium text-muted-foreground">
              View All
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {mockRecentListings.map((item) => (
              <ListingRow key={item.id} data={item} />
            ))}
          </div>
        </div>
        <PromoCard title={promoTitle} ctaLabel={promoCta} ctaHref={promoHref} />
      </section>

      <CardCarousel title="Editor Choice" viewAllHref={`/${role}/discover`}>
        {mockFeaturedListings.map((item) => (
          <ListingCard key={`editor-${item.id}`} data={item} href={detailHref} />
        ))}
      </CardCarousel>
    </div>
  );
}
