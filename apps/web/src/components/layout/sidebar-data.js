// Sidebar configuration data for all roles
import {
  LayoutDashboard,
  Ticket,
  PlusCircle,
  MessageSquare,
  Settings,
  ListOrdered,
  History,
  Users,
  UserCog,
  ActivitySquare,
  LogOut,
} from 'lucide-react';

// Menu untuk role: USER
export const userSidebarData = {
  navGroups: [
    {
      title: 'Menu Utama',
      items: [
        { title: 'Dashboard', url: '/user/dashboard', icon: LayoutDashboard },
        { title: 'Tiket Saya', url: '/user/tickets', icon: Ticket },
        { title: 'Buat Tiket', url: '/user/create-ticket', icon: PlusCircle },
        { title: 'Chat', url: '/user/chats', icon: MessageSquare },
        { title: 'Pengaturan', url: '/user/settings', icon: Settings },
      ],
    },
  ],
};

// Menu untuk role: TECHNICIAN
export const technicianSidebarData = {
  navGroups: [
    {
      title: 'Menu Teknisi',
      items: [
        { title: 'Dashboard', url: '/technician/dashboard', icon: LayoutDashboard },
        { title: 'Antrian Tiket', url: '/technician/queue', icon: ListOrdered },
        { title: 'Tiket Saya', url: '/technician/tickets', icon: Ticket },
        { title: 'Chat', url: '/technician/chats', icon: MessageSquare },
        { title: 'Pengaturan', url: '/technician/settings', icon: Settings },
      ],
    },
  ],
};

// Menu untuk role: ADMIN
export const adminSidebarData = {
  navGroups: [
    {
      title: 'Menu Utama',
      items: [
        { title: 'Dashboard', url: '/admin/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'Manajemen Tiket',
      items: [
        { title: 'Semua Tiket', url: '/admin/tickets', icon: Ticket },
        { title: 'Riwayat Tiket', url: '/admin/ticket-history', icon: History },
      ],
    },
    {
      title: 'Manajemen Pengguna',
      items: [
        { title: 'Kelola User', url: '/admin/users', icon: Users },
        { title: 'Kelola Teknisi', url: '/admin/technicians', icon: UserCog },
      ],
    },
    {
      title: 'Monitoring & Laporan',
      items: [
        { title: 'Monitoring Chat', url: '/admin/chats', icon: MessageSquare },
        { title: 'Log Aktivitas', url: '/admin/activity-logs', icon: ActivitySquare },
      ],
    },
    {
      title: 'Sistem',
      items: [
        { title: 'Pengaturan Sistem', url: '/admin/settings', icon: Settings },
      ],
    },
  ],
};

// Helper function to get sidebar data based on role
export function getSidebarData(role) {
  switch (role) {
    case 'Admin':
      return adminSidebarData;
    case 'Teknisi':
      return technicianSidebarData;
    default:
      return userSidebarData;
  }
}
