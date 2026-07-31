export interface EventListingData {
  id: string;
  name: string;
  venue: string;
  address: string;
  day: string;
  time: string;
  jobsOffered: number;
  jobsTotal: number;
}

export const mockUpcomingEvents: EventListingData[] = [
  { id: "1", name: "Gangstar Hiphop", venue: "Faham Club", address: "123 CMT8, Dist. 11, Ho Chi Minh City", day: "30/12/2023", time: "21:30 - 23:00", jobsOffered: 3, jobsTotal: 10 },
  { id: "2", name: "Halloween Party", venue: "Atmos Club", address: "123 CMT8, Dist. 11, Ho Chi Minh City", day: "30/12/2023", time: "21:30 - 23:00", jobsOffered: 3, jobsTotal: 10 },
  { id: "3", name: "Mellow Dusk", venue: "Zion Lounge & Dining", address: "123 CMT8, Dist. 11, Ho Chi Minh City", day: "30/12/2023", time: "21:30 - 23:00", jobsOffered: 3, jobsTotal: 10 },
  { id: "4", name: "New Year Countdown", venue: "1900 Le Théâtre", address: "123 CMT8, Dist. 11, Ho Chi Minh City", day: "30/12/2023", time: "21:30 - 23:00", jobsOffered: 3, jobsTotal: 10 },
];

export const mockRecentEvents: EventListingData[] = [
  { id: "5", name: "Mellow Dusk", venue: "Zion Lounge & Dining", address: "123 CMT8, Dist. 11, Ho Chi Minh City", day: "30/12/2023", time: "21:30 - 23:00", jobsOffered: 3, jobsTotal: 10 },
  { id: "6", name: "Halloween Party", venue: "Atmos Club", address: "123 CMT8, Dist. 11, Ho Chi Minh City", day: "30/12/2023", time: "21:30 - 23:00", jobsOffered: 3, jobsTotal: 10 },
  { id: "7", name: "New Year Countdown", venue: "1900 Le Théâtre", address: "123 CMT8, Dist. 11, Ho Chi Minh City", day: "30/12/2023", time: "21:30 - 23:00", jobsOffered: 3, jobsTotal: 10 },
  { id: "8", name: "Gangstar Hiphop", venue: "Faham Club", address: "123 CMT8, Dist. 11, Ho Chi Minh City", day: "30/12/2023", time: "21:30 - 23:00", jobsOffered: 3, jobsTotal: 10 },
  { id: "9", name: "Martin Garrix World Tour", venue: "Atmos Club", address: "123 CMT8, Dist. 11, Ho Chi Minh City", day: "30/12/2023", time: "21:30 - 23:00", jobsOffered: 3, jobsTotal: 10 },
  { id: "10", name: "Kluboca", venue: "Loca Complex", address: "123 CMT8, Dist. 11, Ho Chi Minh City", day: "30/12/2023", time: "21:30 - 23:00", jobsOffered: 3, jobsTotal: 10 },
];
