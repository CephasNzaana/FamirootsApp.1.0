
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import Home from "./pages/Home";
import FamilyTrees from "./pages/FamilyTrees";
import RelationshipAnalyzer from "./pages/RelationshipAnalyzer";
import Tribes from "./pages/Tribes";
import ClanDetails from "./pages/ClanDetails";
import Elders from "./pages/Elders";
import NotFound from "./pages/NotFound";
import DNATest from "./pages/DNATest";
import ProfilePage from "./pages/ProfilePage";
import UserProfilePage from "./pages/UserProfilePage";
import Traditions from "./pages/Traditions";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/family-trees" element={<FamilyTrees />} />
            <Route path="/relationship-analyzer" element={<RelationshipAnalyzer />} />
            <Route path="/tribes" element={<Tribes />} />
            <Route path="/clans/:tribeId/:clanId" element={<ClanDetails />} />
            <Route path="/elders" element={<Elders />} />
            <Route path="/dna-test" element={<DNATest />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/user-profile" element={<UserProfilePage />} />
            <Route path="/traditions" element={<Traditions />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
