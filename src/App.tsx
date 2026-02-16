import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import VehiclesPage from "./pages/VehiclesPage";
import VehicleDetailPage from "./pages/VehicleDetailPage";
import VehiclePurchasePage from "./pages/VehiclePurchasePage";
import ImpressumPage from "./pages/ImpressumPage";
import DatenschutzPage from "./pages/DatenschutzPage";
import HaftungsausschlussPage from "./pages/HaftungsausschlussPage";
import FinanzierungPage from "./pages/FinanzierungPage";
import GarantiePage from "./pages/GarantiePage";
import ZulassungPage from "./pages/ZulassungPage";
import DekraTuvPage from "./pages/DekraTuvPage";
import OelwechselPage from "./pages/OelwechselPage";
import UnternehmenPage from "./pages/UnternehmenPage";
import NotFound from "./pages/NotFound";
import ScrollToTop from "./components/ScrollToTop";
import CookieBanner from "./components/CookieBanner";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: 1000,
      staleTime: 30 * 60 * 1000, // 30 minutes
      gcTime: 60 * 60 * 1000, // 1 hour
      throwOnError: false, // Don't throw errors, return them instead
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <div className="min-w-0 w-full max-w-[100vw] overflow-x-hidden">
  <ErrorBoundary>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <CookieBanner />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/fahrzeuge" element={<VehiclesPage />} />
              <Route path="/fahrzeuge/:slug" element={<VehicleDetailPage />} />
              <Route path="/fahrzeugankauf" element={<VehiclePurchasePage />} />
              <Route path="/impressum" element={<ImpressumPage />} />
              <Route path="/datenschutz" element={<DatenschutzPage />} />
              <Route path="/haftungsausschluss" element={<HaftungsausschlussPage />} />
              <Route path="/finanzierung" element={<FinanzierungPage />} />
              <Route path="/garantie" element={<GarantiePage />} />
              <Route path="/zulassung" element={<ZulassungPage />} />
              <Route path="/dekra-tuev" element={<DekraTuvPage />} />
              <Route path="/oelwechsel" element={<OelwechselPage />} />
              <Route path="/unternehmen" element={<UnternehmenPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          <Analytics />
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
  </div>
);

export default App;
