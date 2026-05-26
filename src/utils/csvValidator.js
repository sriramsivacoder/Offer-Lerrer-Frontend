/**
 * CSV Validator Utility
 * Validates CSV data structure and email formats
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Required columns for the CSV
const REQUIRED_COLUMNS = ['name', 'email'];

// All expected columns
const EXPECTED_COLUMNS = [
  'name',
  'email',
  'Phone',
  'Organization',
  'Registration Date',
  'Payment Status',
  'Attendance Status',
  'Status',
  'AICTE_Code',
  'Role',
  'Duration',
  'Start Date',
  'Mode',
  'Internship_Name',
  'Partner_Name',
];

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  return EMAIL_REGEX.test(email);
};

/**
 * Validate CSV data and return stats
 */
export const validateCSVData = (data) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return {
      isValid: false,
      error: 'CSV file is empty or invalid',
      stats: null,
    };
  }

  const columns = Object.keys(data[0]);
  const missingRequired = REQUIRED_COLUMNS.filter(
    (col) => !columns.find((c) => c.toLowerCase() === col.toLowerCase())
  );

  if (missingRequired.length > 0) {
    return {
      isValid: false,
      error: `Missing required columns: ${missingRequired.join(', ')}`,
      stats: null,
    };
  }

  const recognizedColumns = columns.filter((col) =>
    EXPECTED_COLUMNS.find((e) => e.toLowerCase() === col.toLowerCase())
  );

  const extraColumns = columns.filter(
    (col) => !EXPECTED_COLUMNS.find((e) => e.toLowerCase() === col.toLowerCase())
  );

  const validEmails = data.filter((row) => isValidEmail(row.email || row.Email || ''));
  const invalidEmails = data.filter((row) => !isValidEmail(row.email || row.Email || ''));

  return {
    isValid: true,
    error: null,
    stats: {
      totalRows: data.length,
      validEmails: validEmails.length,
      invalidEmails: invalidEmails.length,
      totalColumns: columns.length,
      recognizedColumns: recognizedColumns.length,
      columns,
      recognizedColumnNames: recognizedColumns,
      extraColumnNames: extraColumns,
    },
  };
};

export { EXPECTED_COLUMNS, REQUIRED_COLUMNS };
