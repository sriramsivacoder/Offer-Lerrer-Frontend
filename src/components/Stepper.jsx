import { useAppContext } from '../context/AppContext';

/**
 * Stepper Component
 * Visual step-by-step progress indicator
 */
function Stepper({ steps }) {
  const { state, dispatch, ACTIONS } = useAppContext();
  const { currentStep, csvData } = state;

  const handleStepClick = (index) => {
    // Allow navigating to previous steps, or next step only if CSV data exists
    if (index <= currentStep || (index === currentStep + 1 && csvData.length > 0)) {
      dispatch({ type: ACTIONS.SET_STEP, payload: index });
    }
  };

  return (
    <div className="stepper-wrapper">
      <div className="stepper">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const isClickable = index <= currentStep || (index === currentStep + 1 && csvData.length > 0);

          return (
            <div key={index} className="stepper-item-wrapper">
              {/* Connector line */}
              {index > 0 && (
                <div className={`stepper-connector ${isCompleted ? 'completed' : ''}`} />
              )}

              {/* Step */}
              <button
                className={`stepper-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${isClickable ? 'clickable' : 'disabled'}`}
                onClick={() => handleStepClick(index)}
                disabled={!isClickable}
                id={`step-${index}`}
              >
                <div className="stepper-circle">
                  {isCompleted ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8L6.5 11.5L13 4.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <div className="stepper-info">
                  <span className="stepper-label">{step.label}</span>
                  <span className="stepper-description">{step.description}</span>
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Stepper;
