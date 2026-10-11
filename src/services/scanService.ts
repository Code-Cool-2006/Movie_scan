import {
  TicketDetails,
  ScanResult,
  ScanLog,
  ShowSummary,
  StaffUser,
} from '../types';
import { apiRequest, isMockModeActive } from './api';
import {
  INITIAL_MOCK_TICKETS,
  INITIAL_MOCK_LOGS,
  INITIAL_MOCK_SHOWS,
} from './mockData';

// Persistent in-memory state during session
let mockTickets: TicketDetails[] = JSON.parse(JSON.stringify(INITIAL_MOCK_TICKETS));
let mockLogs: ScanLog[] = JSON.parse(JSON.stringify(INITIAL_MOCK_LOGS));
let mockShows: ShowSummary[] = JSON.parse(JSON.stringify(INITIAL_MOCK_SHOWS));

export function resetMockData() {
  mockTickets = JSON.parse(JSON.stringify(INITIAL_MOCK_TICKETS));
  mockLogs = JSON.parse(JSON.stringify(INITIAL_MOCK_LOGS));
  mockShows = JSON.parse(JSON.stringify(INITIAL_MOCK_SHOWS));
}

/**
 * Extracts ticket code and optional signature from raw scan string.
 * Supports raw string 'TKT-DUNE2-109' or JSON '{"code":"TKT-...","sig":"..."}'
 */
export function parseScanPayload(raw: string): { code: string; signature?: string } {
  const trimmed = raw.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      return {
        code: (parsed.code || parsed.ticket_code || parsed.ticketCode || '').trim().toUpperCase(),
        signature: parsed.signature || parsed.sig,
      };
    } catch {
      // ignore json parse error and fallback
    }
  }
  return { code: trimmed.toUpperCase() };
}

/**
 * POST /scan – Scans and validates a ticket for entry.
 */
