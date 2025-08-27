import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { EmergencyProvider } from "@/contexts/EmergencyContext";
import DescopeAuth from "@/components/DescopeAuth";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [apiTokens, setApiTokens] = useState<any>(null);

  // Check for existing session on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('descope_token');
    if (storedToken) {
      // Verify token is still valid
      fetch('/api/auth/verify', {
        headers: { 'Authorization': `Bearer ${storedToken}` }
      })
      .then(res => {
        if (res.ok) {
          setAuthToken(storedToken);
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('descope_token');
        }
      })
      .catch(() => {
        localStorage.removeItem('descope_token');
      });
    }
  }, []);

  const handleAuthentication = (token: string, tokens: any) => {
    setAuthToken(token);
    setApiTokens(tokens);
    setIsAuthenticated(true);
    localStorage.setItem('descope_token', token);
  };

  // If not authenticated, show Descope login
  if (!isAuthenticated) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <DescopeAuth onAuthenticated={handleAuthentication} />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  // Authenticated - show main app
  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  );
};

export default App;
