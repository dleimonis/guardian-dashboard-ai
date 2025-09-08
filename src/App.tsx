import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
  const [isLoading, setIsLoading] = useState(true);

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
              setShowLanding(false);
            } else {
              localStorage.removeItem('auth_token');
            }
          })
          .catch(() => {
            localStorage.removeItem('auth_token');
          })
          .finally(() => {
            setIsLoading(false);
          });
      });
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleAuthentication = (data: { token: string; services: Record<string, string>; user: any }) => {
    setAuthToken(data.token);
    setApiTokens(data.services);
    setUser(data.user);
    setIsAuthenticated(true);
    setShowLanding(false);
    localStorage.setItem('auth_token', data.token);
  };

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider>
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading...</p>
              </div>
            </div>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );
  }

  // Main app with router always available
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              {showLanding && !isAuthenticated && (
                <Route path="/" element={<LandingPage onGetStarted={() => setShowLanding(false)} />} />
              )}
              
              {/* Auth route */}
              {!isAuthenticated && !showLanding && (
                <Route path="*" element={<DescopeAuth onAuthenticated={handleAuthentication} />} />
              )}
              
              {/* Protected routes */}
              {isAuthenticated && (
                <>
                  <Route path="/" element={
                    <UserProvider>
                      <EmergencyProvider>
                        <Layout>
                          <Index />
                        </Layout>
                      </EmergencyProvider>
                    </UserProvider>
                  } />
                  <Route path="/profile" element={
                    <UserProvider>
                      <EmergencyProvider>
                        <Layout>
                          <UserProfile />
                        </Layout>
                      </EmergencyProvider>
                    </UserProvider>
                  } />
                  <Route path="/admin" element={
                    <UserProvider>
                      <EmergencyProvider>
                        <Layout>
                          <AdminDashboard />
                        </Layout>
                      </EmergencyProvider>
                    </UserProvider>
                  } />
                  <Route path="*" element={
                    <UserProvider>
                      <EmergencyProvider>
                        <Layout>
                          <NotFound />
                        </Layout>
                      </EmergencyProvider>
                    </UserProvider>
                  } />
                </>
              )}
              
              {/* Fallback for any unmatched routes */}
              {!isAuthenticated && !showLanding && (
                <Route path="*" element={<Navigate to="/" replace />} />
              )}
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
