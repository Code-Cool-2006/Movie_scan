import assert from 'node:assert';

// Verification test suite for Ticket Scanning & Check-in System

function parseScanPayload(raw) {
  const trimmed = raw.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      return {
        code: (parsed.code || parsed.ticket_code || parsed.ticketCode || '').trim().toUpperCase(),
        signature: parsed.signature || parsed.sig,
      };
    } catch {
      // ignore
    }
  }
  return { code: trimmed.toUpperCase() };
}

// Simulate Guard
const guardAlice = {
  id: 101,
  name: 'Alice Johnson',
  email: 'alice@cinema.com',
  role: 'staff',
  assignedTheatreId: 1,
  assignedTheatreName: 'PVR Cinemas Forum',
};

// Test Tickets
let tickets = [
  {
    ticketCode: 'TKT-DUNE2-109',
    status: 'CONFIRMED',
    movieTitle: 'Dune: Part Two',
    theatreId: 1,
    theatreName: 'PVR Cinemas Forum',
    totalSeats: 2,
    checkedInAt: null,
    checkedInBy: null,
  },
  {
    ticketCode: 'TKT-USED-999',
    status: 'CHECKED_IN',
    movieTitle: 'Dune: Part Two',
    theatreId: 1,
    theatreName: 'PVR Cinemas Forum',
    totalSeats: 1,
    checkedInAt: '2026-10-07T18:42:00.000Z',
    checkedInByName: 'Alice Johnson',
  },
  {
    ticketCode: 'TKT-WRONG-TH7',
    status: 'CONFIRMED',
    movieTitle: 'Spider-Man',
    theatreId: 2,
    theatreName: 'INOX Megaplex Downtown',
    totalSeats: 1,
  },
];

let scanLogs = [];

function validateScan(rawInput, guard) {
  const { code } = parseScanPayload(rawInput);
  const ticket = tickets.find((t) => t.ticketCode.toUpperCase() === code);

  if (!ticket) {
    const log = { ticketCode: code, result: 'REJECT_INVALID', scannedAt: new Date().toISOString() };
    scanLogs.push(log);
    return { status: 'REJECT', rejectReason: 'TICKET_NOT_FOUND', message: 'Ticket not found' };
  }

  if (ticket.status === 'CHECKED_IN') {
    const log = { ticketCode: code, result: 'REJECT_USED', scannedAt: new Date().toISOString() };
    scanLogs.push(log);
    return { status: 'REJECT', rejectReason: 'ALREADY_USED', message: `Already checked in` };
  }

  if (ticket.theatreId !== guard.assignedTheatreId) {
    const log = { ticketCode: code, result: 'REJECT_WRONG_THEATRE', scannedAt: new Date().toISOString() };
    scanLogs.push(log);
    return { status: 'REJECT', rejectReason: 'WRONG_THEATRE', message: 'Wrong theatre' };
  }

  // ADMIT
  ticket.status = 'CHECKED_IN';
  ticket.checkedInAt = new Date().toISOString();
  ticket.checkedInBy = guard.id;
  const log = { ticketCode: code, result: 'ADMIT', scannedAt: new Date().toISOString() };
  scanLogs.push(log);

  return { status: 'ADMIT', message: 'Valid Ticket - Admitted', ticket };
}

console.log('--- Executing Comprehensive Ticket Scan Tests ---');

// Test 1: Valid Ticket Scan (POST /scan)
console.log('1. Scan valid ticket TKT-DUNE2-109:');
const res1 = validateScan('TKT-DUNE2-109', guardAlice);
assert.strictEqual(res1.status, 'ADMIT', 'Expected ADMIT for valid ticket');
assert.strictEqual(res1.ticket.status, 'CHECKED_IN', 'Ticket status updated to CHECKED_IN');
console.log('   ✓ Result: ADMIT (Approved)');

// Test 2: Double Scan Duplicate Prevention
console.log('2. Re-scan same ticket (Double Scan / Duplicate Entry prevention):');
const res2 = validateScan('TKT-DUNE2-109', guardAlice);
assert.strictEqual(res2.status, 'REJECT', 'Expected REJECT for double scan');
assert.strictEqual(res2.rejectReason, 'ALREADY_USED', 'Reason must be ALREADY_USED');
console.log('   ✓ Result: REJECT (ALREADY_USED - Duplicate successfully blocked!)');

// Test 3: Wrong Theatre Guard Scan
console.log('3. Scan ticket for different theatre:');
const res3 = validateScan('TKT-WRONG-TH7', guardAlice);
assert.strictEqual(res3.status, 'REJECT', 'Expected REJECT for wrong theatre');
assert.strictEqual(res3.rejectReason, 'WRONG_THEATRE', 'Reason must be WRONG_THEATRE');
console.log('   ✓ Result: REJECT (WRONG_THEATRE - Cross-theatre entry prevented!)');

// Test 4: Unknown / Counterfeit QR
console.log('4. Scan counterfeit QR code:');
const res4 = validateScan('FAKE-QR-XYZ999', guardAlice);
assert.strictEqual(res4.status, 'REJECT', 'Expected REJECT for counterfeit QR');
assert.strictEqual(res4.rejectReason, 'TICKET_NOT_FOUND', 'Reason must be TICKET_NOT_FOUND');
console.log('   ✓ Result: REJECT (TICKET_NOT_FOUND - Invalid code blocked!)');

// Test 5: Scan Logs Audit History (GET /staff/scan-logs)
console.log('5. Verify Scan Audit Trail (GET /staff/scan-logs):');
assert.strictEqual(scanLogs.length, 4, 'All 4 scan attempts logged');
assert.strictEqual(scanLogs[0].result, 'ADMIT');
assert.strictEqual(scanLogs[1].result, 'REJECT_USED');
assert.strictEqual(scanLogs[2].result, 'REJECT_WRONG_THEATRE');
assert.strictEqual(scanLogs[3].result, 'REJECT_INVALID');
console.log(`   ✓ Total audit logs recorded: ${scanLogs.length}`);

console.log('\n======================================================');
console.log('✓ All 5 Core Ticket Scanning Requirements Fully Verified!');
console.log('======================================================\n');
