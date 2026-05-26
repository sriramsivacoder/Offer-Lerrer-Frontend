import { useState, useRef, useCallback } from 'react';
import Papa from 'papaparse';
import toast from 'react-hot-toast';
import { useAppContext } from '../context/AppContext';
import { validateCSVData, EXPECTED_COLUMNS } from '../utils/csvValidator';
import { downloadSampleCSV } from '../services/api';

/**
 * Step 1 — Upload CSV
 * Drag & drop / browse CSV upload with validation and preview
 */
function Step1Upload() {
  const { state, dispatch, ACTIONS } = useAppContext();
  const { csvData, csvColumns, csvFileName } = state;
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  // Handle file parsing
  const processFile = useCallback(
    (file) => {
      if (!file) return;

      if (!file.name.endsWith('.csv')) {
        toast.error('Please upload a CSV file');
        return;
      }

      setIsProcessing(true);

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        complete: (results) => {
          const { data, errors } = results;

          if (errors.length > 0) {
            toast.error(`CSV parsing errors: ${errors[0].message}`);
            setIsProcessing(false);
            return;
          }

          // Filter out empty rows
          const cleanData = data.filter((row) =>
            Object.values(row).some((val) => val && val.trim())
          );

          if (cleanData.length === 0) {
            toast.error('CSV file contains no valid data');
            setIsProcessing(false);
            return;
          }

          // Validate
          const validation = validateCSVData(cleanData);
          setValidationResult(validation);

          if (!validation.isValid) {
            toast.error(validation.error);
            setIsProcessing(false);
            return;
          }

          // Store in context
          dispatch({
            type: ACTIONS.SET_CSV_DATA,
            payload: {
              data: cleanData,
              columns: validation.stats.columns,
              fileName: file.name,
            },
          });

          toast.success(`Successfully loaded ${cleanData.length} recipients`);
          setIsProcessing(false);
        },
        error: (error) => {
          toast.error(`Failed to parse CSV: ${error.message}`);
          setIsProcessing(false);
        },
      });
    },
    [dispatch, ACTIONS]
  );

  // Drag & drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    processFile(file);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  // Replace CSV
  const handleReplace = () => {
    dispatch({ type: ACTIONS.SET_CSV_DATA, payload: { data: [], columns: [], fileName: '' } });
    setValidationResult(null);
    fileInputRef.current.value = '';
  };

  // Download sample CSV
  const handleDownloadSample = async () => {
    try {
      const response = await downloadSampleCSV();
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'sample_recipients.csv';
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Sample CSV downloaded');
    } catch (err) {
      toast.error('Failed to download sample CSV');
    }
  };

  // Next step
  const handleNext = () => {
    if (csvData.length === 0) {
      toast.error('Please upload a CSV file first');
      return;
    }
    dispatch({ type: ACTIONS.SET_STEP, payload: 1 });
  };

  return (
    <div className="step-content">
      <div className="step-header">
        <h2>Upload Recipient Data</h2>
        <p>Upload your CSV file containing recipient information for offer letter generation.</p>
      </div>

      {/* Upload Area */}
      {csvData.length === 0 ? (
        <div className="upload-section">
          <div
            className={`upload-zone ${isDragOver ? 'drag-over' : ''} ${isProcessing ? 'processing' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleBrowseClick}
            id="csv-upload-zone"
          >
            <input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              id="csv-file-input"
            />
            <div className="upload-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <rect x="8" y="6" width="32" height="36" rx="4" stroke="currentColor" strokeWidth="2.5"/>
                <path d="M16 24L24 16L32 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M24 16V34" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            {isProcessing ? (
              <div className="upload-processing">
                <div className="spinner"></div>
                <p>Processing CSV file...</p>
              </div>
            ) : (
              <>
                <p className="upload-text">
                  <strong>Drag & drop</strong> your CSV file here
                </p>
                <p className="upload-subtext">or click to browse</p>
                <span className="upload-hint">Supports .csv files</span>
              </>
            )}
          </div>

          <button
            className="btn btn-outline"
            onClick={handleDownloadSample}
            id="download-sample-btn"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2V10M8 10L5 7M8 10L11 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Download Sample CSV
          </button>
        </div>
      ) : (
        <>
          {/* File Info Card */}
          <div className="card upload-result-card">
            <div className="card-header">
              <div className="file-info">
                <div className="file-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect x="4" y="2" width="16" height="20" rx="3" stroke="currentColor" strokeWidth="2"/>
                    <path d="M8 8H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M8 12H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M8 16H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <h4>{csvFileName}</h4>
                  <p>{csvData.length} recipients loaded</p>
                </div>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleReplace}
                id="replace-csv-btn"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 7C1 10.3137 3.68629 13 7 13C10.3137 13 13 10.3137 13 7C13 3.68629 10.3137 1 7 1C4.78 1 2.85 2.23 1.82 4.05" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M1 1V4H4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Replace CSV
              </button>
            </div>

            {/* Stats */}
            {validationResult && validationResult.stats && (
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-number">{validationResult.stats.totalRows}</span>
                  <span className="stat-label">Total Rows</span>
                </div>
                <div className="stat-item stat-success">
                  <span className="stat-number">{validationResult.stats.validEmails}</span>
                  <span className="stat-label">Valid Emails</span>
                </div>
                <div className="stat-item stat-error">
                  <span className="stat-number">{validationResult.stats.invalidEmails}</span>
                  <span className="stat-label">Invalid Emails</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{validationResult.stats.totalColumns}</span>
                  <span className="stat-label">Columns</span>
                </div>
              </div>
            )}
          </div>

          {/* Recognized Columns */}
          {validationResult && validationResult.stats && (
            <div className="card">
              <div className="card-header">
                <h3>Recognized Columns</h3>
                <span className="badge badge-blue">
                  {validationResult.stats.recognizedColumns} / {validationResult.stats.totalColumns}
                </span>
              </div>
              <div className="columns-grid">
                {EXPECTED_COLUMNS.map((col) => {
                  const found = csvColumns.find(
                    (c) => c.toLowerCase() === col.toLowerCase()
                  );
                  return (
                    <div
                      key={col}
                      className={`column-tag ${found ? 'found' : 'missing'}`}
                    >
                      {found ? '✓' : '✗'} {col}
                    </div>
                  );
                })}
              </div>
              {validationResult.stats.extraColumnNames.length > 0 && (
                <div className="extra-columns">
                  <p className="extra-label">Extra columns:</p>
                  <div className="columns-grid">
                    {validationResult.stats.extraColumnNames.map((col) => (
                      <div key={col} className="column-tag extra">
                        {col}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Preview Table */}
          <div className="card">
            <div className="card-header">
              <h3>Data Preview</h3>
              <span className="badge badge-gray">First 5 rows</span>
            </div>
            <div className="table-wrapper">
              <table className="data-table preview-table">
                <thead>
                  <tr>
                    <th>#</th>
                    {csvColumns.slice(0, 6).map((col) => (
                      <th key={col}>{col}</th>
                    ))}
                    {csvColumns.length > 6 && <th>...</th>}
                  </tr>
                </thead>
                <tbody>
                  {csvData.slice(0, 5).map((row, idx) => (
                    <tr key={idx}>
                      <td className="row-number">{idx + 1}</td>
                      {csvColumns.slice(0, 6).map((col) => (
                        <td key={col}>{row[col] || '—'}</td>
                      ))}
                      {csvColumns.length > 6 && <td>...</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Next Button */}
          <div className="step-actions">
            <div></div>
            <button
              className="btn btn-primary"
              onClick={handleNext}
              id="step1-next-btn"
            >
              Continue to Data Review
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Step1Upload;
