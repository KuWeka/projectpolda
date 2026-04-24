import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import { getSidebarData } from './sidebar-data';
import { NavGroup } from './nav-group';
import { NavUser } from './nav-user';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';

export function AppSidebar() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const role = currentUser?.role || 'User';
  const sidebarData = getSidebarData(role);
  const translatedSidebarData = {
    ...sidebarData,
    navGroups: (sidebarData.navGroups || []).map((group) => ({
      ...group,
      title: t(`nav.group.${group.title}`, group.title),
      items: (group.items || []).map((item) => ({
        ...item,
        title: t(`nav.item.${item.title}`, item.title),
      })),
    })),
  };

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-3">
          <img
            src="/images/logo_bidtik.png"
            alt="Logo BIDTIK"
            className="size-8 rounded-lg object-cover"
          />
          <span className="font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            IT Helpdesk
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {translatedSidebarData.navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={currentUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
