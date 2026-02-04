import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { AtendePsiShell } from "@/components/atendepsi-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MessageCircle, CheckCircle2, AlertCircle, Loader2, QrCode, Smartphone } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ConnectionsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const [whatsappStatus, setWhatsappStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [calendarStatus, setCalendarStatus] = useState<'connected' | 'disconnected'>('disconnected');

  const [whatsappToken, setWhatsappToken] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);

  useEffect(() => {
    fetchConnections();
  }, [user]);

  useEffect(() => {
    if (whatsappToken) {
      checkWhatsappStatus();
      // Poll status every 10 seconds if disconnected? Or just check once?
      // For now, let's just check once on load.
    }
  }, [whatsappToken]);

  const fetchConnections = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('whatsapp_status, calendar_status, whatsapp_token, ai_phone')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setWhatsappStatus(data.whatsapp_status as any || 'disconnected');
        setCalendarStatus(data.calendar_status as any || 'disconnected');
        setWhatsappToken(data.whatsapp_token);
        setPhone(data.ai_phone);
      }
    } catch (error) {
      console.error("Error fetching connections:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkWhatsappStatus = async () => {
    if (!whatsappToken) return;
    try {
      const res = await fetch(`/api/integrations/whatsapp/status?token=${whatsappToken}`);
      const data = await res.json();

      if (data && data.instance) {
        if (data.instance.status === 'connected') {
          setWhatsappStatus('connected');
          // Update Supabase if needed to keep in sync
          await supabase.from('profiles').update({ whatsapp_status: 'connected' }).eq('id', user!.id);
        } else {
          setWhatsappStatus('disconnected');
          await supabase.from('profiles').update({ whatsapp_status: 'disconnected' }).eq('id', user!.id);
        }
      }
    } catch (error) {
      console.error("Error checking WhatsApp status:", error);
    }
  };

  const handleConnectWhatsapp = async () => {
    if (!whatsappToken) {
      toast({ title: "Erro de configuração", description: "Token do WhatsApp não encontrado.", variant: "destructive" });
      return;
    }
    setProcessing('whatsapp');
    try {
      const res = await fetch('/api/integrations/whatsapp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: whatsappToken, phone: phone || "" })
      });
      const data = await res.json();

      if (data.instance && data.instance.status === 'connected') {
        setWhatsappStatus('connected');
        toast({ title: "Já conectado!", className: "bg-green-600 text-white" });
      } else if (data.instance && data.instance.qrcode) {
        setQrCode(data.instance.qrcode);
      } else {
        toast({ title: "Erro ao conectar", description: "Não foi possível obter o QR Code.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error connecting WhatsApp:", error);
      toast({ title: "Erro ao conectar", description: "Falha na comunicação com API.", variant: "destructive" });
    } finally {
      setProcessing(null);
    }
  };

  const handleDisconnectWhatsapp = async () => {
    if (!whatsappToken) return;
    setProcessing('whatsapp');
    try {
      const res = await fetch('/api/integrations/whatsapp/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: whatsappToken })
      });
      const data = await res.json();
      // API indicates success or if data.instance exists usually means handled
      setWhatsappStatus('disconnected');
      await supabase.from('profiles').update({ whatsapp_status: 'disconnected' }).eq('id', user!.id);

      toast({ title: "Desconectado.", description: "WhatsApp desconectado com sucesso." });
    } catch (error) {
      console.error("Error disconnecting WhatsApp:", error);
      toast({ title: "Erro ao desconectar", variant: "destructive" });
    } finally {
      setProcessing(null);
    }
  };

  const handleToggle = async (type: 'whatsapp' | 'calendar', action: 'connect' | 'disconnect') => {
    if (type === 'whatsapp') {
      if (action === 'connect') {
        await handleConnectWhatsapp();
      } else {
        await handleDisconnectWhatsapp();
      }
      return;
    }

    // Existing Calendar Logic (Mocked for now as per original code, or untouched)
    if (!user) return;
    setProcessing(type);
    await new Promise(r => setTimeout(r, 1000)); // Simulate delay

    try {
      const newStatus = action === 'connect' ? 'connected' : 'disconnected';
      const updateData = { calendar_status: newStatus };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;
      setCalendarStatus(newStatus);
      toast({
        title: action === 'connect' ? "Conectado com sucesso!" : "Desconectado.",
        className: action === 'connect' ? "bg-green-600 text-white" : ""
      });
    } catch (error) {
      console.error("Error updating connection:", error);
      toast({ title: "Erro na conexão.", variant: "destructive" });
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <AtendePsiShell title="Conexões">
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AtendePsiShell>
    )
  }

  return (
    <AtendePsiShell title="Conexões">
      <div className="h-full overflow-y-auto flex-1 min-h-0 pb-1">
        <div className="flex flex-col gap-6 max-w-3xl mx-auto">

          {/* WhatsApp Block */}
          <div className="ap-card ap-noise rounded-3xl p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
              <MessageCircle className="w-64 h-64 -mr-16 -mt-16 text-[#006f9a]" />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
              <div className="flex items-start gap-5">
                <div className={`h-16 w-16 rounded-2xl flex items-center justify-center shrink-0 border transition-colors ${whatsappStatus === 'connected' ? 'bg-[#006f9a]/10 border-[#006f9a]/20' : 'bg-muted border-border'
                  }`}>
                  <MessageCircle className={`h-8 w-8 ${whatsappStatus === 'connected' ? 'text-[#006f9a]' : 'text-muted-foreground'}`} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">WhatsApp Business</h2>
                    {whatsappStatus === 'connected' ? (
                      <Badge className="bg-[#006f9a] hover:bg-[#005a7d] text-white border-0 px-3 py-1">Conectado</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">Desconectado</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-base max-w-md leading-relaxed">
                    {whatsappStatus === 'connected'
                      ? "Sua assistente está ativa e respondendo mensagens automaticamente."
                      : "Conecte para que a IA possa responder seus pacientes automaticamente."}
                  </p>
                  {whatsappStatus === 'connected' && (
                    <div className="flex items-center gap-2 text-sm text-[#006f9a] font-medium pt-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Sincronização em tempo real</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3 w-full md:w-auto">
                {whatsappStatus === 'connected' ? (
                  <>
                    <Button className="w-full md:w-auto rounded-full bg-[#006f9a] hover:bg-[#005a7d] text-white shadow-lg shadow-[#006f9a]/20 h-10 px-6 font-semibold">
                      Configurar
                    </Button>
                    <Button
                      variant="ghost"
                      disabled={!!processing}
                      onClick={() => handleToggle('whatsapp', 'disconnect')}
                      className="w-full md:w-auto rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      {processing === 'whatsapp' ? <Loader2 className="animate-spin" /> : "Desconectar"}
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => handleToggle('whatsapp', 'connect')}
                    disabled={!!processing}
                    className="w-full md:w-auto rounded-full bg-[#006f9a] hover:bg-[#005a7d] text-white shadow-lg shadow-[#006f9a]/20 h-10 px-6 font-semibold"
                  >
                    {processing === 'whatsapp' ? <Loader2 className="animate-spin mr-2" /> : null}
                    Conectar WhatsApp
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Google Calendar Block */}
          <div className="ap-card ap-noise rounded-3xl p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
              <Calendar className="w-64 h-64 -mr-16 -mt-16 text-[#006f9a]" />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
              <div className="flex items-start gap-5">
                <div className={`h-16 w-16 rounded-2xl flex items-center justify-center shrink-0 border transition-colors ${calendarStatus === 'connected' ? 'bg-[#006f9a]/10 border-[#006f9a]/20' : 'bg-muted border-border'
                  }`}>
                  <Calendar className={`h-8 w-8 ${calendarStatus === 'connected' ? 'text-[#006f9a]' : 'text-muted-foreground'}`} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">Google Agenda</h2>
                    {calendarStatus === 'connected' ? (
                      <Badge className="bg-[#006f9a] hover:bg-[#005a7d] text-white border-0 px-3 py-1">Conectado</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">Desconectado</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-base max-w-md leading-relaxed">
                    Conecte sua agenda para que a IA possa consultar horários livres e agendar consultas automaticamente.
                  </p>
                  {calendarStatus !== 'connected' && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium pt-2">
                      <AlertCircle className="h-4 w-4" />
                      <span>Requer permissão de leitura e escrita</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3 w-full md:w-auto">
                {calendarStatus === 'connected' ? (
                  <Button
                    variant="ghost"
                    disabled={!!processing}
                    onClick={() => handleToggle('calendar', 'disconnect')}
                    className="w-full md:w-auto rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    {processing === 'calendar' ? <Loader2 className="animate-spin" /> : "Desconectar"}
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleToggle('calendar', 'connect')}
                    disabled={!!processing}
                    className="w-full md:w-auto rounded-full bg-[#006f9a] hover:bg-[#005a7d] text-white shadow-lg shadow-[#006f9a]/20 h-10 px-6 font-semibold"
                  >
                    {processing === 'calendar' ? <Loader2 className="animate-spin mr-2" /> : null}
                    Conectar Agenda
                  </Button>
                )}
              </div>
            </div>
          </div>

        </div>

        <Dialog open={!!qrCode} onOpenChange={(open) => !open && setQrCode(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Escanear QR Code</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center p-6 space-y-4">
              {qrCode && (
                <div className="bg-white p-2 rounded-lg border">
                  <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64 object-contain" />
                </div>
              )}
              <p className="text-sm text-center text-muted-foreground">
                Abra o WhatsApp no seu celular, vá em Aparelhos Conectados {'>'} Conectar um aparelho e escaneie o código acima.
              </p>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </AtendePsiShell>
  );
}