export async function scanTicket(
  rawInput: string,
  guardUser: StaffUser
): Promise<ScanResult> {
  const { code, signature } = parseScanPayload(rawInput);
  const useMock = await isMockModeActive();

  if (!code) {
    return {
      status: 'REJECT',
      rejectReason: 'INVALID_SIGNATURE',
      message: 'Empty or corrupted QR code payload.',
      scannedAt: new Date().toISOString(),
      scannerStaffId: guardUser.id,
      scannerStaffName: guardUser.name,
    };
  }

  // If live mode is selected, try calling real server endpoint first
  if (!useMock) {
    try {
      // Primary: POST /scan (also try /api/staff/validate)
      const res = await apiRequest<any>('/scan', {
        method: 'POST',
        body: {
          code,
          ticketCode: code,
          signature,
          staffId: guardUser.id,
          theatreId: guardUser.assignedTheatreId,
        },
      });

      return {
        status: res.status || (res.result === 'ADMIT' ? 'ADMIT' : 'REJECT'),
        rejectReason: res.rejectReason || res.reason,
        message: res.message || (res.status === 'ADMIT' ? 'Ticket Verified' : 'Entry Denied'),
        ticket: res.ticket,
        scannedAt: res.scannedAt || new Date().toISOString(),
        scannerStaffId: guardUser.id,
        scannerStaffName: guardUser.name,
      };
    } catch (networkErr: any) {
      console.warn('Live API /scan failed, falling back to mock logic:', networkErr.message);
    }
  }

  // Mock Engine Execution
  const ticket = mockTickets.find(
    (t) => t.ticketCode.toUpperCase() === code.toUpperCase()
  );

  const nowIso = new Date().toISOString();

  if (!ticket) {
    const log: ScanLog = {
      id: Date.now(),
      staffId: guardUser.id,
      staffName: guardUser.name,
      theatreId: guardUser.assignedTheatreId,
      theatreName: guardUser.assignedTheatreName,
      ticketCode: code,
      movieTitle: 'Unknown',
      screenName: 'Unknown',
      seatsText: 'N/A',
      result: 'REJECT_INVALID',
      reasonText: 'Ticket code not found in cinema database',
      scannedAt: nowIso,
    };
    mockLogs.unshift(log);

    return {
      status: 'REJECT',
      rejectReason: 'TICKET_NOT_FOUND',
      message: `Invalid Ticket: "${code}" is not in the system.`,
      scannedAt: nowIso,
      scannerStaffId: guardUser.id,
      scannerStaffName: guardUser.name,
    };
  }

  // Check 1: Already Checked In
  if (ticket.status === 'CHECKED_IN') {
    const usedTime = ticket.checkedInAt
      ? new Date(ticket.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : 'earlier';
    const reasonMsg = `Already checked in at ${usedTime} by ${ticket.checkedInByName || 'Door Guard'}`;

    const log: ScanLog = {
      id: Date.now(),
      staffId: guardUser.id,
      staffName: guardUser.name,
      theatreId: guardUser.assignedTheatreId,
      theatreName: guardUser.assignedTheatreName,
      ticketCode: ticket.ticketCode,
      movieTitle: ticket.movieTitle,
      screenName: ticket.screenName,
      seatsText: formatSeats(ticket),
      result: 'REJECT_USED',
      reasonText: reasonMsg,
      scannedAt: nowIso,
    };
    mockLogs.unshift(log);

    return {
      status: 'REJECT',
      rejectReason: 'ALREADY_USED',
      message: reasonMsg,
      ticket,
      scannedAt: nowIso,
      scannerStaffId: guardUser.id,
      scannerStaffName: guardUser.name,
    };
  }

  // Check 2: Wrong Theatre
  if (ticket.theatreId !== guardUser.assignedTheatreId) {
    const reasonMsg = `Wrong Theatre: Valid for "${ticket.theatreName}", not "${guardUser.assignedTheatreName}".`;

    const log: ScanLog = {
      id: Date.now(),
      staffId: guardUser.id,
      staffName: guardUser.name,
      theatreId: guardUser.assignedTheatreId,
      theatreName: guardUser.assignedTheatreName,
      ticketCode: ticket.ticketCode,
      movieTitle: ticket.movieTitle,
      screenName: ticket.screenName,
      seatsText: formatSeats(ticket),
      result: 'REJECT_WRONG_THEATRE',
      reasonText: reasonMsg,
      scannedAt: nowIso,
    };
    mockLogs.unshift(log);

    return {
      status: 'REJECT',
      rejectReason: 'WRONG_THEATRE',
      message: reasonMsg,
      ticket,
      scannedAt: nowIso,
      scannerStaffId: guardUser.id,
      scannerStaffName: guardUser.name,
    };
  }

  // Check 3: Cancelled
  if (ticket.status === 'CANCELLED') {
    const reasonMsg = 'Booking was cancelled by customer or box office.';

    const log: ScanLog = {
      id: Date.now(),
      staffId: guardUser.id,
      staffName: guardUser.name,
      theatreId: guardUser.assignedTheatreId,
      theatreName: guardUser.assignedTheatreName,
      ticketCode: ticket.ticketCode,
      movieTitle: ticket.movieTitle,
      screenName: ticket.screenName,
      seatsText: formatSeats(ticket),
      result: 'REJECT_CANCELLED',
      reasonText: reasonMsg,
      scannedAt: nowIso,
    };
    mockLogs.unshift(log);

    return {
      status: 'REJECT',
      rejectReason: 'CANCELLED',
      message: reasonMsg,
      ticket,
      scannedAt: nowIso,
      scannerStaffId: guardUser.id,
      scannerStaffName: guardUser.name,
    };
  }

  // Check 4: Expired
  if (ticket.status === 'EXPIRED') {
    const reasonMsg = 'Show date has already expired.';

    const log: ScanLog = {
      id: Date.now(),
      staffId: guardUser.id,
      staffName: guardUser.name,
      theatreId: guardUser.assignedTheatreId,
      theatreName: guardUser.assignedTheatreName,
      ticketCode: ticket.ticketCode,
      movieTitle: ticket.movieTitle,
      screenName: ticket.screenName,
      seatsText: formatSeats(ticket),
      result: 'REJECT_EXPIRED',
      reasonText: reasonMsg,
      scannedAt: nowIso,
    };
    mockLogs.unshift(log);

    return {
      status: 'REJECT',
      rejectReason: 'EXPIRED',
      message: reasonMsg,
      ticket,
      scannedAt: nowIso,
      scannerStaffId: guardUser.id,
      scannerStaffName: guardUser.name,
    };
  }

  // Atomic Admission Success (ADMIT)
  ticket.status = 'CHECKED_IN';
  ticket.checkedInAt = nowIso;
  ticket.checkedInBy = guardUser.id;
  ticket.checkedInByName = guardUser.name;

  // Increment show admitted seats
  const matchedShow = mockShows.find(
    (s) => s.movieTitle.toLowerCase() === ticket.movieTitle.toLowerCase()
  );
  if (matchedShow) {
    matchedShow.admittedSeats = Math.min(
      matchedShow.totalSeats,
      matchedShow.admittedSeats + ticket.totalSeats
    );
  }

  // Log successful admission
  const log: ScanLog = {
    id: Date.now(),
    staffId: guardUser.id,
    staffName: guardUser.name,
    theatreId: guardUser.assignedTheatreId,
    theatreName: guardUser.assignedTheatreName,
    ticketCode: ticket.ticketCode,
    movieTitle: ticket.movieTitle,
    screenName: ticket.screenName,
    seatsText: formatSeats(ticket),
    result: 'ADMIT',
    reasonText: 'Entry verified successfully',
    scannedAt: nowIso,
  };
  mockLogs.unshift(log);

  return {
    status: 'ADMIT',
    message: 'Valid Ticket - Admitted',
    ticket,
    scannedAt: nowIso,
    scannerStaffId: guardUser.id,
    scannerStaffName: guardUser.name,
  };
}

/**
 * GET /scan/:ticketCode – Checks the details and validity of a ticket code.
 */
export async function getTicketDetails(ticketCode: string): Promise<TicketDetails> {
  const code = ticketCode.trim().toUpperCase();
  const useMock = await isMockModeActive();

  if (!useMock) {
    try {
      const res = await apiRequest<TicketDetails>(`/scan/${encodeURIComponent(code)}`);
      return res;
    } catch (networkErr: any) {
      console.warn('Live API /scan/:ticketCode failed, falling back to mock logic:', networkErr.message);
    }
  }

  const ticket = mockTickets.find((t) => t.ticketCode.toUpperCase() === code);
  if (!ticket) {
    throw new Error(`Ticket "${code}" not found.`);
  }

  return JSON.parse(JSON.stringify(ticket));
}

/**
 * GET /staff/scan-logs – Returns the history of tickets scanned by staff.
 */
export async function getStaffScanLogs(): Promise<ScanLog[]> {
  const useMock = await isMockModeActive();

  if (!useMock) {
    try {
      const res = await apiRequest<ScanLog[]>('/staff/scan-logs');
      return res;
    } catch (networkErr: any) {
      console.warn('Live API /staff/scan-logs failed, falling back to mock logic:', networkErr.message);
    }
  }

  return JSON.parse(JSON.stringify(mockLogs));
}

/**
 * GET /staff/shows/today – Returns today's shows and check-in capacity counts.
 */
export async function getTodayShows(): Promise<ShowSummary[]> {
  const useMock = await isMockModeActive();

  if (!useMock) {
    try {
      const res = await apiRequest<ShowSummary[]>('/staff/shows/today');
      return res;
    } catch (networkErr: any) {
      console.warn('Live API /staff/shows/today failed, falling back to mock logic:', networkErr.message);
    }
  }

  return JSON.parse(JSON.stringify(mockShows));
}

function formatSeats(ticket: TicketDetails): string {
  if (!ticket.seats || ticket.seats.length === 0) return 'None';
  return ticket.seats.map((s) => `${s.rowLabel}${s.seatNumber}`).join(', ');
}
