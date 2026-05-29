import { createContext, useContext, useReducer } from 'react';

/**
 * Application Context
 * Manages global state across all 4 steps
 *
 * TEMPLATE STATE FIX:
 * - activeTemplate is the SINGLE SOURCE OF TRUTH for the current template
 * - Template HTML must ONLY be updated via SET_ACTIVE_TEMPLATE or UPDATE_ACTIVE_TEMPLATE_HTML
 * - All previews, editors, and PDF generation read from state.activeTemplate.html
 * - NO local component state should duplicate the template HTML
 */
const AppContext = createContext();

// Initial state
const initialState = {
  // Step tracking
  currentStep: 0,

  // Step 1: CSV data
  csvData: [],
  csvColumns: [],
  csvFileName: '',

  // Step 2: Recipients
  selectedRecipients: [],

  // Step 3: Template — SINGLE SOURCE OF TRUTH
  activeTemplate: null,
  templates: [],
  logoUrl: '',

  // Step 4: SMTP & Send
  smtpConfig: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    user: '',
    pass: '',
    fromName: 'Offer Letter Dispatcher',
  },
  sendResults: [],
  isSending: false,
};

// Action types
const ACTIONS = {
  SET_STEP: 'SET_STEP',
  SET_CSV_DATA: 'SET_CSV_DATA',
  UPDATE_ROW: 'UPDATE_ROW',
  DELETE_ROW: 'DELETE_ROW',
  ADD_ROW: 'ADD_ROW',
  SET_SELECTED: 'SET_SELECTED',
  TOGGLE_SELECT: 'TOGGLE_SELECT',
  SELECT_ALL: 'SELECT_ALL',
  DESELECT_ALL: 'DESELECT_ALL',
  SET_TEMPLATES: 'SET_TEMPLATES',
  SET_ACTIVE_TEMPLATE: 'SET_ACTIVE_TEMPLATE',
  UPDATE_ACTIVE_TEMPLATE_HTML: 'UPDATE_ACTIVE_TEMPLATE_HTML',
  UPDATE_ACTIVE_TEMPLATE_SUBJECT: 'UPDATE_ACTIVE_TEMPLATE_SUBJECT',
  SET_LOGO: 'SET_LOGO',
  SET_SMTP: 'SET_SMTP',
  SET_SEND_RESULTS: 'SET_SEND_RESULTS',
  SET_SENDING: 'SET_SENDING',
  RESET_WORKFLOW: 'RESET_WORKFLOW',
  RESET: 'RESET',
};

// Reducer
function appReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_STEP:
      return { ...state, currentStep: action.payload };

    case ACTIONS.SET_CSV_DATA:
      return {
        ...state,
        csvData: action.payload.data,
        csvColumns: action.payload.columns,
        csvFileName: action.payload.fileName,
        selectedRecipients: action.payload.data.map((_, i) => i),
      };

    case ACTIONS.UPDATE_ROW:
      return {
        ...state,
        csvData: state.csvData.map((row, i) =>
          i === action.payload.index ? { ...row, ...action.payload.data } : row
        ),
      };

    case ACTIONS.DELETE_ROW: {
      const newData = state.csvData.filter((_, i) => i !== action.payload);
      return {
        ...state,
        csvData: newData,
        selectedRecipients: state.selectedRecipients
          .filter(i => i !== action.payload)
          .map(i => (i > action.payload ? i - 1 : i)),
      };
    }

    case ACTIONS.ADD_ROW:
      return {
        ...state,
        csvData: [...state.csvData, action.payload],
        selectedRecipients: [...state.selectedRecipients, state.csvData.length],
      };

    case ACTIONS.SET_SELECTED:
      return { ...state, selectedRecipients: action.payload };

    case ACTIONS.TOGGLE_SELECT: {
      const idx = action.payload;
      const isSelected = state.selectedRecipients.includes(idx);
      return {
        ...state,
        selectedRecipients: isSelected
          ? state.selectedRecipients.filter(i => i !== idx)
          : [...state.selectedRecipients, idx],
      };
    }

    case ACTIONS.SELECT_ALL:
      return {
        ...state,
        selectedRecipients: state.csvData.map((_, i) => i),
      };

    case ACTIONS.DESELECT_ALL:
      return { ...state, selectedRecipients: [] };

    case ACTIONS.SET_TEMPLATES:
      return { ...state, templates: action.payload };

    case ACTIONS.SET_ACTIVE_TEMPLATE:
      return { ...state, activeTemplate: action.payload };

    /**
     * KEY FIX: Direct template HTML update
     * This updates ONLY the html field of activeTemplate without replacing the entire object.
     * Used by the editor to keep state in sync without a full re-render.
     */
    case ACTIONS.UPDATE_ACTIVE_TEMPLATE_HTML:
      return {
        ...state,
        activeTemplate: state.activeTemplate
          ? { ...state.activeTemplate, html: action.payload }
          : state.activeTemplate,
      };

    case ACTIONS.UPDATE_ACTIVE_TEMPLATE_SUBJECT:
      return {
        ...state,
        activeTemplate: state.activeTemplate
          ? { ...state.activeTemplate, subject: action.payload }
          : state.activeTemplate,
      };

    case ACTIONS.SET_LOGO:
      return { ...state, logoUrl: action.payload };

    case ACTIONS.SET_SMTP:
      return { ...state, smtpConfig: { ...state.smtpConfig, ...action.payload } };

    case ACTIONS.SET_SEND_RESULTS:
      return { ...state, sendResults: action.payload };

    case ACTIONS.SET_SENDING:
      return { ...state, isSending: action.payload };

    /**
     * RESET WORKFLOW: Clear CSV, send results, and navigation
     * Preserves user's templates and SMTP config
     */
    case ACTIONS.RESET_WORKFLOW:
      return {
        ...state,
        currentStep: 0,
        csvData: [],
        csvColumns: [],
        csvFileName: '',
        selectedRecipients: [],
        sendResults: [],
        isSending: false,
      };

    case ACTIONS.RESET:
      return initialState;

    default:
      return state;
  }
}

// Provider component
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch, ACTIONS }}>
      {children}
    </AppContext.Provider>
  );
}

// Custom hook
export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

export default AppContext;
