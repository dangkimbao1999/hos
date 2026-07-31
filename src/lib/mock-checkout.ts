export interface CheckoutLineItem {
  id: string;
  packageName: string;
  venue: string;
  address: string[];
  date?: string;
  time?: string;
  priceVnd: number;
}

export interface CheckoutGroup {
  id: string;
  talentName: string;
  items: CheckoutLineItem[];
}

export const mockCheckoutGroups: CheckoutGroup[] = [
  {
    id: "rpt-mck",
    talentName: "RPT MCK",
    items: [
      {
        id: "rpt-mck-basic",
        packageName: "Basic Package",
        venue: "UwuuHigh Club",
        address: ["114 Nam Ky Khoi Nghia Str,", "Tan Dinh Ward, Dist 1, HCMC"],
        time: "20:00 - 00:00",
        priceVnd: 4_000_000,
      },
      {
        id: "rpt-mck-diamond",
        packageName: "Diamond Package",
        venue: "ABC Dance Zone",
        address: ["98 Hai Ba Trung Str,", "Tan Dinh Ward, Dist 1, HCMC"],
        date: "28/08/2024",
        priceVnd: 24_000_000,
      },
    ],
  },
  {
    id: "asap-rocky",
    talentName: "A$AP Rocky",
    items: [
      {
        id: "asap-rocky-quotation",
        packageName: "Private Quotation",
        venue: "Commas Saigon",
        address: ["252 Nam Ky Khoi Nghia Str,", "Tan Dinh Ward, Dist 1, HCMC"],
        date: "28/08/2024",
        time: "23:00 - 02:00",
        priceVnd: 3_800_000_000,
      },
    ],
  },
];
