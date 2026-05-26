import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useAppContext } from '../context/AppContext';
import { isValidEmail, EXPECTED_COLUMNS } from '../utils/csvValidator';
import Modal from '../components/Modal';

/**
 * Step 2 — Data Review
 * Editable table with search, pagination, select/deselect, and inline editing
 */
const ROWS_PER_PAGE = 10;

function Step2Review() {
  const { state, dispatch, ACTIONS } = useAppContext();
  const { csvData, csvColumns, selectedRecipients } = state;

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingCell, setEditingCell] = useState(null); // { rowIndex, column }
  const [editValue, setEditValue] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRowData, setNewRowData] = useState({});

  // Filter data by search
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return csvData;
    const q = searchQuery.toLowerCase();
    return csvData.filter((row) =>
      Object.values(row).some((val) =>
        String(val).toLowerCase().includes(q)
      )
    );
  }, [csvData, searchQuery]);

  // Get original indices for filtered data
  const filteredIndices = useMemo(() => {
    if (!searchQuery.trim()) return csvData.map((_, i) => i);
    const q = searchQuery.toLowerCase();
    return csvData
      .map((row, i) => ({
        row,
        index: i,
      }))
      .filter(({ row }) =>
        Object.values(row).some((val) =>
          String(val).toLowerCase().includes(q)
        )
      )
      .map(({ index }) => index);
  }, [csvData, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / ROWS_PER_PAGE);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE
  );
  const paginatedIndices = filteredIndices.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE
  );

  // Stats
  const validEmails = csvData.filter((r) => isValidEmail(r.email || '')).length;
  const invalidEmails = csvData.length - validEmails;
  const selectedCount = selectedRecipients.length;

  // Inline editing
  const startEdit = (rowIndex, column) => {
    setEditingCell({ rowIndex, column });
    setEditValue(csvData[rowIndex][column] || '');
  };

  const saveEdit = () => {
    if (!editingCell) return;
    const { rowIndex, column } = editingCell;
    dispatch({
      type: ACTIONS.UPDATE_ROW,
      payload: { index: rowIndex, data: { [column]: editValue } },
    });
    setEditingCell(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  // Delete recipient
  const handleDelete = (index) => {
    dispatch({ type: ACTIONS.DELETE_ROW, payload: index });
    toast.success('Recipient removed');
  };

  // Toggle select
  const handleToggleSelect = (index) => {
    dispatch({ type: ACTIONS.TOGGLE_SELECT, payload: index });
  };

  // Bulk select
  const handleSelectAll = () => {
    dispatch({ type: ACTIONS.SELECT_ALL });
  };

  const handleDeselectAll = () => {
    dispatch({ type: ACTIONS.DESELECT_ALL });
  };

  // Add new recipient
  const handleAddRecipient = () => {
    const hasName = newRowData.name && newRowData.name.trim();
    const hasEmail = newRowData.email && newRowData.email.trim();

    if (!hasName || !hasEmail) {
      toast.error('Name and email are required');
      return;
    }

    if (!isValidEmail(newRowData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    dispatch({ type: ACTIONS.ADD_ROW, payload: newRowData });
    setNewRowData({});
    setShowAddModal(false);
    toast.success('Recipient added');
  };

  // Export updated CSV
  const handleExport = () => {
    const headers = csvColumns.join(',');
    const rows = csvData.map((row) =>
      csvColumns.map((col) => `"${(row[col] || '').replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'updated_recipients.csv';
    link.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  // Navigation
  const handlePrev = () => dispatch({ type: ACTIONS.SET_STEP, payload: 0 });
  const handleNext = () => {
    if (selectedRecipients.length === 0) {
      toast.error('Please select at least one recipient');
      return;
    }
    dispatch({ type: ACTIONS.SET_STEP, payload: 2 });
  };

  // Columns to display in table (limit for readability)
  const displayColumns = csvColumns.slice(0, 8);

  return (
    <div className="step-content">
      <div className="step-header">
        <h2>Review & Edit Recipients</h2>
        <p>Review your data, edit cells inline, and select recipients for offer letters.</p>
      </div>

      {/* Stats Row */}
      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-number">{csvData.length}</span>
          <span className="stat-label">Total Recipients</span>
        </div>
        <div className="stat-item stat-primary">
          <span className="stat-number">{selectedCount}</span>
          <span className="stat-label">Selected</span>
        </div>
        <div className="stat-item stat-success">
          <span className="stat-number">{validEmails}</span>
          <span className="stat-label">Valid Emails</span>
        </div>
        <div className="stat-item stat-error">
          <span className="stat-number">{invalidEmails}</span>
          <span className="stat-label">Invalid Emails</span>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="card">
        <div className="toolbar">
          <div className="toolbar-left">
            <div className="search-input-wrapper">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="search-icon">
                <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input
                type="text"
                className="search-input"
                placeholder="Search recipients..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                id="search-recipients"
              />
            </div>
          </div>
          <div className="toolbar-right">
            <button className="btn btn-ghost btn-sm" onClick={handleSelectAll} id="select-all-btn">
              Select All
            </button>
            <button className="btn btn-ghost btn-sm" onClick={handleDeselectAll} id="deselect-all-btn">
              Deselect All
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => setShowAddModal(true)} id="add-recipient-btn">
              + Add
            </button>
            <button className="btn btn-outline btn-sm" onClick={handleExport} id="export-csv-btn">
              ↓ Export
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="table-wrapper">
          <table className="data-table editable-table">
            <thead>
              <tr>
                <th className="checkbox-col">
                  <input
                    type="checkbox"
                    checked={selectedRecipients.length === csvData.length}
                    onChange={() =>
                      selectedRecipients.length === csvData.length
                        ? handleDeselectAll()
                        : handleSelectAll()
                    }
                    id="select-all-checkbox"
                  />
                </th>
                <th>#</th>
                {displayColumns.map((col) => (
                  <th key={col}>{col}</th>
                ))}
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={displayColumns.length + 4} className="empty-state-cell">
                    {searchQuery ? 'No matching recipients found' : 'No recipients loaded'}
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, idx) => {
                  const originalIndex = paginatedIndices[idx];
                  const isSelected = selectedRecipients.includes(originalIndex);
                  const emailValid = isValidEmail(row.email || '');

                  return (
                    <tr key={originalIndex} className={isSelected ? 'row-selected' : ''}>
                      <td className="checkbox-col">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(originalIndex)}
                        />
                      </td>
                      <td className="row-number">{originalIndex + 1}</td>
                      {displayColumns.map((col) => (
                        <td
                          key={col}
                          className="editable-cell"
                          onDoubleClick={() => startEdit(originalIndex, col)}
                        >
                          {editingCell &&
                          editingCell.rowIndex === originalIndex &&
                          editingCell.column === col ? (
                            <input
                              type="text"
                              className="cell-input"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={saveEdit}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveEdit();
                                if (e.key === 'Escape') cancelEdit();
                              }}
                              autoFocus
                            />
                          ) : (
                            <span className="cell-text">{row[col] || '—'}</span>
                          )}
                        </td>
                      ))}
                      <td>
                        <span className={`badge ${emailValid ? 'badge-green' : 'badge-red'}`}>
                          {emailValid ? 'Valid' : 'Invalid'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-ghost btn-xs btn-danger"
                          onClick={() => handleDelete(originalIndex)}
                          title="Delete"
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M2 4H12M5 4V2H9V4M5 6V11M9 6V11M3 4V12C3 12.5523 3.44772 13 4 13H10C10.5523 13 11 12.5523 11 12V4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <span className="pagination-info">
              Showing {(currentPage - 1) * ROWS_PER_PAGE + 1}–
              {Math.min(currentPage * ROWS_PER_PAGE, filteredData.length)} of{' '}
              {filteredData.length}
            </span>
            <div className="pagination-controls">
              <button
                className="btn btn-ghost btn-sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                ← Prev
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    className={`btn btn-ghost btn-sm ${currentPage === pageNum ? 'btn-active' : ''}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                className="btn btn-ghost btn-sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Recipient Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Recipient"
      >
        <div className="form-grid">
          {EXPECTED_COLUMNS.map((col) => (
            <div className="form-group" key={col}>
              <label className="form-label">{col}</label>
              <input
                type="text"
                className="form-input"
                value={newRowData[col] || ''}
                onChange={(e) =>
                  setNewRowData((prev) => ({ ...prev, [col]: e.target.value }))
                }
                placeholder={`Enter ${col}`}
              />
            </div>
          ))}
        </div>
        <div className="modal-actions">
          <button
            className="btn btn-ghost"
            onClick={() => setShowAddModal(false)}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleAddRecipient}
            id="confirm-add-recipient"
          >
            Add Recipient
          </button>
        </div>
      </Modal>

      {/* Step Navigation */}
      <div className="step-actions">
        <button className="btn btn-ghost" onClick={handlePrev}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M13 8H3M3 8L7 4M3 8L7 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to Upload
        </button>
        <button className="btn btn-primary" onClick={handleNext} id="step2-next-btn">
          Continue to Template
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

export default Step2Review;
