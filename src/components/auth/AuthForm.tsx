// src/components/auth/AuthForm.tsx
import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";

async function wait(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

export function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyNumber, setCompanyNumber] = useState("");

  // helper: try action with single retry if Supabase returns "For security purposes" error
  async function tryWithPossibleBackoff<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (err: any) {
      const msg = err?.message ?? "";
      if (msg.includes("For security purposes") || msg.includes("you can only request this after")) {
        console.warn("Auth rate-limit detected, retrying after delay...", msg);
        await wait(8000); // wait 8s, then retry once
        return await fn();
      }
      throw err;
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Вход (с retry на rate-limit)
        const result = await tryWithPossibleBackoff(() => supabase.auth.signInWithPassword({ email, password }));

        if (result.error) {
          console.error("Sign in error:", result.error);
          alert(result.error.message || "Ошибка входа");
        } else {
          // успешный вход — редиректим на дашборд
          window.location.href = "/dashboard";
        }
      } else {
        // Регистрация (без подтверждения email предполагаем, что user возвращается)
        const result = await tryWithPossibleBackoff(() => supabase.auth.signUp({ email, password }));

        if (result.error) {
          console.error("Sign up error:", result.error);
          alert(result.error.message || "Ошибка регистрации");
        } else {
          const userId = result.data?.user?.id;
          // Если сервер вернул userId — создаём профиль сразу
          if (userId) {
            const { error: profileError } = await supabase.from("profiles").insert({
              id: userId,
              participant_number: companyNumber || null,
              status: "active",
              created_at: new Date().toISOString(),
            });

            if (profileError) {
              console.error("Profile insert error:", profileError);
              alert("Профиль не был сохранён: " + profileError.message);
            } else {
              // профиль создан — редирект
              window.location.href = "/dashboard";
            }
          } else {
            // Сценарий на случай, если signUp не вернул user (например, подтверждение email включено)
            // На этот момент мы предполагаем, что подтверждение отключено — но оставим безопасное поведение
            localStorage.setItem(`pending_profile_${email}`, companyNumber || "");
            alert(
              "Аккаунт создан. Если включено подтверждение по e-mail, проверьте почту. Профиль будет создан автоматически после первого входа.",
            );
          }
        }
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      alert(err?.message || "Не удалось выполнить запрос к Supabase");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-kpi-navy/95" />
        <div className="relative z-10 flex flex-col justify-center items-center p-12 text-primary-foreground">
          <h1 className="text-4xl font-display font-bold mb-4 text-center animate-slide-up">Benchmarking Program</h1>
          <p
            className="text-lg text-primary-foreground/80 text-center max-w-md animate-slide-up"
            style={{ animationDelay: "0.1s" }}
          >
            Track performance, analyze trends, and make data-driven decisions for your retail business.
          </p>
          <div className="mt-12 grid grid-cols-3 gap-8 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <div className="text-center">
              <div className="text-3xl font-display font-bold">50+</div>
              <div className="text-sm text-primary-foreground/70">KPI Metrics</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-display font-bold">Real-time</div>
              <div className="text-sm text-primary-foreground/70">Analytics</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-display font-bold">Weekly</div>
              <div className="text-sm text-primary-foreground/70">Reports</div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute top-20 right-10 w-48 h-48 bg-primary-foreground/5 rounded-full blur-2xl" />
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 animate-fade-in">
            <h2 className="text-3xl font-display font-bold text-foreground">
              {isLogin ? "Welcome back" : "Create account"}
            </h2>
            <p className="text-muted-foreground mt-2">
              {isLogin ? "Enter your credentials to access your dashboard" : "Sign up to start tracking your KPIs"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 animate-slide-up">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 bg-secondary/50 border-border focus:border-primary focus:ring-primary"
                  required
                />
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="companyNumber" className="text-sm font-medium">
                  Company Number
                </Label>
                <div className="relative">
                  <Input
                    id="companyNumber"
                    type="text"
                    placeholder="AA0000"
                    value={companyNumber}
                    onChange={(e) => setCompanyNumber(e.target.value)}
                    className="h-12 bg-secondary/50 border-border focus:border-primary focus:ring-primary"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 bg-secondary/50 border-border focus:border-primary focus:ring-primary"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {isLogin && (
              <div className="flex justify-end">
                <button type="button" className="text-sm text-primary hover:underline">
                  Forgot password?
                </button>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold gradient-primary hover:opacity-90 transition-opacity"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {isLogin ? "Signing in..." : "Creating account..."}
                </>
              ) : (
                <>{isLogin ? "Sign in" : "Create account"}</>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <p className="text-muted-foreground">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary font-semibold hover:underline"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
