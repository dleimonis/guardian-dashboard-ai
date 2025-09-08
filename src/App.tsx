import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { EmergencyProvider } from "@/contexts/EmergencyContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { UserProvider } from "@/contexts/UserContext";
import DescopeAuth from "@/components/DescopeAuth";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import UserProfile from "./components/UserProfile";
import AdminDashboard from "./components/AdminDashboard";
import Layout from "./components/Layout";
import LandingPage from "./pages/LandingPage";

const queryClient = new QueryClient();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [apiTokens, setApiTokens] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [showLanding, setShowLanding] = useState(true);

  // Register service worker for notifications
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker registered:', registration);
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      // Verify token is still valid using the API service
      import('./services/api').then(({ apiService }) => {
        apiService.verifyToken(storedToken)
          .then(response => {
            if (response.success) {
              setAuthToken(storedToken);
              setIsAuthenticated(true);
            } else {
              localStorage.removeItem('auth_token');
            }
          })
          .catch(() => {
            localStorage.removeItem('auth_token');
          });
      });
    }
  }, []);

  const handleAuthentication = (data: { token: string; services: Record<string, string>; user: any }) => {
    setAuthToken(data.token);
    setApiTokens(data.services);
    setUser(data.user);
    setIsAuthenticated(true);
    localStorage.setItem('auth_token', data.token);
  };

  // Show landing page first
  if (showLanding && !isAuthenticated) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <LandingPage onGetStarted={() => setShowLanding(false)} />
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );
  }

  // If not authenticated and past landing, show Descope login
  if (!isAuthenticated) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <DescopeAuth onAuthenticated={handleAuthentication} />
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );
  }

  // Authenticated - show main app
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <UserProvider>
          <EmergencyProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/profile" element={<UserProfile />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Layout>
              </BrowserRouter>
            </TooltipProvider>
          </EmergencyProvider>
        </UserProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
