export type StaffRole = 'staff' | 'admin' | 'user';

export interface StaffUser {
  id: number;
  name: string;
  email: string;
  role: StaffRole;
  assignedTheatreId: number;
  assignedTheatreName: string;
  token?: string;
}

export type TicketStatus = 'CONFIRMED' | 'CHECKED_IN' | 'CANCELLED' | 'EXPIRED';

export interface SeatInfo {
  seatId: number;
  rowLabel: string;
  seatNumber: number;
  tier: 'regular' | 'premium' | 'recliner';
}

export interface TicketDetails {
  id: number;
  ticketCode: string;
  bookingId: number;
  status: TicketStatus;
  customerName: string;
  customerEmail: string;
  movieTitle: string;
  movieGenre: string[];
  moviePosterUrl?: string;
  theatreId: number;
  theatreName: string;
  screenId: number;
  screenName: string;
  startTime: string; // ISO string
  durationMin: number;
  seats: SeatInfo[];
  totalSeats: number;
  totalAmount: number;
  checkedInAt?: string | null;
  checkedInBy?: number | null;
  checkedInByName?: string | null;
}

export type ScanStatus = 'ADMIT' | 'REJECT';

export type RejectReason =
  | 'ALREADY_USED'
  | 'WRONG_SHOW'
  | 'WRONG_THEATRE'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'OUTSIDE_WINDOW'
  | 'INVALID_SIGNATURE'
  | 'TICKET_NOT_FOUND'
  | 'NETWORK_ERROR';

export interface ScanResult {
  status: ScanStatus;
  message: string;
  rejectReason?: RejectReason;
  ticket?: TicketDetails;
  scannedAt: string;
  scannerStaffId: number;
  scannerStaffName: string;
}

export interface ScanLog {
  id: number;
  staffId: number;
  staffName: string;
  theatreId: number;
  theatreName: string;
  ticketCode: string;
  movieTitle: string;
  screenName: string;
  seatsText: string;
  result: 'ADMIT' | 'REJECT_USED' | 'REJECT_WRONG_SHOW' | 'REJECT_WRONG_THEATRE' | 'REJECT_CANCELLED' | 'REJECT_EXPIRED' | 'REJECT_WINDOW' | 'REJECT_INVALID';
  reasonText?: string;
  scannedAt: string;
}

export interface ShowSummary {
  id: number;
  movieId: number;
  movieTitle: string;
  moviePosterUrl?: string;
  screenId: number;
  screenName: string;
  startTime: string;
  durationMin: number;
  totalSeats: number;
  bookedSeats: number;
  admittedSeats: number;
  isCurrentWindow: boolean;
}
