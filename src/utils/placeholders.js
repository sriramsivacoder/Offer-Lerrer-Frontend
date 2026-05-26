/**
 * Placeholders Utility
 * Defines all available placeholders for template customization
 */

export const PLACEHOLDERS = [
  { key: '{name}', label: 'Name', description: 'Recipient name' },
  { key: '{email}', label: 'Email', description: 'Recipient email address' },
  { key: '{Phone}', label: 'Phone', description: 'Phone number' },
  { key: '{Organization}', label: 'Organization', description: 'College/Organization' },
  { key: '{RegistrationDate}', label: 'Registration Date', description: 'Date of registration' },
  { key: '{PaymentStatus}', label: 'Payment Status', description: 'Payment status' },
  { key: '{AttendanceStatus}', label: 'Attendance Status', description: 'Attendance status' },
  { key: '{Status}', label: 'Status', description: 'Current status' },
  { key: '{AICTE_Code}', label: 'AICTE Code', description: 'AICTE code' },
  { key: '{Role}', label: 'Role', description: 'Internship role' },
  { key: '{Duration}', label: 'Duration', description: 'Internship duration' },
  { key: '{StartDate}', label: 'Start Date', description: 'Start date' },
  { key: '{Mode}', label: 'Mode', description: 'Work mode (Remote/Hybrid/Office)' },
  { key: '{Internship_Name}', label: 'Internship Name', description: 'Internship program name' },
  { key: '{Partner_Name}', label: 'Partner Name', description: 'Partner organization name' },
];

/**
 * Replace all placeholders in text with actual data
 */
export const replacePlaceholders = (text, data) => {
  if (!text || !data) return text;

  let result = text;

  // Direct key mapping
  const map = {
    '{name}': data.name || '',
    '{email}': data.email || '',
    '{Phone}': data.Phone || '',
    '{Organization}': data.Organization || '',
    '{RegistrationDate}': data['Registration Date'] || data.RegistrationDate || '',
    '{PaymentStatus}': data['Payment Status'] || data.PaymentStatus || '',
    '{AttendanceStatus}': data['Attendance Status'] || data.AttendanceStatus || '',
    '{Status}': data.Status || '',
    '{AICTE_Code}': data.AICTE_Code || '',
    '{Role}': data.Role || '',
    '{Duration}': data.Duration || '',
    '{StartDate}': data['Start Date'] || data.StartDate || '',
    '{Mode}': data.Mode || '',
    '{Internship_Name}': data.Internship_Name || '',
    '{Partner_Name}': data.Partner_Name || '',
  };

  Object.entries(map).forEach(([placeholder, value]) => {
    result = result.replaceAll(placeholder, value);
  });

  return result;
};
