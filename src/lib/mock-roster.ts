export interface RosterTalent {
  id: string;
  name: string;
  category: string;
}

export const mockRoster: RosterTalent[] = [
  { id: "1", name: "Hoang Thuy Linh", category: "Solo Singer" },
  { id: "2", name: "MONO", category: "Solo Singer" },
  { id: "3", name: "Skrillrex", category: "DJ" },
  { id: "4", name: "Chillies", category: "Band" },
  { id: "5", name: "Cá Hồi Hoang", category: "Band" },
];

export const mockRosterByCategory: Record<string, RosterTalent[]> = mockRoster.reduce(
  (acc, talent) => {
    acc[talent.category] = acc[talent.category] ?? [];
    acc[talent.category].push(talent);
    return acc;
  },
  {} as Record<string, RosterTalent[]>
);
