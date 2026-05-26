import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAppContext } from '../context/AppContext';
import { replacePlaceholders } from '../utils/placeholders';
import { sendMails, previewPDF, verifySmtp } from '../services/api';

/**
 * Step 4 — Preview & Send
 * Preview emails/PDFs per recipient, configure SMTP, and send bulk emails
 */
function Step4Send() {
  const { state, dispatch, ACTIONS } = useAppContext();
  const {
    csvData,
    selectedRecipients,
    activeTemplate,
    smtpConfig,
    logoUrl,
    isSending,
    sendResults,
  } = state;

  const [previewIndex, setPreviewIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('mail'); // 'mail' or 'pdf'
  const [pdfBase64, setPdfBase64] = useState('');
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [showSmtpPanel, setShowSmtpPanel] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [smtpVerified, setSmtpVerified] = useState(false);

  // Get selected recipients data
  const selectedData = selectedRecipients
    .sort((a, b) => a - b)
    .map((i) => csvData[i])
    .filter(Boolean);

  const currentRecipient = selectedData[previewIndex] || {};

  // Generate preview HTML
  const previewHtml = activeTemplate
    ? replacePlaceholders(activeTemplate.html, currentRecipient)
    : '';
  const previewSubject = activeTemplate
    ? replacePlaceholders(activeTemplate.subject || '', currentRecipient)
    : '';

  // Load PDF preview
  const loadPdfPreview = async () => {
    if (!currentRecipient || !activeTemplate) return;
    setIsLoadingPdf(true);
    try {
      const res = await previewPDF({
        recipient: currentRecipient,
        templateHtml: activeTemplate.html,
        logoUrl: logoUrl,
      });
      setPdfBase64(res.data.data);
    } catch (err) {
      toast.error('Failed to generate PDF preview');
    } finally {
      setIsLoadingPdf(false);
    }
  };

  // Load PDF when switching to PDF tab or changing recipient
  useEffect(() => {
    if (activeTab === 'pdf' && currentRecipient.email) {
      loadPdfPreview();
    }
  }, [activeTab, previewIndex]);

  // Navigate recipients
  const handlePrevRecipient = () => {
    if (previewIndex > 0) {
      setPreviewIndex(previewIndex - 1);
      setPdfBase64('');
    }
  };

  const handleNextRecipient = () => {
    if (previewIndex < selectedData.length - 1) {
      setPreviewIndex(previewIndex + 1);
      setPdfBase64('');
    }
  };

  // SMTP handlers
  const handleSmtpChange = (field, value) => {
    dispatch({ type: ACTIONS.SET_SMTP, payload: { [field]: value } });
    setSmtpVerified(false);
  };

  const handleVerifySmtp = async () => {
    if (!smtpConfig.user || !smtpConfig.pass) {
      toast.error('Please enter email and app password');
      return;
    }
    setIsVerifying(true);
    try {
      const res = await verifySmtp(smtpConfig);
      if (res.data.success) {
        setSmtpVerified(true);
        toast.success('SMTP connection verified!');
      } else {
        toast.error(`Verification failed: ${res.data.message}`);
      }
    } catch (err) {
      toast.error('SMTP verification failed. Check your credentials.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Send emails
  const handleSendAll = async () => {
    if (!smtpConfig.user || !smtpConfig.pass) {
      toast.error('Please configure SMTP settings first');
      return;
    }

    if (selectedData.length === 0) {
      toast.error('No recipients selected');
      return;
    }

    if (!activeTemplate) {
      toast.error('No template selected');
      return;
    }

    const confirmMsg = `Send offer letters to ${selectedData.length} recipient(s)?`;
    if (!window.confirm(confirmMsg)) return;

    dispatch({ type: ACTIONS.SET_SENDING, payload: true });
    dispatch({ type: ACTIONS.SET_SEND_RESULTS, payload: [] });

    try {
      const res = await sendMails({
        recipients: selectedData,
        template: activeTemplate,
        smtpConfig: smtpConfig,
        logoUrl: logoUrl,
      });

      dispatch({ type: ACTIONS.SET_SEND_RESULTS, payload: res.data.results });
      dispatch({ type: ACTIONS.SET_SENDING, payload: false });

      const { sent, failed } = res.data.summary;
      if (failed === 0) {
        toast.success(`All ${sent} emails sent successfully! 🎉`);
      } else {
        toast(`${sent} sent, ${failed} failed`, { icon: '⚠️' });
      }
    } catch (err) {
      dispatch({ type: ACTIONS.SET_SENDING, payload: false });
      toast.error(err.response?.data?.message || 'Failed to send emails');
    }
  };

  // Navigation
  const handlePrev = () => dispatch({ type: ACTIONS.SET_STEP, payload: 2 });

  return (
    <div className="step-content">
      <div className="step-header">
        <h2>Preview & Send</h2>
        <p>
          Review each recipient's email and PDF, configure SMTP, and dispatch offer letters.
        </p>
      </div>

      <div className="send-layout">
        {/* Left: Preview */}
        <div className="preview-section">
          {/* Recipient Navigation */}
          <div className="card">
            <div className="recipient-nav">
              <button
                className="btn btn-ghost btn-sm"
                onClick={handlePrevRecipient}
                disabled={previewIndex === 0}
              >
                ← Previous
              </button>
              <div className="recipient-info">
                <strong>{currentRecipient.name || 'No recipient'}</strong>
                <span>{currentRecipient.email || ''}</span>
                <span className="recipient-counter">
                  {previewIndex + 1} of {selectedData.length}
                </span>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleNextRecipient}
                disabled={previewIndex >= selectedData.length - 1}
              >
                Next →
              </button>
            </div>
          </div>

          {/* Preview Tabs */}
          <div className="card">
            <div className="tabs">
              <button
                className={`tab ${activeTab === 'mail' ? 'active' : ''}`}
                onClick={() => setActiveTab('mail')}
                id="mail-preview-tab"
              >
                📧 Email Preview
              </button>
              <button
                className={`tab ${activeTab === 'pdf' ? 'active' : ''}`}
                onClick={() => setActiveTab('pdf')}
                id="pdf-preview-tab"
              >
                📄 PDF Preview
              </button>
            </div>

            {activeTab === 'mail' ? (
              <div className="mail-preview">
                <div className="mail-meta">
                  <div className="mail-meta-row">
                    <span className="mail-meta-label">To:</span>
                    <span>{currentRecipient.email || '—'}</span>
                  </div>
                  <div className="mail-meta-row">
                    <span className="mail-meta-label">Subject:</span>
                    <span>{previewSubject || '—'}</span>
                  </div>
                </div>
                <div className="mail-body">
                  <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                </div>
              </div>
            ) : (
              <div className="pdf-preview">
                {isLoadingPdf ? (
                  <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Generating PDF preview...</p>
                  </div>
                ) : pdfBase64 ? (
                  <iframe
                    src={`data:application/pdf;base64,${pdfBase64}`}
                    className="pdf-frame"
                    title="PDF Preview"
                  />
                ) : (
                  <div className="empty-state">
                    <p>Click a recipient to generate PDF preview</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: SMTP & Send */}
        <div className="send-sidebar">
          {/* SMTP Settings */}
          <div className="card">
            <div className="card-header">
              <h3>SMTP Settings</h3>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowSmtpPanel(!showSmtpPanel)}
              >
                {showSmtpPanel ? 'Hide' : 'Show'}
              </button>
            </div>

            {showSmtpPanel && (
              <div className="smtp-form">
                <div className="form-group">
                  <label className="form-label">Sender Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={smtpConfig.user}
                    onChange={(e) => handleSmtpChange('user', e.target.value)}
                    placeholder="your-email@gmail.com"
                    id="smtp-email"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">App Password</label>
                  <input
                    type="password"
                    className="form-input"
                    value={smtpConfig.pass}
                    onChange={(e) => handleSmtpChange('pass', e.target.value)}
                    placeholder="xxxx xxxx xxxx xxxx"
                    id="smtp-password"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Display Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={smtpConfig.fromName}
                    onChange={(e) => handleSmtpChange('fromName', e.target.value)}
                    placeholder="Offer Letter Dispatcher"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">SMTP Host</label>
                    <input
                      type="text"
                      className="form-input"
                      value={smtpConfig.host}
                      onChange={(e) => handleSmtpChange('host', e.target.value)}
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Port</label>
                    <input
                      type="number"
                      className="form-input"
                      value={smtpConfig.port}
                      onChange={(e) => handleSmtpChange('port', Number(e.target.value))}
                      placeholder="587"
                    />
                  </div>
                </div>

                <button
                  className={`btn btn-outline btn-full ${smtpVerified ? 'btn-success' : ''}`}
                  onClick={handleVerifySmtp}
                  disabled={isVerifying}
                  id="verify-smtp-btn"
                >
                  {isVerifying
                    ? 'Verifying...'
                    : smtpVerified
                    ? '✓ Verified'
                    : '🔗 Verify Connection'}
                </button>

                {/* Gmail Instructions */}
                <div className="smtp-help">
                  <details>
                    <summary>📌 Gmail App Password Setup</summary>
                    <ol>
                      <li>Go to <strong>Google Account → Security</strong></li>
                      <li>Enable <strong>2-Step Verification</strong></li>
                      <li>Go to <strong>App passwords</strong></li>
                      <li>Select <strong>Mail</strong> and generate</li>
                      <li>Use the 16-char password above</li>
                    </ol>
                  </details>
                </div>
              </div>
            )}
          </div>

          {/* Send Summary */}
          <div className="card">
            <div className="card-header">
              <h3>Send Summary</h3>
            </div>
            <div className="send-summary">
              <div className="summary-row">
                <span>Recipients</span>
                <strong>{selectedData.length}</strong>
              </div>
              <div className="summary-row">
                <span>Template</span>
                <strong>{activeTemplate?.name || '—'}</strong>
              </div>
              <div className="summary-row">
                <span>Sender</span>
                <strong>{smtpConfig.user || '—'}</strong>
              </div>
              <div className="summary-row">
                <span>Attachment</span>
                <strong>PDF (auto-generated)</strong>
              </div>
            </div>

            <button
              className="btn btn-primary btn-full btn-lg"
              onClick={handleSendAll}
              disabled={isSending || !smtpConfig.user || !smtpConfig.pass}
              id="send-all-btn"
            >
              {isSending ? (
                <>
                  <div className="spinner spinner-sm"></div>
                  Sending...
                </>
              ) : (
                <>🚀 Send {selectedData.length} Offer Letters</>
              )}
            </button>
          </div>

          {/* Send Results */}
          {sendResults.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3>Delivery Status</h3>
                <span className="badge badge-blue">
                  {sendResults.filter((r) => r.status === 'sent').length}/{sendResults.length} sent
                </span>
              </div>
              <div className="results-list">
                {sendResults.map((result, idx) => (
                  <div
                    key={idx}
                    className={`result-item ${result.status === 'sent' ? 'success' : 'failed'}`}
                  >
                    <div className="result-icon">
                      {result.status === 'sent' ? '✅' : '❌'}
                    </div>
                    <div className="result-info">
                      <strong>{result.name}</strong>
                      <span>{result.email}</span>
                      {result.error && (
                        <span className="result-error">{result.error}</span>
                      )}
                    </div>
                    {result.retryCount > 0 && (
                      <span className="badge badge-gray">
                        {result.retryCount} retries
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Step Navigation */}
      <div className="step-actions">
        <button className="btn btn-ghost" onClick={handlePrev}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M13 8H3M3 8L7 4M3 8L7 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to Template
        </button>
        <div></div>
      </div>
    </div>
  );
}

export default Step4Send;
