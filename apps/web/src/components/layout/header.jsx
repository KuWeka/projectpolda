import { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Globe, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useLocation } from 'react-router-dom';

export function Header() {
  const { currentUser, setCurrentUser, logout } = useAuth();
  const { i18n } = useTranslation();
  const { pathname } = useLocation();
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('app_theme');
    const userTheme = currentUser?.theme;
    const initialTheme = saved || userTheme || 'dark';
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');
    if (!saved && !userTheme) {
      localStorage.setItem('app_theme', initialTheme);
    }
    return initialTheme;
  });

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    localStorage.setItem('app_theme', newTheme);

    if (currentUser) {
      const updatedUser = { ...currentUser, theme: newTheme };
      localStorage.setItem('helpdesk_user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
    }
  };

  const changeLanguage = (lang) => {
    const lowerLang = lang.toLowerCase();
    i18n.changeLanguage(lowerLang);
    localStorage.setItem('app_language', lang);
  };

  const breadcrumb = useMemo(() => {
    const segments = pathname.split('/').filter(Boolean);
    const role = segments[0];
    const page = segments[1] || 'dashboard';

    const roleLabel =
      role === 'admin' ? 'Admin' : role === 'technician' ? 'Teknisi' : 'User';

    const mapByRole = {
      user: {
        dashboard: 'Dashboard',
        'create-ticket': 'Buat Tiket',
        tickets: 'Tiket Saya',
        chats: 'Chat',
        settings: 'Pengaturan',
      },
      technician: {
        dashboard: 'Dashboard',
        queue: 'Antrian Tiket',
        tickets: 'Tiket Saya',
        chats: 'Chat',
        settings: 'Pengaturan',
      },
      admin: {
        dashboard: 'Dashboard',
        tickets: 'Semua Tiket',
        'ticket-history': 'Riwayat Tiket',
        users: 'Kelola User',
        technicians: 'Kelola Teknisi',
        chats: 'Monitoring Chat',
        'activity-logs': 'Log Aktivitas',
        settings: 'Pengaturan Sistem',
      },
    };

    const pageLabel = mapByRole[role]?.[page];
    return {
      role: roleLabel,
      page: pageLabel || page.replaceAll('-', ' '),
    };
  }, [pathname]);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-6" />

      <nav
        aria-label="Breadcrumb"
        className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground"
      >
        <span className="font-medium text-foreground">{breadcrumb.role}</span>
        <span aria-hidden="true">/</span>
        <span className="truncate">{breadcrumb.page}</span>
      </nav>

      <div className="flex-1" />
      
      <div className="flex items-center gap-2">
        {currentUser && (
          <div className="hidden sm:flex flex-col items-end mr-2">
            <span className="text-sm font-medium">{currentUser.name || 'User'}</span>
            <span className="text-xs text-muted-foreground">{currentUser.role}</span>
          </div>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Globe className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => changeLanguage('ID')}>
              Indonesia (ID)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => changeLanguage('EN')}>
              English (EN)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8">
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>

        {currentUser && (
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            title="Logout"
            className="h-8 w-8"
          >
            <LogOut className="h-4 w-4 text-destructive" />
          </Button>
        )}
      </div>
    </header>
  );
}
