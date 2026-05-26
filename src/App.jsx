import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';

/**
 * App Component
 * Main application wrapper with routing
 */
function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
