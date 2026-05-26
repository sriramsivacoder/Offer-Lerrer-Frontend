import { useAppContext } from '../context/AppContext';
import Stepper from '../components/Stepper';
import Step1Upload from '../pages/Step1Upload';
import Step2Review from '../pages/Step2Review';
import Step3Template from '../pages/Step3Template';
import Step4Send from '../pages/Step4Send';

/**
 * MainLayout Component
 * Renders the stepper navigation and active step content
 */
const STEPS = [
  { label: 'Upload CSV', icon: '📄', description: 'Upload your recipient data' },
  { label: 'Data Review', icon: '📋', description: 'Review and edit recipients' },
  { label: 'Customize', icon: '✨', description: 'Design your offer letter' },
  { label: 'Send', icon: '🚀', description: 'Preview and dispatch emails' },
];

function MainLayout() {
  const { state } = useAppContext();

  const renderStep = () => {
    switch (state.currentStep) {
      case 0:
        return <Step1Upload />;
      case 1:
        return <Step2Review />;
      case 2:
        return <Step3Template />;
      case 3:
        return <Step4Send />;
      default:
        return <Step1Upload />;
    }
  };

  return (
    <div className="app-layout">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="header-brand">
            <div className="brand-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="2"/>
                <path d="M2 7L12 13L22 7" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div>
              <h1 className="brand-title">Offer Letter Dispatcher</h1>
              <p className="brand-subtitle">Send personalized offer letters at scale</p>
            </div>
          </div>
        </div>
      </header>

      {/* Stepper */}
      <Stepper steps={STEPS} />

      {/* Step Content */}
      <main className="app-main">
        <div className="step-container">
          {renderStep()}
        </div>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>Built with ❤️ using MERN Stack</p>
      </footer>
    </div>
  );
}

export default MainLayout;
