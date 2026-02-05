import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { AtendePsiShell } from "@/components/atendepsi-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar, MessageCircle, CheckCircle2, AlertCircle, Loader2, QrCode, Smartphone, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Helper to format phone number as (DDD) 9 9999-9999
const formatPhoneNumber = (value: string) => {
  const digits = value.replace(/\D/g, "");
  // Limit to 11 chars (2 DDD + 9 numeric)
  const limited = digits.slice(0, 11);

  if (limited.length <= 2) return limited;
  if (limited.length <= 3) return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
  if (limited.length <= 7) return `(${limited.slice(0, 2)}) ${limited.slice(2, 3)} ${limited.slice(3)}`;
  return `(${limited.slice(0, 2)}) ${limited.slice(2, 3)} ${limited.slice(3, 7)}-${limited.slice(7)}`;
};

export default function ConnectionsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const [whatsappStatus, setWhatsappStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [calendarStatus, setCalendarStatus] = useState<'connected' | 'disconnected'>('disconnected');

  const [whatsappToken, setWhatsappToken] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [dataPhone, setDataPhone] = useState<string | null>(null); // Phone saved in DB
  const [qrCode, setQrCode] = useState<string | null>(null);

  const [googleStatus, setGoogleStatus] = useState<{ connected: boolean, email?: string } | null>(null);

  // Profile data for API
  const [fullName, setFullName] = useState<string>("");
  const [cpf, setCpf] = useState<string>("");
  const [contato, setContato] = useState<string>("");

  useEffect(() => {
    fetchConnections();
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchGoogleStatus();
      checkUrlParams();
    }
  }, [user]);

  useEffect(() => {
    if (whatsappToken) {
      checkWhatsappStatus();
    }
  }, [whatsappToken]);

  const fetchConnections = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('whatsapp_token, ai_phone, full_name, cpf, contato')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        // Default to disconnected until verified
        setWhatsappStatus('disconnected');

        setWhatsappToken(data.whatsapp_token);
        setPhone(data.ai_phone);
        setDataPhone(data.ai_phone);

        setFullName(data.full_name || "");
        setCpf(data.cpf || "");
        setContato(data.contato || "");
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
      const res = await fetch('https://atendepsi.uazapi.com/instance/status', {
        headers: {
          'Accept': 'application/json',
          'token': whatsappToken
        }
      });
      const data = await res.json();

      if (data && data.instance && data.instance.status === 'connected') {
        setWhatsappStatus('connected');
      } else {
        setWhatsappStatus('disconnected');
      }
    } catch (error) {
      console.error("Error checking WhatsApp status:", error);
    }
  };

  // Google Calendar Logic
  const checkUrlParams = async () => {
    const params = new URLSearchParams(window.location.search);
    const googleConnected = params.get("google_connected");
    const error = params.get("error");
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const email = params.get("email");

    if (googleConnected === "true") {
      if (accessToken && refreshToken && user) {
        try {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              google_access_token: accessToken,
              google_refresh_token: refreshToken,
              google_email: email
            })
            .eq('id', user.id);

          if (updateError) throw updateError;

          toast({
            title: "Conectado!",
            description: "Google Calendar conectado e salvo com sucesso.",
            className: "bg-green-600 text-white border-none",
          });
        } catch (e) {
          console.error("Failed to save tokens frontend:", e);
          toast({
            title: "Erro ao salvar",
            description: "Falha ao persistir conexão no banco de dados.",
            variant: "destructive",
          });
        }
      } else {
        // Fallback for just UI update if no tokens passed (legacy)
        toast({
          title: "Conectado!",
          description: "Google Calendar conectado com sucesso.",
          className: "bg-green-600 text-white border-none",
        });
      }

      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
      fetchGoogleStatus(); // Refresh status
    } else if (googleConnected === "false") {
      toast({
        title: "Erro na conexão",
        description: error || "Não foi possível conectar ao Google Calendar.",
        variant: "destructive",
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (googleConnected === "partial") {
      toast({
        title: "Erro Parcial",
        description: error || "Conectado mas falha ao salvar.",
        variant: "destructive",
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  const fetchGoogleStatus = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/integrations/google/status?userId=${user.id}`);
      const data = await res.json();
      setGoogleStatus(data);
      if (data.connected) {
        setCalendarStatus('connected');
      } else {
        setCalendarStatus('disconnected');
      }
    } catch (error) {
      console.error("Failed to fetch google status", error);
    }
  };

  const handleGoogleConnect = async () => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não identificado", variant: "destructive" });
      return;
    }
    setProcessing('calendar');
    try {
      const res = await fetch(`/api/auth/google?userId=${user.id}`);
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No URL returned");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao iniciar conexão com Google.",
        variant: "destructive",
      });
      setProcessing(null);
    }
  };


  const handleSaveInstance = async () => {
    if (!phone) return;
    setProcessing('save_instance');
    try {
      // 1. Call external API to init instance FIRST (Strict Order)
      // Ensure we have a valid name. If fullName is empty, use a fallback.
      const safeName = (fullName && fullName.trim() !== "") ? fullName : `Cliente ${phone}`;

      const response = await fetch('https://atendepsi.uazapi.com/instance/init', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'admintoken': 'NfKtuDQbRoyrBFuw5gxxWNtLzJey4kA8eewgzO4VwOBgpDpYdK'
        },
        body: JSON.stringify({
          name: safeName,
          instanceName: safeName, // Sending both to satisfy "Missing Name or instanceName"
          systemName: 'apilocal',
          adminField01: cpf,
          adminField02: contato,
          fingerprintProfile: 'chrome',
          browser: 'chrome'
        })
      });

      if (!response.ok) {
        // Try to read error body
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Erro na API: ${response.statusText}`);
      }

      const apiData = await response.json();

      // 2. Extract token from response
      // User said "pegar o 'token' retornado", so we look for token/hash/key
      const newToken = apiData.token || apiData.hash || apiData.key;

      if (!newToken) {
        console.warn("No token found in response:", apiData);
        throw new Error("API não retornou um token válido.");
      }

      // 3. Save Phone AND Token to Supabase
      // Only now do we update the database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          ai_phone: phone,
          whatsapp_token: newToken
        })
        .eq('id', user!.id);

      if (updateError) throw updateError;

      // 4. Update local state to Lock UI and show Connect button
      setWhatsappToken(newToken);
      setDataPhone(phone);

      toast({ title: "Instância criada", description: "Instância iniciada e token salvo. Agora conecte o WhatsApp." });

    } catch (error: any) {
      console.error(error);
      toast({ title: "Erro ao salvar", description: error.message || "Falha ao criar instância.", variant: "destructive" });
    } finally {
      setProcessing(null);
    }
  };

  const handleConnectWhatsapp = async () => {
    if (!whatsappToken) {
      toast({ title: "Erro de configuração", description: "Token do WhatsApp não encontrado.", variant: "destructive" });
      return;
    }

    setProcessing('whatsapp');

    const tryConnect = async (attemptsLeft: number): Promise<any> => {
      try {
        const res = await fetch('https://atendepsi.uazapi.com/instance/connect', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'token': whatsappToken
          },
          body: JSON.stringify({ phone: dataPhone || phone })
        });

        if (!res.ok) throw new Error(`Erro API Connect: ${res.statusText}`);
        const data = await res.json();

        // Success conditions
        if (data.instance && (data.instance.status === 'connected' || data.instance.qrcode)) {
          return data;
        }

        // Retry if empty
        if (attemptsLeft > 0) {
          console.log(`QR Code vazio, tentando novamente... (${attemptsLeft} restantes)`);
          await new Promise(r => setTimeout(r, 2000));
          return tryConnect(attemptsLeft - 1);
        }

        return data;
      } catch (e) {
        throw e;
      }
    };

    try {
      const data = await tryConnect(2); // Try up to 3 times total

      if (data.instance && data.instance.status === 'connected') {
        setWhatsappStatus('connected');
        toast({ title: "Já conectado!", className: "bg-green-600 text-white" });
      } else if (data.instance && data.instance.qrcode) {
        setQrCode(data.instance.qrcode);
      } else {
        toast({ title: "Erro ao conectar", description: "Não foi possível obter o QR Code. Tente novamente.", variant: "destructive" });
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
      // API indicates success or if data.instance exists usually means handled
      setWhatsappStatus('disconnected');
      // No column 'whatsapp_status' in DB
      // await supabase.from('profiles').update({ whatsapp_status: 'disconnected' }).eq('id', user!.id);

      toast({ title: "Desconectado.", description: "WhatsApp desconectado com sucesso." });
    } catch (error) {
      console.error("Error disconnecting WhatsApp:", error);
      toast({ title: "Erro ao desconectar", variant: "destructive" });
    } finally {
      setProcessing(null);
    }
  };

  const handleDeleteInstance = async () => {
    if (!whatsappToken) return;
    setProcessing('delete_instance');
    try {
      // External API DELETE
      const res = await fetch('https://atendepsi.uazapi.com/instance', {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'token': whatsappToken
        }
      });

      // We log error but proceed to clear local/db state to avoid lock-in
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("Delete instance API error", err);
      }

      // Clear DB
      await supabase.from('profiles').update({
        whatsapp_token: null,
        ai_phone: null
      }).eq('id', user!.id);

      // Clear State
      setWhatsappToken(null);
      setDataPhone(null);
      setPhone(null);
      setWhatsappStatus('disconnected');

      toast({ title: "Instância excluída", description: "Instância removida com sucesso." });

    } catch (error) {
      console.error(error);
      toast({ title: "Erro", description: "Falha ao excluir instância.", variant: "destructive" });
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

    // Google Logic
    if (action === 'connect') {
      handleGoogleConnect();
    } else {
      // Disconnect Google (Currently manual DB clear or re-auth, but we can assume simple UI state reset or implementation of disconnect api soon)
      // For now, let's just show a toast that disconnect is not fully implemented in UI or implement a disconnect endpoint?
      // Let's implement a disconnect call if we have time, but strictly following the prompt, we just move UI.
      // Actually, we should probably implement a disconnect route or just clear local state?
      // The user asked to move functionality. Settings page didn't have disconnect logic beyond visual.
      // But settings had a "Connected" state.
      // Let's implement a simple disconnect by clearing the token?
      // I don't have a disconnect endpoint yet in routes.ts for Google.
      // I will just show toast "Desconectar via Google Account Permissions" for now or just reset local state to detached?
      // User asked to "move" it.
      toast({ title: "Desconexão", description: "Para desconectar, remova o acesso em sua conta Google." });
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
              <div className="flex items-start gap-5 flex-1">
                <div className={`h-16 w-16 rounded-2xl flex items-center justify-center shrink-0 border transition-colors ${whatsappStatus === 'connected' ? 'bg-[#006f9a]/10 border-[#006f9a]/20' : 'bg-muted border-border'
                  }`}>
                  <MessageCircle className={`h-8 w-8 ${whatsappStatus === 'connected' ? 'text-[#006f9a]' : 'text-muted-foreground'}`} />
                </div>
                <div className="space-y-3 w-full max-w-lg">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">WhatsApp Business</h2>
                    {whatsappStatus === 'connected' ? (
                      <Badge className="bg-[#006f9a] hover:bg-[#005a7d] text-white border-0 px-3 py-1">Conectado</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">Desconectado</Badge>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Número do WhatsApp</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-muted-foreground font-medium">+55</span>
                      </div>
                      <Input
                        value={formatPhoneNumber(phone || "")}
                        onChange={(e) => {
                          // Keep only digits
                          const raw = e.target.value.replace(/\D/g, "");
                          setPhone(raw);
                        }}
                        placeholder="(DDD) 9 9999-9999"
                        disabled={!!dataPhone || whatsappStatus === 'connected'}
                        className="bg-background/80 pl-12 font-medium"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {whatsappStatus === 'connected'
                        ? "Número conectado e vinculado à instância."
                        : "Insira o DDD e número."}
                    </p>
                  </div>

                  {whatsappStatus === 'connected' && (
                    <div className="flex items-center gap-2 text-sm text-[#006f9a] font-medium pt-1">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Sincronização em tempo real</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3 w-full md:w-auto min-w-[200px]">
                {whatsappStatus === 'connected' ? (
                  <>
                    <Button
                      variant="ghost"
                      disabled={!!processing}
                      onClick={() => handleToggle('whatsapp', 'disconnect')}
                      className="w-full rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      {processing === 'whatsapp' ? <Loader2 className="animate-spin" /> : "Desconectar"}
                    </Button>
                  </>
                ) : (
                  <>
                    {!dataPhone ? (
                      <Button
                        onClick={handleSaveInstance}
                        disabled={!!processing || !phone}
                        className="w-full rounded-full bg-[#006f9a] hover:bg-[#005a7d] text-white shadow-lg shadow-[#006f9a]/20 h-10 px-6 font-semibold"
                      >
                        {processing === 'save_instance' ? <Loader2 className="animate-spin mr-2" /> : null}
                        Salvar e Criar Instância
                      </Button>
                    ) : (
                      <div className="flex flex-col gap-2 w-full">
                        <Button
                          onClick={handleConnectWhatsapp}
                          disabled={!!processing}
                          className="w-full rounded-full bg-[#006f9a] hover:bg-[#005a7d] text-white shadow-lg shadow-[#006f9a]/20 h-10 px-6 font-semibold"
                        >
                          {processing === 'whatsapp' ? <Loader2 className="animate-spin mr-2" /> : null}
                          Conectar WhatsApp
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={!!processing}
                          onClick={handleDeleteInstance}
                          className="text-xs text-destructive hover:text-destructive/80"
                        >
                          {processing === 'delete_instance' ? <Loader2 className="animate-spin h-3 w-3 mr-2" /> : null}
                          Excluir Instância
                        </Button>
                      </div>
                    )}
                  </>
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
                    {googleStatus?.connected
                      ? `Conectado como ${googleStatus.email}`
                      : "Conecte sua agenda para que a IA possa consultar horários livres e agendar consultas automaticamente."
                    }
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
