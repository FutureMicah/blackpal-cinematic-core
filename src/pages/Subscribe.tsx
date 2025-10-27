import { useState, useEffect } from "react";
import { usePaystackPayment } from "react-paystack";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const PAYSTACK_PUBLIC_KEY = "pk_live_your_public_key_here"; // You'll need to add your public key

const Subscribe = () => {
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }
      
      setUserEmail(session.user.email || "");
    };

    checkAuth();
  }, [navigate]);

  const config = {
    reference: new Date().getTime().toString(),
    email: userEmail,
    amount: 2500000, // ₦25,000 in kobo
    publicKey: PAYSTACK_PUBLIC_KEY,
  };

  const onSuccess = (reference: any) => {
    toast({
      title: "Payment Successful!",
      description: "Your subscription is now active. Welcome to the academy!",
    });
    // Here you would save the subscription status to your backend
    navigate("/dashboard");
  };

  const onClose = () => {
    toast({
      title: "Payment Cancelled",
      description: "You can try again when you're ready.",
      variant: "destructive",
    });
  };

  const initializePayment = usePaystackPayment(config);

  const handleSubscribe = () => {
    setLoading(true);
    initializePayment({ onSuccess, onClose });
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 -z-10">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-primary/30 rounded-full animate-particle blur-sm"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      <Card className="glass max-w-md w-full animate-scale-in">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl gradient-text-wealth mb-2">
            Premium Membership
          </CardTitle>
          <CardDescription className="text-lg">
            Join the elite trading academy
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-5xl font-bold gradient-text-cyber mb-2">
              ₦25,000
            </div>
            <div className="text-muted-foreground">per month</div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-accent/20 p-1">
                <Check className="w-4 h-4 text-accent" />
              </div>
              <div>
                <p className="font-medium">Private Telegram Group</p>
                <p className="text-sm text-muted-foreground">
                  Exclusive access to our premium trading community
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="rounded-full bg-accent/20 p-1">
                <Check className="w-4 h-4 text-accent" />
              </div>
              <div>
                <p className="font-medium">Daily Market Analysis</p>
                <p className="text-sm text-muted-foreground">
                  Professional insights and trading signals
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="rounded-full bg-accent/20 p-1">
                <Check className="w-4 h-4 text-accent" />
              </div>
              <div>
                <p className="font-medium">1-on-1 Mentorship</p>
                <p className="text-sm text-muted-foreground">
                  Personal guidance from experienced traders
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="rounded-full bg-accent/20 p-1">
                <Check className="w-4 h-4 text-accent" />
              </div>
              <div>
                <p className="font-medium">Premium Resources</p>
                <p className="text-sm text-muted-foreground">
                  Advanced strategies, tools, and indicators
                </p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full h-12 text-lg"
            size="lg"
          >
            {loading ? "Processing..." : "Subscribe Now"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Subscribe;
