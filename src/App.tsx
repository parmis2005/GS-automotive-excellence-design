import { lazy, Suspense } from "react";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import ScrollToTop from "./components/ScrollToTop";
import CookieBanner from "./components/CookieBanner";

const VehiclesPage = lazy(() => import("./pages/VehiclesPage"));
const VehicleDetailPage = lazy(() => import("./pages/VehicleDetailPage"));
const VehiclePurchasePage = lazy(() => import("./pages/VehiclePurchasePage"));
const ImpressumPage = lazy(() => import("./pages/ImpressumPage"));
const DatenschutzPage = lazy(() => import("./pages/DatenschutzPage"));
const HaftungsausschlussPage = lazy(() => import("./pages/HaftungsausschlussPage"));
const FinanzierungPage = lazy(() => import("./pages/FinanzierungPage"));
const GarantiePage = lazy(() => import("./pages/GarantiePage"));
const ZulassungPage = lazy(() => import("./pages/ZulassungPage"));
const DekraTuvPage = lazy(() => import("./pages/DekraTuvPage"));
const OelwechselPage = lazy(() => import("./pages/OelwechselPage"));
const UnternehmenPage = lazy(() => import("./pages/UnternehmenPage"));
const KontaktPage = lazy(() => import("./pages/KontaktPage"));
const KontaktErfolgreichPage = lazy(() => import("./pages/KontaktErfolgreichPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

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
            <Suspense fallback={<div className="min-h-[60vh]" aria-hidden />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/fahrzeuge" element={<VehiclesPage />} />
              {/* SEO-Landingpages (statische Einstiegsseiten) */}
              <Route path="/fahrzeuge/marke/:marke" element={<VehiclesPage />} />
              <Route path="/fahrzeuge/typ/:typ" element={<VehiclesPage />} />
              <Route path="/fahrzeuge/marke/:marke/:modell" element={<VehiclesPage />} />
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
              <Route path="/kontakt" element={<KontaktPage />} />
              <Route path="/kontakt-erfolgreich" element={<KontaktErfolgreichPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
          </BrowserRouter>
          <Analytics />
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
  </div>
);

export default App;
