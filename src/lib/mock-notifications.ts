export interface NotificationItem {
  id: string;
  kind: "payment" | "application";
  time: string;
  applicantName?: string;
  eventName?: string;
  unread: boolean;
}

export const mockNotifications: NotificationItem[] = [
  { id: "1", kind: "payment", time: "23:41 12/07/2023", unread: true },
  { id: "2", kind: "application", time: "23:41 12/07/2023", applicantName: "Post Malone", eventName: "Gangsta Hiphop Events", unread: true },
  { id: "3", kind: "payment", time: "23:41 12/07/2023", unread: false },
  { id: "4", kind: "application", time: "23:41 12/07/2023", applicantName: "Post Malone", eventName: "Gangsta Hiphop Events", unread: false },
  { id: "5", kind: "payment", time: "23:41 12/07/2023", unread: false },
];
