import React, { Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './pages/PageNotFound';

const Landing = React.lazy(() => import('./pages/Landing'));
const Quiz = React.lazy(() => import('./pages/Quiz'));
const Results = React.lazy(() => import('./pages/Results'));
const Report = React.lazy(() => import('./pages/Report'));
const Privacy = React.lazy(() => import('./pages/Privacy'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));

const ENABLE_ADMIN = import.meta.env.VITE_ENABLE_ADMIN === "true";

// A simple loading fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
  </div>
);

function App() {

  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Suspense fallback={<PageLoader />}>
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
        </Suspense>
      </Router>
      <Toaster />
    </QueryClientProvider>
  )
}

export default App