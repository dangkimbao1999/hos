export interface MockEvent {
  id: string;
  name: string;
  date: string;
  venue: string;
  talentCount: number;
  budget: string;
  status: "Upcoming" | "Completed" | "Cancelled";
}

export const mockEvents: MockEvent[] = [
  { id: "1", name: "Summer Music Festival", date: "28 Aug 2026", venue: "ABC Dance Zone, HCMC", talentCount: 4, budget: "120,000,000 VND", status: "Upcoming" },
  { id: "2", name: "Neon District Launch Party", date: "14 Nov 2025", venue: "Neon District, HCMC", talentCount: 2, budget: "45,000,000 VND", status: "Completed" },
  { id: "3", name: "Corporate Year-End Gala", date: "20 Dec 2025", venue: "Commas Saigon", talentCount: 3, budget: "80,000,000 VND", status: "Completed" },
  { id: "4", name: "Rooftop Summer Series", date: "02 Sep 2025", venue: "The Loft Rooftop", talentCount: 1, budget: "18,000,000 VND", status: "Cancelled" },
];

export interface MockPackage {
  id: string;
  name: string;
  category: string;
  priceRange: string;
  bookingCount: number;
  status: "Active" | "Closed";
}

export const mockPackages: MockPackage[] = [
  { id: "1", name: "Basic Package", category: "Solo Singer", priceRange: "23,000,000 VND - 32,000,000 VND", bookingCount: 20, status: "Active" },
  { id: "2", name: "Advance Package", category: "Solo Singer", priceRange: "23,000,000 VND - 32,000,000 VND", bookingCount: 54, status: "Closed" },
];

export interface MockOrder {
  id: string;
  talentName: string;
  packageName: string;
  date: string;
  priceVnd: string;
  status: "Pending" | "Confirmed" | "Completed" | "Cancelled";
}

export const mockOrders: MockOrder[] = [
  { id: "ORD-1042", talentName: "A$AP Rocky", packageName: "Private Quotation", date: "28 Aug 2026", priceVnd: "3,800,000,000 VND", status: "Pending" },
  { id: "ORD-1041", talentName: "RPT MCK", packageName: "Basic Package", date: "28 Aug 2026", priceVnd: "4,000,000 VND", status: "Confirmed" },
  { id: "ORD-1038", talentName: "Vũ", packageName: "Diamond Package", date: "14 Nov 2025", priceVnd: "24,000,000 VND", status: "Completed" },
  { id: "ORD-1029", talentName: "DJ Nova", packageName: "Basic Package", date: "02 Sep 2025", priceVnd: "8,000,000 VND", status: "Cancelled" },
];

export interface MockScheduleSlot {
  date: string;
  entries: { time: string; title: string; venue: string }[];
}

export const mockSchedule: MockScheduleSlot[] = [
  {
    date: "28 Aug 2026",
    entries: [
      { time: "20:00 - 00:00", title: "RPT MCK — Basic Package", venue: "UwuuHigh Club" },
      { time: "23:00 - 02:00", title: "A$AP Rocky — Private Quotation", venue: "Commas Saigon" },
    ],
  },
  {
    date: "05 Sep 2026",
    entries: [{ time: "19:00 - 21:00", title: "The Groove Collective — Diamond Package", venue: "ABC Dance Zone" }],
  },
];

export interface MockTransaction {
  id: string;
  description: string;
  date: string;
  amount: string;
  status: "Paid" | "Refunded" | "Failed";
}

export const mockTransactions: MockTransaction[] = [
  { id: "TXN-8821", description: "RPT MCK - Basic Package", date: "20 Jul 2026", amount: "4,000,000 VND", status: "Paid" },
  { id: "TXN-8790", description: "Vũ - Diamond Package", date: "10 Nov 2025", amount: "24,000,000 VND", status: "Paid" },
  { id: "TXN-8754", description: "DJ Nova - Basic Package", date: "28 Aug 2025", amount: "8,000,000 VND", status: "Refunded" },
];

export interface MockInvoiceLine {
  name: string;
  date: string;
  amount: string;
}

export interface MockInvoiceGroup {
  event: string;
  venue: string;
  lines: MockInvoiceLine[];
}

export const mockInvoiceGroups: MockInvoiceGroup[] = [
  {
    event: "Gangstar Hiphop Event",
    venue: "Faham Lounge",
    lines: [
      { name: "Basic Package", date: "10/07/2023", amount: "$ 450" },
      { name: "Advance Package", date: "12/07/2023", amount: "$ 950" },
      { name: "Basic Package", date: "13/07/2023", amount: "$ 920,000" },
      { name: "Advance Package", date: "14/07/2023", amount: "$ 1,402,634" },
    ],
  },
  {
    event: "The Tunnel",
    venue: "1900",
    lines: [
      { name: "Basic Package", date: "15/07/2023", amount: "$ 450" },
      { name: "Advance Package", date: "17/07/2023", amount: "$ 950" },
      { name: "Basic Package", date: "19/07/2023", amount: "$ 920,000" },
      { name: "Advance Package", date: "24/07/2023", amount: "$ 1,402,634" },
    ],
  },
];

export const mockBillingSummary = {
  totalBooking: 24,
  totalIncome: "$ 42,500",
  bookingFrom: "23/06/2023",
  bookingTo: "12/07/2023",
  status: "Completely Payment",
  cost: "$ 2,402,634",
  vatPit: "$ 2,400",
  totalCost: "$ 2,400,000",
};
