export interface EventSlot {
  id: string;
  role: string;
  priceUsd: number;
  type: string;
  slots: number;
}

export interface EventDetail {
  slug: string;
  name: string;
  venue: string;
  address: string;
  day: string;
  time: string;
  tagline: string;
  bio: string;
  budgetMinVnd: number;
  budgetMaxVnd: number;
  slots: EventSlot[];
  organizer: {
    name: string;
    location: string;
    contact: string;
  };
}

export const mockEventDetail: EventDetail = {
  slug: "summer-music-festival",
  name: "Gangsta Hiphop",
  venue: "Faham Lounge",
  address: "112 Nam Ky Khoi Nghia, Dist.1, HCMC",
  day: "30/12/2023",
  time: "21:30 - 23:00",
  tagline: "Rapper perfoms for music festival, bar, club and pub.",
  bio: "A full-day outdoor music festival at Faham Lounge featuring multiple acts across genres. We provide full sound and lighting production, a green room, and on-site catering for all performers and crew.",
  budgetMinVnd: 15_000_000_000,
  budgetMaxVnd: 32_000_000_000,
  slots: [
    { id: "1", role: "Solo Singer", priceUsd: 2000, type: "Fulltime", slots: 3 },
    { id: "2", role: "Makeup Artist", priceUsd: 3000, type: "Fulltime", slots: 3 },
    { id: "3", role: "DJ", priceUsd: 6000, type: "Fulltime", slots: 3 },
    { id: "4", role: "Solo Singer", priceUsd: 2000, type: "Fulltime", slots: 3 },
    { id: "5", role: "Solo Singer", priceUsd: 2000, type: "Fulltime", slots: 3 },
  ],
  organizer: {
    name: "Heart of Show Events",
    location: "234 Nam Ky Khoi Nghia, Tan Dinh Ward, Dist. 1, HCMC",
    contact: "091 323 5256 (Mr. Bao)",
  },
};
