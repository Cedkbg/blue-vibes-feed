import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopSidebar } from "@/components/DesktopSidebar";
import { BottomNav } from "@/components/BottomNav";
import { TopBar } from "@/components/TopBar";
import { DiscoverSidebar } from "@/components/DiscoverSidebar";
import { StoriesCarousel } from "@/components/StoriesCarousel";
import { NotificationsSheet } from "@/components/NotificationsSheet";

interface DesktopLayoutProps {
  children: React.ReactNode;
  showRightSidebar?: boolean;
  showStories?: boolean;
  showTopBar?: boolean;
  title?: string;
}

export const DesktopLayout = ({ children, showRightSidebar = true, showStories = false, showTopBar = true, title }: DesktopLayoutProps) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className={`min-h-screen bg-background pb-20 ${showTopBar ? 'pt-16' : ''}`}>
        {showTopBar && <TopBar title={title} />}
        {showStories && (
          <div className="pt-2">
            <StoriesCarousel />
          </div>
        )}
        {children}
        <BottomNav />
      </div>
    );
  }

  // Tablet & Desktop
  return (
    <div className="min-h-screen bg-background">
      <DesktopSidebar />

      {/* Main content area */}
      <div className="ml-[240px] flex">
        {/* Center feed */}
        <main className={`flex-1 ${showRightSidebar ? 'max-w-2xl' : 'max-w-4xl'} mx-auto min-h-screen`}>
          {/* Desktop stories */}
          {showStories && (
            <div className="border-b border-border py-3 px-4">
              <StoriesCarousel />
            </div>
          )}
          {children}
        </main>

        {/* Right sidebar - Discover */}
        {showRightSidebar && (
          <aside className="hidden xl:block w-[320px] border-l border-border sticky top-0 h-screen overflow-y-auto">
            <DiscoverSidebar onNavigate={() => {}} />
          </aside>
        )}
      </div>
    </div>
  );
};
