/**
 * Template Renderer Utility
 * SINGLE SOURCE OF TRUTH for template rendering
 *
 * All previews, email content, and PDF generation MUST use this utility.
 * This ensures the rendered output is identical everywhere.
 */

import { replacePlaceholders } from './placeholders';

/**
 * Render a template with recipient data
 * This is the SINGLE function that should be used for all rendering.
 *
 * @param {string} templateHtml - Raw HTML template with {placeholder} syntax
 * @param {object} recipientData - Recipient data from CSV
 * @returns {string} - HTML with all placeholders replaced
 */
export const renderTemplate = (templateHtml, recipientData) => {
  if (!templateHtml) return '';
  if (!recipientData) return templateHtml;
  return replacePlaceholders(templateHtml, recipientData);
};

/**
 * Render the email subject with recipient data
 *
 * @param {string} subject - Subject line with {placeholder} syntax
 * @param {object} recipientData - Recipient data from CSV
 * @returns {string} - Subject with all placeholders replaced
 */
export const renderSubject = (subject, recipientData) => {
  if (!subject) return 'Offer Letter';
  if (!recipientData) return subject;
  return replacePlaceholders(subject, recipientData);
};

/**
 * Get a preview-ready object for a recipient
 * Returns both rendered HTML and subject
 *
 * @param {object} template - Template object with html and subject fields
 * @param {object} recipientData - Recipient data from CSV
 * @returns {object} - { html, subject }
 */
export const getPreview = (template, recipientData) => {
  if (!template) return { html: '', subject: '' };
  return {
    html: renderTemplate(template.html, recipientData),
    subject: renderSubject(template.subject, recipientData),
  };
};
