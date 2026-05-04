import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Key, Send, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Settings = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) navigate("/auth");
    };
    checkAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 animate-slide-up">
          <h1 className="text-4xl font-bold gradient-text-cyber mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Configure backend integrations
          </p>
        </div>

        <div className="space-y-6">
          <Card className="glass animate-scale-in" style={{ animationDelay: "0.1s" }}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <CardTitle>Paystack Integration</CardTitle>
              </div>
              <CardDescription>
                Server-managed payment processing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Paystack secret keys are sensitive and must never be entered or stored in
                the browser. They are managed as encrypted backend secrets and used only by
                server-side payment verification functions.
              </p>
              <p>
                A workspace admin can rotate the <code className="font-mono">PAYSTACK_SECRET_KEY</code> via the
                Cloud → Secrets manager.
              </p>
            </CardContent>
          </Card>

          <Card className="glass animate-scale-in" style={{ animationDelay: "0.2s" }}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-primary" />
                <CardTitle>Telegram Bot</CardTitle>
              </div>
              <CardDescription>
                Server-managed bot integration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Telegram bot tokens are stored as encrypted backend secrets
                (<code className="font-mono">TELEGRAM_BOT_TOKEN</code>) and used only by
                server-side functions for invitations and notifications.
              </p>
              <p>Get your bot token from @BotFather on Telegram, then ask an admin to add it via Cloud → Secrets.</p>
            </CardContent>
          </Card>

          <Card className="glass animate-scale-in" style={{ animationDelay: "0.3s" }}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-primary" />
                <CardTitle>Authentication</CardTitle>
              </div>
              <CardDescription>Lovable Cloud authentication is active</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-accent">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <p className="text-sm">Active and Connected</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
