import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { EmergencyProvider } from "@/contexts/EmergencyContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import DescopeAuth from "@/components/DescopeAuth";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [apiTokens, setApiTokens] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

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

  // If not authenticated, show Descope login
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
        <EmergencyProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </EmergencyProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
