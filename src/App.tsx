import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { FeatureFlagsProvider } from "@/hooks/useFeatureFlags";
import ProtectedRoute from "@/components/ProtectedRoute";
import MatchCelebration from "@/components/MatchCelebration";
import { useMatchNotification } from "@/hooks/useMatchNotification";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { lazy, Suspense, useEffect } from "react";

// Lazy load all page components for code-splitting
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const UserTypeSelection = lazy(() => import("./pages/UserTypeSelection"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Profile = lazy(() => import("./pages/Profile"));
const NewProduct = lazy(() => import("./pages/NewProduct"));
const EditProduct = lazy(() => import("./pages/EditProduct"));
const MyProducts = lazy(() => import("./pages/MyProducts"));
const MyTruekes = lazy(() => import("./pages/MyTruekes"));
const Messages = lazy(() => import("./pages/Messages"));
const Chat = lazy(() => import("./pages/Chat"));
const Favorites = lazy(() => import("./pages/Favorites"));
const TradeHistory = lazy(() => import("./pages/TradeHistory"));
const FeaturedServices = lazy(() => import("./pages/FeaturedServices"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const Subscription = lazy(() => import("./pages/Subscription"));
const Tournaments = lazy(() => import("./pages/Tournaments"));
const Achievements = lazy(() => import("./pages/Achievements"));
const Missions = lazy(() => import("./pages/Missions"));
const Terms = lazy(() => import("./pages/Terms"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

// Initialize theme from localStorage - default to dark
const initializeTheme = () => {
  const theme = localStorage.getItem("theme");
  // Default to dark theme if no preference is set
  if (!theme) {
    localStorage.setItem("theme", "dark");
    document.documentElement.classList.add("dark");
  } else if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else if (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    document.documentElement.classList.add("dark");
  }
};

// Wrapper component that uses the match notification hook
const AppContent = () => {
  const { newMatch, clearMatch } = useMatchNotification();
  usePushNotifications(); // Enable push notifications

  useEffect(() => {
    initializeTheme();
  }, []);

  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/welcome" element={<UserTypeSelection />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/new-product"
            element={
              <ProtectedRoute>
                <NewProduct />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit-product/:id"
            element={
              <ProtectedRoute>
                <EditProduct />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-products"
            element={
              <ProtectedRoute>
                <MyProducts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-truekes"
            element={
              <ProtectedRoute>
                <MyTruekes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat/:matchId"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/favorites"
            element={
              <ProtectedRoute>
                <Favorites />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trade-history"
            element={
              <ProtectedRoute>
                <TradeHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/featured-services"
            element={
              <ProtectedRoute>
                <FeaturedServices />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPanel />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subscription"
            element={
              <ProtectedRoute>
                <Subscription />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tournaments"
            element={
              <ProtectedRoute>
                <Tournaments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/achievements"
            element={
              <ProtectedRoute>
                <Achievements />
              </ProtectedRoute>
            }
          />
          <Route
            path="/missions"
            element={
              <ProtectedRoute>
                <Missions />
              </ProtectedRoute>
            }
          />
          <Route path="/terms" element={<Terms />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <MatchCelebration match={newMatch} onClose={clearMatch} />
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <FeatureFlagsProvider>
            <AppContent />
          </FeatureFlagsProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
