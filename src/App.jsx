import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './pages/PageNotFound';
import Landing from './pages/Landing';
import Quiz from './pages/Quiz';
import Results from './pages/Results';
import Report from './pages/Report';
import Privacy from './pages/Privacy';
import AdminDashboard from './pages/AdminDashboard';

const ENABLE_ADMIN = import.meta.env.VITE_ENABLE_ADMIN === "true";

function App() {

  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/results" element={<Results />} />
          <Route path="/report/:profileId" element={<Report />} />
          <Route path="/privacy" element={<Privacy />} />
          {ENABLE_ADMIN ? (
            <Route path="/admin" element={<AdminDashboard />} />
          ) : (
            <Route path="/admin" element={<PageNotFound />} />
          )}
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </Router>
      <Toaster />
    </QueryClientProvider>
  )
}

export default App