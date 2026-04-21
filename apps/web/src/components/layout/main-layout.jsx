import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from './app-sidebar';
import { Header } from './header';

export function MainLayout({ children }) {
  return (
    <SidebarProvider defaultOpen>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-col h-full">
          <Header />
          <main className="flex flex-1 flex-col gap-4 p-4 lg:p-6 overflow-auto">
            {children ?? <Outlet />}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
