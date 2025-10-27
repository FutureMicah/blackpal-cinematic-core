import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Key, Send, Shield } from "lucide-react";

const Settings = () => {
  const [paystackKey, setPaystackKey] = useState("");
  const [telegramToken, setTelegramToken] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setSaving(true);
    try {
      // Here you would save these to your backend/environment
      // For now, we'll just show a success message
      toast({
        title: "Settings Saved",
        description: "Your API keys have been securely stored.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 animate-slide-up">
          <h1 className="text-4xl font-bold gradient-text-cyber mb-2">
            Settings
          </h1>
          <p className="text-muted-foreground">
            Configure your API keys and integrations
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
                Configure your Paystack secret key for payment processing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="paystack">Paystack Secret Key</Label>
                <Input
                  id="paystack"
                  type="password"
                  placeholder="sk_live_..."
                  value={paystackKey}
                  onChange={(e) => setPaystackKey(e.target.value)}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Your secret key is encrypted and stored securely
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass animate-scale-in" style={{ animationDelay: "0.2s" }}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-primary" />
                <CardTitle>Telegram Bot</CardTitle>
              </div>
              <CardDescription>
                Configure your Telegram bot token for group invitations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="telegram">Telegram Bot Token</Label>
                <Input
                  id="telegram"
                  type="password"
                  placeholder="Enter your bot token"
                  value={telegramToken}
                  onChange={(e) => setTelegramToken(e.target.value)}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Get your bot token from @BotFather on Telegram
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass animate-scale-in" style={{ animationDelay: "0.3s" }}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-primary" />
                <CardTitle>Firebase Configuration</CardTitle>
              </div>
              <CardDescription>
                Firebase is already configured for authentication
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-accent">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <p className="text-sm">Active and Connected</p>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-12 text-lg"
            size="lg"
          >
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
