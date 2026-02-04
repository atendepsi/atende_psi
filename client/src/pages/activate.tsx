import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import logo from "@/assets/logo.png";

const DEFAULT_PASSWORD_HASH = "86770fca8a5224286d7607b525d6724f";

export default function ActivatePage() {
    const { signInWithPassword } = useAuth();
    const [_, setLocation] = useLocation();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'verify' | 'reset'>('verify');

    // Verify State
    const [email, setEmail] = useState("");
    const [cpf, setCpf] = useState("");

    // Reset State
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const formatCPF = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Tentar login com a senha padrão
            const { error } = await signInWithPassword(email, DEFAULT_PASSWORD_HASH);

            if (error) {
                // Se falhar o login com senha padrão, pode ser que:
                // a) Email não existe
                // b) Senha já foi alterada (usuário já ativou)
                // c) Senha padrão incorreta (configuração errada)

                // Vamos tentar dar uma mensagem útil ou genérica por segurança
                throw new Error("Não foi possível validar seus dados. Verifique se o email está correto ou se você já ativou sua conta.");
            }

            // 2. Se login passou, verificar CPF match no profile
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                throw new Error("Erro ao recuperar usuário.");
            }

            // Buscar perfil
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('cpf')
                .eq('id', user.id)
                .single();

            // Se der erro ao buscar profile ou não tiver CPF, deixamos passar? 
            // O user pediu: "colocar mesmos dados de email e CPF... e quando o sistema confirmar"
            // Se o webhook cria o profile com CPF, deve existir.

            const cleanInputCpf = cpf.replace(/\D/g, '');
            const cleanProfileCpf = profile?.cpf?.replace(/\D/g, '');

            if (profileError || cleanInputCpf !== cleanProfileCpf) {
                // Logout se os dados não baterem para garantir segurança
                await supabase.auth.signOut();
                throw new Error("O CPF informado não corresponde ao cadastro deste email.");
            }

            // Se tudo ok, vai para passo 2
            setStep('reset');
            toast({
                title: "Dados confirmados",
                description: "Por favor, defina sua nova senha.",
            });

        } catch (error: any) {
            console.error(error);
            toast({
                title: "Erro na verificação",
                description: error.message,
                variant: "destructive"
            });
            // Garantir logout em caso de erro após login parcial
            await supabase.auth.signOut();
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword.length < 6) {
            toast({
                title: "Senha muito curta",
                description: "A senha deve ter pelo menos 6 caracteres.",
                variant: "destructive"
            });
            return;
        }

        if (newPassword !== confirmPassword) {
            toast({
                title: "Senhas não conferem",
                description: "As senhas digitadas são diferentes.",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            toast({
                title: "Conta ativada!",
                description: "Sua senha foi definida com sucesso.",
            });

            setLocation("/");
        } catch (error: any) {
            toast({
                title: "Erro ao salvar",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
            <Card className="w-full max-w-md border-border/60 shadow-lg">
                <CardHeader className="text-center space-y-2">
                    <div className="mx-auto w-24 mb-2">
                        <img src={logo} alt="AtendePsi Logo" className="w-full h-auto" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-foreground">
                        {step === 'verify' ? "Ativar Conta" : "Diferir Nova Senha"}
                    </CardTitle>
                    <CardDescription>
                        {step === 'verify'
                            ? "Confirme seus dados para ativar o acesso."
                            : "Escolha uma senha segura para acessar o painel."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {step === 'verify' ? (
                        <form onSubmit={handleVerify} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email utilizado na compra</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="seu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="bg-muted/30"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cpf">CPF</Label>
                                <Input
                                    id="cpf"
                                    placeholder="000.000.000-00"
                                    value={cpf}
                                    onChange={(e) => setCpf(formatCPF(e.target.value))}
                                    required
                                    className="bg-muted/30"
                                    maxLength={14}
                                />
                            </div>
                            <Button type="submit" className="w-full bg-[#006f9a] hover:bg-[#005a7d]" disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Continuar
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleReset} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">Nova Senha</Label>
                                <div className="relative">
                                    <Input
                                        id="newPassword"
                                        type={showPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        className="bg-muted/30 pr-10"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:bg-transparent"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="bg-muted/30"
                                />
                            </div>
                            <Button type="submit" className="w-full bg-[#006f9a] hover:bg-[#005a7d]" disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Salvar e Entrar
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
