import { describe, it, expect } from 'vitest';
import { escapeCsvCell } from '../utils/csvExport';

describe('RFC-4180 CSV Escaping & Injection Protection (P1-6)', () => {
  it('Test 1: Standard text fields wrap in RFC-4180 double quotes', () => {
    expect(escapeCsvCell('Ramesh Patil')).toBe('"Ramesh Patil"');
    expect(escapeCsvCell('Jaysingpur')).toBe('"Jaysingpur"');
    expect(escapeCsvCell('Cash')).toBe('"Cash"');
  });

  it('Test 2: Commas and embedded quotes inside values do not corrupt column alignment', () => {
    // Commas inside text stay contained within quotes
    expect(escapeCsvCell('Patil, Ramesh')).toBe('"Patil, Ramesh"');
    expect(escapeCsvCell('Lane No. 8, Opp. Terapanthi Bhavan, Purtiwadi')).toBe('"Lane No. 8, Opp. Terapanthi Bhavan, Purtiwadi"');

    // Quotes are doubled per RFC-4180
    expect(escapeCsvCell('Dr. Baldawa "Dwarka Clinic"')).toBe('"Dr. Baldawa ""Dwarka Clinic"""');
  });

  it('Test 3: Formulas starting with =, +, -, or @ are safely prefixed with \' to prevent spreadsheet injection', () => {
    // Excel formula injection (=)
    expect(escapeCsvCell('=1+1')).toBe('"\'=1+1"');
    expect(escapeCsvCell('=SUM(A1:A10)')).toBe('"\'=SUM(A1:A10)"');
    expect(escapeCsvCell('=cmd|"/C calc"!A0')).toBe('"\'=cmd|""/C calc""!A0"');

    // Plus (+) symbol
    expect(escapeCsvCell('+919822012345')).toBe('"\'+919822012345"');

    // Minus (-) symbol
    expect(escapeCsvCell('-200')).toBe('"\' -200"'.replace(' ', '')); // "'-200"

    // At symbol (@)
    expect(escapeCsvCell('@SUM(A1)')).toBe('"\'@SUM(A1)"');

    // Tab and carriage return
    expect(escapeCsvCell('\tmalicious')).toBe('"\'\tmalicious"');
    expect(escapeCsvCell('\rmalicious')).toBe('"\'\rmalicious"');
  });

  it('Test 4: Null, undefined, and numeric values escape without crashing', () => {
    expect(escapeCsvCell(null)).toBe('""');
    expect(escapeCsvCell(undefined)).toBe('""');
    expect(escapeCsvCell(100)).toBe('"100"');
    expect(escapeCsvCell(200)).toBe('"200"');
    expect(escapeCsvCell(0)).toBe('"0"');
  });
});

