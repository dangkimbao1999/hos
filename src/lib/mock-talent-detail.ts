export interface TalentPackage {
  name: string;
  type: string;
  location: string;
}

export interface TalentReview {
  reviewerName: string;
  stars: number;
  title: string;
  performedAt: string;
  date: string;
  body: string;
}

export interface TalentDetail {
  slug: string;
  name: string;
  category: string;
  rating: number;
  reviewCount: number;
  tagline: string;
  bio: string;
  keywords: string[];
  services: string[];
  packages: TalentPackage[];
  priceRangeVnd: { min: number; max: number };
  reviews: TalentReview[];
}

export const mockTalentDetail: TalentDetail = {
  slug: "asap-rocky",
  name: "A$AP Rocky",
  category: "Solo Singer",
  rating: 4.8,
  reviewCount: 53,
  tagline: "Rapper perfoms for music festival, bar, club and pub.",
  bio: "From sold-out festival stages to intimate club sets, A$AP Rocky brings a high-energy live show built around crowd interaction, tight choreography, and a full production rider. Every booking includes a pre-show sound check and a dedicated tour manager to coordinate logistics with your event team.",
  keywords: ["#A$APMob", "#Flacko", "#A$APRocky", "#PraiseTheLord", "#Rihanna"],
  services: [
    "Full sound & lighting rider provided on request",
    "Dedicated tour manager for on-site coordination",
    "Flexible set length from 30 to 90 minutes",
    "Meet & greet add-on available for VIP packages",
  ],
  packages: [
    { name: "Basic Package", type: "Fulltime", location: "Ho Chi Minh City" },
    { name: "Basic Package", type: "Fulltime", location: "Ho Chi Minh City" },
    { name: "Basic Package", type: "Fulltime", location: "Ho Chi Minh City" },
  ],
  priceRangeVnd: { min: 15_000_000_000, max: 32_000_000_000 },
  reviews: [
    {
      reviewerName: "Atmos Club",
      stars: 4,
      title: "Dat guy is dope!",
      performedAt: "Gangstar Hiphop Events",
      date: "18/06/2023",
      body: "Just a dope guy, everything is best of best, nothing to say ok ok ok ok ok hehe Pls book him moreeee!!!",
    },
    {
      reviewerName: "The Loft Rooftop",
      stars: 5,
      title: "Best headline act we've booked",
      performedAt: "Rooftop Summer Series",
      date: "02/09/2023",
      body: "Crowd was hooked from the first track. Production team was easy to work with and the set ran exactly on schedule.",
    },
    {
      reviewerName: "Neon District",
      stars: 4,
      title: "Great energy, would rebook",
      performedAt: "Neon District Launch Party",
      date: "14/11/2023",
      body: "Sound check was smooth and the performance kept the whole venue moving. Minor delay at load-in but nothing that affected the show.",
    },
  ],
};
