import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

export default function AuthPage() {
    const { signInWithPassword } = useAuth();
    const [_, setLocation] = useLocation();
    const [loading, setLoading] = useState(false);

    // Login State
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [showLoginPassword, setShowLoginPassword] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await signInWithPassword(loginEmail, loginPassword);
            if (error) throw error;
            setLocation("/");
        } catch (error: any) {
            toast({
                title: "Erro ao entrar",
                description: error.message || "Verifique suas credenciais.",
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
                    <CardTitle className="text-2xl font-bold text-foreground">Bem-vindo(a)</CardTitle>
                    <CardDescription>Acesse o painel do AtendePsi</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="seu@email.com"
                                value={loginEmail}
                                onChange={(e) => setLoginEmail(e.target.value)}
                                required
                                className="bg-muted/30"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Senha</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showLoginPassword ? "text" : "password"}
                                    value={loginPassword}
                                    onChange={(e) => setLoginPassword(e.target.value)}
                                    required
                                    className="bg-muted/30 pr-10"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:bg-transparent"
                                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                                >
                                    {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                        <Button type="submit" className="w-full bg-[#006f9a] hover:bg-[#005a7d]" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Entrar
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
