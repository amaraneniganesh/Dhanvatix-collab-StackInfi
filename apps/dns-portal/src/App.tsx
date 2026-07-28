import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import DNSApp from './components/DNSApp';

// Component to handle token redirect
function LandingOrRedirect() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  // If there's a bridge token, redirect to the app with the token
  if (token) {
    const domainId = searchParams.get('domainId');
    const redirectUrl = domainId ? `/app?token=${token}&domainId=${domainId}` : `/app?token=${token}`;
    return <Navigate to={redirectUrl} replace />;
  }
  
  return <LandingPage />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingOrRedirect />} />
        <Route path="/app" element={<DNSApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
