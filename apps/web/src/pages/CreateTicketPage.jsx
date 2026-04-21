
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import api from '@/lib/api.js';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { toast } from 'sonner';
import { Loader2, UploadCloud, File as FileIcon, X } from 'lucide-react';
import { format } from 'date-fns';

export default function CreateTicketPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [userDivision, setUserDivision] = useState('Memuat...');
  const [files, setFiles] = useState([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    urgency: ''
  });

  useEffect(() => {
    if (currentUser?.division_id) {
      api.get(`/divisions/${currentUser.division_id}`)
        .then(({ data }) => setUserDivision(data?.name || 'Unknown'))
        .catch(() => setUserDivision('Unknown'));
    } else {
      setUserDivision('-');
    }
  }, [currentUser]);

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  const handleSelectChange = (value) => setFormData(prev => ({ ...prev, urgency: value }));

  const handleFileChange = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (files.length + newFiles.length > 5) {
        toast.error('Maksimal 5 lampiran diperbolehkan');
        return;
      }
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.location || !formData.urgency) {
      toast.error('Mohon lengkapi semua field yang wajib');
      return;
    }

    setIsLoading(true);
    try {
      // Generate ticket number
      const dateStr = format(new Date(), 'yyyyMMdd');
      const randomStr = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const ticketNumber = `TKT-${dateStr}-${randomStr}`;

      // EXPLICITLY set status to 'Pending' as requested for debugging
      const ticketData = {
        ticket_number: ticketNumber,
        title: formData.title,
        description: formData.description,
        location: formData.location,
        urgency: formData.urgency,
        status: 'Pending', // Ensuring this is always 'Pending'
        user_id: currentUser.id
      };

      console.log('DEBUG [CreateTicketPage]: Creating new ticket with payload:', ticketData);

      const { data: ticketRecord } = await api.post('/tickets', ticketData);
      
      console.log('DEBUG [CreateTicketPage]: Ticket successfully created:', ticketRecord);

      // Upload attachments (multipart/form-data) to the uploads endpoint.
      if (files.length > 0) {
        const formData = new FormData();
        files.forEach((file) => {
          formData.append('files', file);
        });

        await api.post(`/uploads/ticket/${ticketRecord.id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      toast.success('Tiket berhasil dibuat dan berstatus Pending');
      navigate('/user/tickets');
    } catch (error) {
      console.error('DEBUG [CreateTicketPage] Error creating ticket:', error);
      const backendMessage = error.response?.data?.message;
      toast.error('Gagal membuat tiket: ' + (backendMessage || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Buat Tiket Baru</h1>
        <p className="text-sm text-muted-foreground mt-1">Laporkan masalah IT Anda</p>
      </div>

      <Card className="border-border shadow-sm">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="text-base">Detail Laporan</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-muted/40 rounded-xl border border-border">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Pelapor</Label>
                <div className="font-medium text-sm">{currentUser?.name}</div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Divisi</Label>
                <div className="font-medium text-sm">{userDivision}</div>
              </div>
              <div className="space-y-1 sm:col-span-2 md:col-span-1">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">No. Telepon</Label>
                <div className="font-medium text-sm">{currentUser?.phone || '-'}</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Judul Kendala <span className="text-destructive">*</span></Label>
                <Input 
                  id="title" 
                  placeholder="Contoh: Jaringan WiFi di lantai 2 terputus" 
                  value={formData.title}
                  onChange={handleChange}
                  className="text-foreground"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi Detail <span className="text-destructive">*</span></Label>
                <Textarea 
                  id="description" 
                  placeholder="Jelaskan secara detail kendala yang dialami..." 
                  className="min-h-[120px] resize-y text-foreground"
                  value={formData.description}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Lokasi <span className="text-destructive">*</span></Label>
                  <Input 
                    id="location" 
                    placeholder="Contoh: Ruang Meeting A" 
                    value={formData.location}
                    onChange={handleChange}
                    className="text-foreground"
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="urgency">Urgensi <span className="text-destructive">*</span></Label>
                  <Select onValueChange={handleSelectChange} disabled={isLoading}>
                    <SelectTrigger className="text-foreground">
                      <SelectValue placeholder="Pilih tingkat urgensi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Rendah">Rendah (Dapat ditunda)</SelectItem>
                      <SelectItem value="Sedang">Sedang (Mengganggu sebagian kerja)</SelectItem>
                      <SelectItem value="Tinggi">Tinggi (Sangat mengganggu)</SelectItem>
                      <SelectItem value="Darurat">Darurat (Sistem lumpuh total)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Label>Lampiran (Opsional)</Label>
                <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:bg-muted/50 transition-colors">
                  <Input 
                    type="file" 
                    id="files" 
                    multiple 
                    className="hidden" 
                    onChange={handleFileChange}
                    disabled={isLoading || files.length >= 5}
                  />
                  <Label htmlFor="files" className="cursor-pointer flex flex-col items-center gap-2">
                    <div className="p-3 bg-primary/10 text-primary rounded-full">
                      <UploadCloud className="h-6 w-6" />
                    </div>
                    <span className="font-medium text-sm text-foreground">Klik untuk unggah file</span>
                    <span className="text-xs text-muted-foreground">Maksimal 5 file (Gambar, Dokumen)</span>
                  </Label>
                </div>

                {files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg border border-border">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <FileIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm font-medium truncate">{f.name}</span>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {(f.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeFile(i)}
                          disabled={isLoading}
                          className="text-muted-foreground hover:text-destructive flex-shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </CardContent>
          <CardFooter className="border-t pt-6 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={isLoading}>
              Batal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isLoading ? 'Menyimpan...' : 'Kirim Tiket'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
