import type { ListingCardData } from "@/components/shell/listing-card";

export const mockFeaturedListings: ListingCardData[] = [
  { id: "1", title: "Vũ", category: "Solo Singers", rating: 4.9, reviewCount: 53, priceMin: 1500, priceMax: 5200 },
  { id: "2", title: "A$AP Rocky", category: "Solo Singers", rating: 4.9, reviewCount: 53, priceMin: 35800, priceMax: 400000 },
  { id: "3", title: "The Groove Collective", category: "Band", rating: 4.7, reviewCount: 41, priceMin: 4200, priceMax: 12000 },
  { id: "4", title: "DJ Nova", category: "DJ / Electronic", rating: 4.8, reviewCount: 62, priceMin: 3000, priceMax: 8000 },
  { id: "5", title: "Sasha Lane", category: "Vocalist", rating: 4.9, reviewCount: 37, priceMin: 2800, priceMax: 6000 },
];

export const mockSearchResults: ListingCardData[] = [
  { id: "12", title: "RPT MCK", category: "Solo Singers", rating: 4.9, reviewCount: 53, priceMin: 500, priceMax: 2000 },
];

export const mockRecentListings: ListingCardData[] = [
  { id: "6", title: "Midnight Jazz Trio", category: "Jazz", rating: 4.8, reviewCount: 29, priceMin: 3800, priceMax: 9000 },
  { id: "7", title: "Velvet Sound", category: "Band", rating: 4.5, reviewCount: 18, priceMin: 4100, priceMax: 9500 },
  { id: "8", title: "MC Ray", category: "Host / MC", rating: 4.7, reviewCount: 22, priceMin: 1800, priceMax: 3000 },
  { id: "9", title: "Golden Hour", category: "Acoustic", rating: 4.6, reviewCount: 15, priceMin: 2600, priceMax: 5000 },
  { id: "10", title: "Studio 88", category: "DJ / Electronic", rating: 4.9, reviewCount: 44, priceMin: 3500, priceMax: 8200 },
  { id: "11", title: "The Brass Line", category: "Live Music", rating: 4.4, reviewCount: 11, priceMin: 5000, priceMax: 11000 },
];
