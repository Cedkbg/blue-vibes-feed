import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Settings from "./pages/Settings";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import Messages from "./pages/Messages";
import Chat from "./pages/Chat";
import Video from "./pages/Video";
import Auth from "./pages/Auth";
import CreatePost from "./pages/CreatePost";
import Interests from "./pages/Interests";
import Search from "./pages/Search";
import News from "./pages/News";
import Friends from "./pages/Friends";
import LiveStream from "./pages/LiveStream";
import Discover from "./pages/Discover";
import Pubb from "./pages/Pubb";
import VideoCall from "./pages/VideoCall";
import Calls from "./pages/Calls";
import GroupCall from "./pages/GroupCall";
import GroupDetails from "./pages/GroupDetails";
import CommunityDetails from "./pages/CommunityDetails";
import ChannelDetails from "./pages/ChannelDetails";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";

import Creneau from "./pages/Creneau";
import Trending from "./pages/Trending";
import PostDetail from "./pages/PostDetail";
import UserProfile from "./pages/UserProfile";
import Certified from "./pages/Certified";
import StudentMode from "./pages/StudentMode";
import BusinessMode from "./pages/BusinessMode";
import { IncomingCallModal } from "@/components/IncomingCallModal";
import { useIncomingCall } from "@/hooks/useIncomingCall";


const queryClient = new QueryClient();

const AppContent = () => {
  const { incomingCall, acceptCall, declineCall } = useIncomingCall();

  return (
    <>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/profile/:userId" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
        <Route path="/chat/:recipientId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/video" element={<ProtectedRoute><Video /></ProtectedRoute>} />
        <Route path="/create-post" element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />
        <Route path="/interests" element={<ProtectedRoute><Interests /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
        <Route path="/news" element={<ProtectedRoute><News /></ProtectedRoute>} />
        <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
        <Route path="/live/:streamId?" element={<ProtectedRoute><LiveStream /></ProtectedRoute>} />
        <Route path="/discover" element={<ProtectedRoute><Discover /></ProtectedRoute>} />
        <Route path="/pubb" element={<ProtectedRoute><Pubb /></ProtectedRoute>} />
        <Route path="/call/:contactId" element={<ProtectedRoute><VideoCall /></ProtectedRoute>} />
        <Route path="/calls" element={<ProtectedRoute><Calls /></ProtectedRoute>} />
        <Route path="/group-call/:groupId" element={<ProtectedRoute><GroupCall /></ProtectedRoute>} />
        <Route path="/group/:groupId" element={<ProtectedRoute><GroupDetails /></ProtectedRoute>} />
        <Route path="/community/:communityId" element={<ProtectedRoute><CommunityDetails /></ProtectedRoute>} />
        <Route path="/channel/:channelId" element={<ProtectedRoute><ChannelDetails /></ProtectedRoute>} />
        
        <Route path="/creneau" element={<ProtectedRoute><Creneau /></ProtectedRoute>} />
        <Route path="/trending" element={<ProtectedRoute><Trending /></ProtectedRoute>} />
        <Route path="/certified" element={<ProtectedRoute><Certified /></ProtectedRoute>} />
        <Route path="/student" element={<ProtectedRoute><StudentMode /></ProtectedRoute>} />
        <Route path="/business" element={<ProtectedRoute><BusinessMode /></ProtectedRoute>} />
        {/* Public shareable routes – no auth required */}
        <Route path="/p/:postId" element={<PostDetail />} />
        <Route path="/u/:username" element={<UserProfile />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      
      {incomingCall && (
        <IncomingCallModal
          isOpen={true}
          callerName={incomingCall.callerName}
          callerAvatar={incomingCall.callerAvatar}
          callType={incomingCall.callType}
          onAccept={acceptCall}
          onDecline={declineCall}
        />
      )}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
