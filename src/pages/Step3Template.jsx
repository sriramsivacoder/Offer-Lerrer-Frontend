import { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import toast from 'react-hot-toast';
import { useAppContext } from '../context/AppContext';
import { PLACEHOLDERS, replacePlaceholders } from '../utils/placeholders';
import { fetchTemplates, createTemplate, updateTemplate, uploadLogo, getLogos } from '../services/api';

/**
 * Step 3 — Customize Template
 * Template selector, rich text editor, placeholder insertion, logo upload, and live preview
 */

// React Quill toolbar configuration
const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ align: [] }],
    ['link'],
    ['clean'],
  ],
};

const QUILL_FORMATS = [
  'header', 'bold', 'italic', 'underline', 'strike',
  'color', 'background', 'list', 'bullet', 'align', 'link',
];

function Step3Template() {
  const { state, dispatch, ACTIONS } = useAppContext();
  const { templates, activeTemplate, csvData, logoUrl } = state;

  const [isLoading, setIsLoading] = useState(true);
  const [showHtmlEditor, setShowHtmlEditor] = useState(false);
  const [htmlCode, setHtmlCode] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [logos, setLogos] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const quillRef = useRef(null);
  const logoInputRef = useRef(null);

  // Fetch templates on mount
  useEffect(() => {
    loadTemplates();
    loadLogos();
  }, []);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const res = await fetchTemplates();
      const data = res.data.data;
      dispatch({ type: ACTIONS.SET_TEMPLATES, payload: data });
      if (!activeTemplate && data.length > 0) {
        dispatch({ type: ACTIONS.SET_ACTIVE_TEMPLATE, payload: data[0] });
        setHtmlCode(data[0].html);
      }
    } catch (err) {
      toast.error('Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  const loadLogos = async () => {
    try {
      const res = await getLogos();
      setLogos(res.data.data || []);
    } catch (err) {
      // Logos are optional
    }
  };

  // Select template
  const handleSelectTemplate = (template) => {
    dispatch({ type: ACTIONS.SET_ACTIVE_TEMPLATE, payload: template });
    setHtmlCode(template.html);
  };

  // Quill editor change
  const handleEditorChange = (content) => {
    if (activeTemplate) {
      dispatch({
        type: ACTIONS.SET_ACTIVE_TEMPLATE,
        payload: { ...activeTemplate, html: content },
      });
    }
  };

  // HTML editor change
  const handleHtmlChange = (e) => {
    const html = e.target.value;
    setHtmlCode(html);
    if (activeTemplate) {
      dispatch({
        type: ACTIONS.SET_ACTIVE_TEMPLATE,
        payload: { ...activeTemplate, html },
      });
    }
  };

  // Toggle HTML mode
  const toggleHtmlEditor = () => {
    if (showHtmlEditor) {
      // Switching from HTML to visual mode
      if (activeTemplate) {
        dispatch({
          type: ACTIONS.SET_ACTIVE_TEMPLATE,
          payload: { ...activeTemplate, html: htmlCode },
        });
      }
    } else {
      // Switching to HTML mode
      setHtmlCode(activeTemplate?.html || '');
    }
    setShowHtmlEditor(!showHtmlEditor);
  };

  // Insert placeholder
  const insertPlaceholder = (placeholder) => {
    if (showHtmlEditor) {
      setHtmlCode((prev) => prev + placeholder);
      if (activeTemplate) {
        dispatch({
          type: ACTIONS.SET_ACTIVE_TEMPLATE,
          payload: { ...activeTemplate, html: htmlCode + placeholder },
        });
      }
    } else {
      const quill = quillRef.current?.getEditor();
      if (quill) {
        const range = quill.getSelection(true);
        quill.insertText(range.index, placeholder);
        quill.setSelection(range.index + placeholder.length);
      }
    }
    toast.success(`Inserted ${placeholder}`);
  };

  // Save template
  const handleSave = async () => {
    if (!activeTemplate) return;
    setIsSaving(true);
    try {
      if (activeTemplate._id) {
        const res = await updateTemplate(activeTemplate._id, {
          name: activeTemplate.name,
          subject: activeTemplate.subject,
          html: activeTemplate.html,
          logoUrl: logoUrl,
        });
        toast.success('Template saved');
        dispatch({ type: ACTIONS.SET_ACTIVE_TEMPLATE, payload: res.data.data });
      } else {
        const res = await createTemplate({
          name: activeTemplate.name,
          subject: activeTemplate.subject,
          html: activeTemplate.html,
          logoUrl: logoUrl,
        });
        toast.success('Template created');
        dispatch({ type: ACTIONS.SET_ACTIVE_TEMPLATE, payload: res.data.data });
        loadTemplates();
      }
    } catch (err) {
      toast.error('Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset template
  const handleReset = () => {
    const original = templates.find((t) => t._id === activeTemplate?._id);
    if (original) {
      dispatch({ type: ACTIONS.SET_ACTIVE_TEMPLATE, payload: { ...original } });
      setHtmlCode(original.html);
      toast.success('Template reset');
    }
  };

  // Copy template HTML
  const handleCopy = () => {
    navigator.clipboard.writeText(activeTemplate?.html || '');
    toast.success('Template HTML copied to clipboard');
  };

  // Logo upload
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('logo', file);

    try {
      const res = await uploadLogo(formData);
      const path = res.data.data.path;
      dispatch({ type: ACTIONS.SET_LOGO, payload: path });
      loadLogos();
      toast.success('Logo uploaded');
    } catch (err) {
      toast.error('Failed to upload logo');
    }
  };

  // Select existing logo
  const handleSelectLogo = (path) => {
    dispatch({ type: ACTIONS.SET_LOGO, payload: path });
    toast.success('Logo selected');
  };

  // Get preview data (first CSV row)
  const previewData = csvData.length > 0 ? csvData[0] : {};
  const previewHtml = activeTemplate ? replacePlaceholders(activeTemplate.html, previewData) : '';

  // Navigation
  const handlePrev = () => dispatch({ type: ACTIONS.SET_STEP, payload: 1 });
  const handleNext = () => {
    if (!activeTemplate || !activeTemplate.html) {
      toast.error('Please customize your template first');
      return;
    }
    dispatch({ type: ACTIONS.SET_STEP, payload: 3 });
  };

  if (isLoading) {
    return (
      <div className="step-content">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="step-content">
      <div className="step-header">
        <h2>Customize Offer Letter</h2>
        <p>Choose a template, customize the content, and preview your offer letter.</p>
      </div>

      {/* Template Selector Cards */}
      <div className="template-cards">
        {templates.map((tmpl) => (
          <button
            key={tmpl._id}
            className={`template-card ${activeTemplate?._id === tmpl._id ? 'active' : ''}`}
            onClick={() => handleSelectTemplate(tmpl)}
          >
            <div className="template-card-icon">
              {tmpl.name === 'Professional' ? '💼' : tmpl.name === 'Modern' ? '🎨' : '📝'}
            </div>
            <h4>{tmpl.name}</h4>
            <p className="template-card-desc">
              {tmpl.name === 'Professional'
                ? 'Classic corporate style'
                : tmpl.name === 'Modern'
                ? 'Vibrant & friendly'
                : 'Clean & minimal'}
            </p>
          </button>
        ))}
      </div>

      {/* Subject Line */}
      {activeTemplate && (
        <div className="card">
          <div className="form-group">
            <label className="form-label">Email Subject</label>
            <input
              type="text"
              className="form-input"
              value={activeTemplate.subject || ''}
              onChange={(e) =>
                dispatch({
                  type: ACTIONS.SET_ACTIVE_TEMPLATE,
                  payload: { ...activeTemplate, subject: e.target.value },
                })
              }
              placeholder="Enter email subject line..."
              id="email-subject-input"
            />
          </div>
        </div>
      )}

      {/* Editor Section */}
      <div className="editor-section">
        <div className="editor-main">
          <div className="card">
            <div className="card-header">
              <h3>Template Editor</h3>
              <div className="editor-actions">
                <button
                  className={`btn btn-ghost btn-sm ${showHtmlEditor ? 'btn-active' : ''}`}
                  onClick={toggleHtmlEditor}
                >
                  {showHtmlEditor ? '🎨 Visual' : '< /> HTML'}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={handleReset}>
                  ↩ Reset
                </button>
                <button className="btn btn-ghost btn-sm" onClick={handleCopy}>
                  📋 Copy
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : '💾 Save'}
                </button>
              </div>
            </div>

            {showHtmlEditor ? (
              <textarea
                className="html-editor"
                value={htmlCode}
                onChange={handleHtmlChange}
                spellCheck={false}
                id="html-code-editor"
              />
            ) : (
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={activeTemplate?.html || ''}
                onChange={handleEditorChange}
                modules={QUILL_MODULES}
                formats={QUILL_FORMATS}
              />
            )}
          </div>

          {/* Placeholder Tags */}
          <div className="card">
            <div className="card-header">
              <h3>Insert Placeholders</h3>
            </div>
            <div className="placeholder-grid">
              {PLACEHOLDERS.map((p) => (
                <button
                  key={p.key}
                  className="placeholder-tag"
                  onClick={() => insertPlaceholder(p.key)}
                  title={p.description}
                >
                  {p.key}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar: Logo & Preview */}
        <div className="editor-sidebar">
          {/* Logo Section */}
          <div className="card">
            <div className="card-header">
              <h3>Company Logo</h3>
            </div>
            <div className="logo-section">
              {logoUrl && (
                <div className="logo-preview">
                  <img
                    src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${logoUrl}`}
                    alt="Company logo"
                    className="logo-image"
                  />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                ref={logoInputRef}
                onChange={handleLogoUpload}
                style={{ display: 'none' }}
              />
              <button
                className="btn btn-outline btn-sm btn-full"
                onClick={() => logoInputRef.current?.click()}
              >
                📷 Upload Logo
              </button>
              {logos.length > 0 && (
                <div className="logo-gallery">
                  {logos.map((logo) => (
                    <button
                      key={logo.filename}
                      className={`logo-gallery-item ${logoUrl === logo.path ? 'selected' : ''}`}
                      onClick={() => handleSelectLogo(logo.path)}
                    >
                      <img
                        src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${logo.url}`}
                        alt={logo.filename}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Preview Toggle */}
          <div className="card">
            <div className="card-header">
              <h3>Live Preview</h3>
              <button
                className={`btn btn-ghost btn-sm ${showPreview ? 'btn-active' : ''}`}
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? 'Hide' : 'Show'}
              </button>
            </div>
            {showPreview && (
              <div className="preview-frame">
                <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </div>
            )}
            {!showPreview && (
              <p className="preview-hint">
                Click "Show" to see a live preview with data from the first recipient.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Step Navigation */}
      <div className="step-actions">
        <button className="btn btn-ghost" onClick={handlePrev}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M13 8H3M3 8L7 4M3 8L7 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to Review
        </button>
        <button className="btn btn-primary" onClick={handleNext} id="step3-next-btn">
          Continue to Send
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

export default Step3Template;
