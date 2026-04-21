
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext.jsx';
import api from '@/lib/api.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { Switch } from '@/components/ui/switch.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog.jsx';
import { ListOrdered, CheckCircle2, Calendar, Hand, ArrowRight, Activity } from 'lucide-react';
import UrgencyBadge from '@/components/UrgencyBadge.jsx';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { TICKET_STATUS } from '@/lib/constants.js';

const safeFormatDate = (value, pattern = 'dd MMM HH:mm') => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return format(date, pattern);
};

export default function TechnicianDashboard() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [techSettings, setTechSettings] = useState(null);
  const [stats, setStats] = useState({ pending: 0, myProses: 0, completedToday: 0, totalThisMonth: 0 });
  const [pendingTickets, setPendingTickets] = useState([]);
  const [myTickets, setMyTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isTaking, setIsTaking] = useState(false);

  useEffect(() => {
    if (currentUser && currentUser.id) {
      fetchDashboardData();
    }
  }, [currentUser]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/dashboard/technician-summary');
      const payload = data?.data || {};

      setTechSettings(payload.techSettings || {
        id: currentUser.id,
        is_active: currentUser.is_active
      });

      setStats(payload.stats || {
        pending: 0,
        myProses: 0,
        completedToday: 0,
        totalThisMonth: 0
      });

      setPendingTickets(payload.pendingTickets || []);
      setMyTickets(payload.myTickets || []);

    } catch (error) {
      console.error('Dashboard error:', error);
      toast.error('Gagal memuat data dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (checked) => {
    if (!techSettings || isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    setTechSettings(prev => ({ ...prev, is_active: checked }));
    
    try {
      // Update via technicians endpoint
      await api.patch(`/technicians/${currentUser.id}`, {
        is_active: checked,
        tech_is_active: checked
      });
      
      toast.success('Status berhasil diubah');
    } catch (error) {
      console.error('Error updating status:', error);
      setTechSettings(prev => ({ ...prev, is_active: !checked }));
      toast.error('Gagal merubah status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleTakeTicket = async () => {
    if (!selectedTicket) return;
    setIsTaking(true);
    try {
      await api.patch(`/tickets/${selectedTicket.id}`, {
        assigned_technician_id: currentUser.id,
        status: TICKET_STATUS.PROSES
      });
      
      toast.success('Tiket berhasil diambil');
      const targetId = selectedTicket.id;
      setSelectedTicket(null);
      
      setTimeout(() => {
        navigate(`/technician/tickets/${targetId}`);
      }, 500);
      
    } catch (error) {
      toast.error('Gagal mengambil tiket');
      setSelectedTicket(null);
      fetchDashboardData();
    } finally {
      setIsTaking(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-2xl border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('dashboard.tech_title', 'Dashboard Teknisi')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('dashboard.hello', 'Halo')}, <span className="font-semibold text-foreground">{currentUser?.name}</span></p>
        </div>
        
        <div className="flex items-center gap-4 bg-background p-3 rounded-xl border">
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium text-foreground">Status Bekerja</span>
            {techSettings?.is_active ? (
              <Badge className="bg-green-500 hover:bg-green-600">Aktif</Badge>
            ) : (
              <Badge variant="secondary">Tidak Bertugas</Badge>
            )}
          </div>
          <Switch 
            checked={techSettings?.is_active || false} 
            onCheckedChange={handleToggleStatus}
            disabled={isUpdatingStatus || !techSettings}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[
            { title: `Semua ${t('status.pending', 'Pending')}`, value: stats.pending, icon: ListOrdered, note: 'Antrian tiket menunggu' },
            { title: `Tiket ${t('status.proses', 'Proses')} Saya`, value: stats.myProses, icon: Activity, note: 'Sedang ditangani saat ini' },
            { title: `${t('status.selesai', 'Selesai')} Hari Ini`, value: stats.completedToday, icon: CheckCircle2, note: 'Kinerja harian teknisi' },
            { title: 'Total Bulan Ini', value: stats.totalThisMonth, icon: Calendar, note: 'Akumulasi tiket bulanan' },
          ].map((item) => (
            <Card key={item.title} className="border-border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{item.title}</CardTitle>
                <item.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{item.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{item.note}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="border-border shadow-sm flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-xl">{t('tickets.queue', 'Antrian Tiket')}</CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary/80">
              <Link to="/technician/queue">Lihat Semua <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="px-4">Judul & ID</TableHead>
                    <TableHead>Urgensi</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead className="text-right px-4">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array(3).fill(0).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell className="px-4"><Skeleton className="h-10 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell className="text-right px-4"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : pendingTickets.length > 0 ? (
                    pendingTickets.map((ticket) => (
                      <TableRow key={ticket.id} className="hover:bg-muted/30">
                        <TableCell className="px-4 py-3">
                          <div className="font-medium text-foreground truncate max-w-[180px]" title={ticket.title}>{ticket.title}</div>
                          <div className="text-xs text-muted-foreground font-mono mt-0.5">{ticket.ticket_number}</div>
                        </TableCell>
                        <TableCell><UrgencyBadge urgency={ticket.urgency} /></TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {safeFormatDate(ticket.created_at || ticket.created)}
                        </TableCell>
                        <TableCell className="text-right px-4">
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setSelectedTicket(ticket)}>
                            <Hand className="mr-1.5 h-3.5 w-3.5" /> Ambil
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                        {t('tickets.no_tickets', 'Tidak ada tiket')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-xl">Tiket Proses Milik Saya</CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary/80">
              <Link to="/technician/tickets">Lihat Semua <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="px-4">Judul & ID</TableHead>
                    <TableHead>{t('tickets.reporter', 'Pelapor')}</TableHead>
                    <TableHead className="text-right px-4">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array(3).fill(0).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell className="px-4"><Skeleton className="h-10 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell className="text-right px-4"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : myTickets.length > 0 ? (
                    myTickets.map((ticket) => (
                      <TableRow key={ticket.id} className="hover:bg-muted/30">
                        <TableCell className="px-4 py-3">
                          <div className="font-medium text-foreground truncate max-w-[180px]" title={ticket.title}>{ticket.title}</div>
                          <div className="text-xs text-muted-foreground font-mono mt-0.5">{ticket.ticket_number}</div>
                        </TableCell>
                        <TableCell className="text-sm truncate max-w-[120px]">
                          {ticket.reporter_name || ticket.user_id || t('tickets.unknown_user', 'Pengguna tidak diketahui')}
                        </TableCell>
                        <TableCell className="text-right px-4">
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/technician/tickets/${ticket.id}`}>Detail</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
                        {t('tickets.no_tickets', 'Tidak ada tiket')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Ambil Tiket</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin mengambil dan memproses tiket ini?
            </DialogDescription>
          </DialogHeader>
          {selectedTicket && (
            <div className="bg-muted/30 p-4 rounded-xl border space-y-2 mt-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-semibold">{selectedTicket.ticket_number}</span>
                <UrgencyBadge urgency={selectedTicket.urgency} />
              </div>
              <p className="font-medium text-foreground">{selectedTicket.title}</p>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button variant="outline" onClick={() => setSelectedTicket(null)} disabled={isTaking}>
              {t('buttons.cancel', 'Batal')}
            </Button>
            <Button onClick={handleTakeTicket} disabled={isTaking} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isTaking ? 'Memproses...' : 'Ya, Ambil Tiket'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
