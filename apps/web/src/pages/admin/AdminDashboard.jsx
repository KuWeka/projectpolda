
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext.jsx';
import api from '@/lib/api.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart.jsx';
import { Ticket, Users, CheckCircle2, Clock, PlayCircle, BarChart3 } from 'lucide-react';
import UrgencyBadge from '@/components/UrgencyBadge.jsx';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const chartConfig = {
  total: {
    label: 'Jumlah Tiket',
    color: 'hsl(var(--primary))',
  },
};

const safeFormatDate = (value, pattern = 'dd MMM HH:mm') => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return format(date, pattern);
};

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  
  const [stats, setStats] = useState({
    total: 0, pending: 0, proses: 0, selesai: 0,
    activeTechs: 0, totalUsers: 0
  });

  const [tables, setTables] = useState({
    pending: [], proses: [], selesai: []
  });
  
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/dashboard/admin-summary');
      const payload = data?.data || {};

      setStats(payload.stats || {
        total: 0,
        pending: 0,
        proses: 0,
        selesai: 0,
        activeTechs: 0,
        totalUsers: 0
      });

      setTables(payload.tables || {
        pending: [],
        proses: [],
        selesai: []
      });

      setChartData(payload.chartData || []);

    } catch (err) {
      console.error('Error fetching admin dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderTableCard = (title, items, isProsesOrSelesai) => (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className={`${items.length > 0 ? 'max-h-[280px] overflow-y-auto' : ''}`}>
          <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="px-4">ID & Judul</TableHead>
              <TableHead>Urgensi</TableHead>
              <TableHead>{t('tickets.reporter', 'Pelapor')}</TableHead>
              {isProsesOrSelesai && <TableHead>{t('roles.technician', 'Teknisi')}</TableHead>}
              <TableHead>Tanggal</TableHead>
              <TableHead className="text-right px-4">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="px-4"><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  {isProsesOrSelesai && <TableCell><Skeleton className="h-5 w-24" /></TableCell>}
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell className="text-right px-4"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : items.length > 0 ? (
              items.map(tk => (
                <TableRow key={tk.id} className="hover:bg-muted/30">
                  <TableCell className="px-4">
                    <div className="font-medium text-foreground truncate max-w-[150px]">{tk.title}</div>
                    <div className="text-xs text-muted-foreground font-mono">{tk.ticket_number}</div>
                  </TableCell>
                  <TableCell><UrgencyBadge urgency={tk.urgency} /></TableCell>
                  <TableCell className="text-sm truncate max-w-[120px]">{tk.reporter_name || '-'}</TableCell>
                  {isProsesOrSelesai && (
                    <TableCell className="text-sm truncate max-w-[120px]">{tk.technician_name || '-'}</TableCell>
                  )}
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {safeFormatDate(tk.created_at || tk.created)}
                  </TableCell>
                  <TableCell className="text-right px-4">
                    <Button variant="secondary" size="sm" asChild>
                      <Link to={`/admin/tickets/${tk.id}`}>Detail</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={isProsesOrSelesai ? 6 : 5} className="py-8 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <svg className="w-10 h-10 mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-sm">{t('tickets.no_tickets', 'Tidak ada tiket')}</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('dashboard.admin_title', 'Dashboard Admin')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('dashboard.hello', 'Halo')}, <span className="font-semibold text-foreground">{currentUser?.name}</span></p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
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
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[
            { title: 'Total Tiket', value: stats.total, icon: Ticket, note: 'Semua tiket terdaftar' },
            { title: t('status.pending', 'Pending'), value: stats.pending, icon: Clock, note: 'Menunggu penanganan' },
            { title: t('status.proses', 'Proses'), value: stats.proses, icon: PlayCircle, note: 'Sedang dikerjakan' },
            { title: t('status.selesai', 'Selesai'), value: stats.selesai, icon: CheckCircle2, note: 'Telah diselesaikan' },
            { title: t('admin.active_techs', 'Teknisi Aktif'), value: stats.activeTechs, icon: Users, note: 'Teknisi sedang bertugas' },
            { title: 'Pengguna', value: stats.totalUsers, icon: Users, note: 'Total user terdaftar' }
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

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {renderTableCard(`Tiket ${t('status.pending', 'Pending')} Terbaru`, tables.pending, false)}
          {renderTableCard(`Tiket Sedang ${t('status.proses', 'Proses')}`, tables.proses, true)}
          {renderTableCard(`Tiket Baru ${t('status.selesai', 'Selesai')}`, tables.selesai, true)}
        </div>
        
        <div className="space-y-6">
          
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Top 5 Teknisi Bulan Ini
              </CardTitle>
              <CardDescription>Jumlah tiket selesai per teknisi pada bulan berjalan.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[280px] w-full" />
              ) : chartData.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[280px] w-full">
                  <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} allowDecimals={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="total" fill="var(--color-total)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
                  Belum ada data tiket selesai bulan ini.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
