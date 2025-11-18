import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Upload, Copy, Check, Loader2, Shield, Clock } from "lucide-react";
import { usePaystackPayment } from "react-paystack";

interface PaymentActivationProps {
  userData: {
    userId: string;
    email: string;
    fullName: string;
    countryData: any;
    accountTier: "student" | "investor";
  };
  onComplete: () => void;
}

export const PaymentActivation = ({ userData, onComplete }: PaymentActivationProps) => {
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fee = userData.accountTier === "student" 
    ? userData.countryData.student_fee 
    : userData.countryData.investor_fee;

  const isNigeria = userData.countryData.region === "nigeria";
  const isCryptoOnly = userData.countryData.region === "international";

  // Paystack configuration (for Nigeria)
  const paystackConfig = {
    reference: `BP-${userData.userId.slice(0, 8)}-${Date.now()}`,
    email: userData.email,
    amount: fee * 100, // Paystack expects amount in kobo
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '',
  };

  const onPaystackSuccess = async (reference: any) => {
    console.log('Paystack payment success:', reference);
    await processPayment({
      payment_method: 'paystack',
      payment_reference: reference.reference,
    });
  };

  const onPaystackClose = () => {
    toast({
      title: "Payment Cancelled",
      description: "You can try again when ready",
      variant: "destructive",
    });
  };

  const initializePayment = usePaystackPayment(paystackConfig);

  const handlePaystackPayment = () => {
    initializePayment({ onSuccess: onPaystackSuccess, onClose: onPaystackClose });
  };

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setScreenshot(e.target.files[0]);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "Address copied to clipboard",
    });
  };

  const processPayment = async (paymentData: any) => {
    setLoading(true);
    setUploadProgress(20);

    try {
      let screenshotUrl = null;

      // Upload screenshot if provided
      if (screenshot) {
        setUploadProgress(40);
        const fileExt = screenshot.name.split('.').pop();
        const fileName = `${userData.userId}/payment-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('payment-screenshots')
          .upload(fileName, screenshot);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('payment-screenshots')
          .getPublicUrl(fileName);

        screenshotUrl = publicUrl;
        setUploadProgress(60);
      }

      // Create payment transaction
      setUploadProgress(80);
      const { data, error } = await supabase.functions.invoke('process-payment', {
        body: {
          user_id: userData.userId,
          amount: fee,
          currency: userData.countryData.currency,
          payment_method: selectedMethod,
          transaction_type: 'registration_fee',
          screenshot_url: screenshotUrl,
          ...paymentData,
        },
      });

      if (error) throw error;

      setUploadProgress(100);

      if (data.success) {
        // Update profile as payment verified (pending admin approval)
        await supabase
          .from('profiles')
          .update({
            registration_payment_id: data.data.transaction_id,
          })
          .eq('id', userData.userId);

        toast({
          title: "Payment Submitted",
          description: data.data.message,
        });

        setTimeout(() => {
          onComplete();
        }, 2000);
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const handleCryptoPayment = async () => {
    if (!screenshot) {
      toast({
        title: "Screenshot Required",
        description: "Please upload payment proof",
        variant: "destructive",
      });
      return;
    }

    await processPayment({
      payment_method: 'crypto',
      payment_reference: `CRYPTO-${Date.now()}`,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-3xl p-8 bg-card/50 backdrop-blur-sm">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Activate Your Account</h2>
          <p className="text-muted-foreground flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Your country: {userData.countryData.country_name} • {userData.countryData.region.toUpperCase()} Tier
          </p>
        </div>

        <div className="mb-8 p-6 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">Registration Fee</span>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Invoice expires in 30 min</span>
            </div>
          </div>
          <div className="text-4xl font-bold">
            {userData.countryData.currency} {fee.toLocaleString()}
          </div>
          <p className="text-sm text-muted-foreground mt-2">{userData.accountTier.toUpperCase()} Account</p>
        </div>

        {/* Payment Methods */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Select Payment Method</h3>
            
            <div className="grid gap-4">
              {/* Nigeria - Paystack */}
              {isNigeria && (
                <button
                  onClick={() => {
                    setSelectedMethod('paystack');
                    handlePaystackPayment();
                  }}
                  className="p-4 rounded-lg border-2 hover:border-primary transition-colors text-left"
                >
                  <div className="font-semibold">Paystack</div>
                  <div className="text-sm text-muted-foreground">Pay with card or bank transfer</div>
                </button>
              )}

              {/* Crypto Payment */}
              {(isCryptoOnly || isNigeria) && (
                <div
                  onClick={() => setSelectedMethod('crypto')}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    selectedMethod === 'crypto' ? 'border-primary' : 'hover:border-primary'
                  }`}
                >
                  <div className="font-semibold">Cryptocurrency (USDT)</div>
                  <div className="text-sm text-muted-foreground mb-4">
                    Send {isCryptoOnly ? '$200' : `$${(fee / 1600).toFixed(2)}`} USDT to the address below
                  </div>

                  {selectedMethod === 'crypto' && (
                    <div className="space-y-4 mt-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <Label className="text-xs text-muted-foreground">USDT Wallet Address (TRC20)</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="flex-1 text-sm font-mono break-all">
                            TXyourwalletaddresshere123456789
                          </code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard('TXyourwalletaddresshere123456789')}
                          >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="screenshot">Upload Payment Screenshot *</Label>
                        <div className="mt-2">
                          <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors">
                            <Upload className="w-5 h-5" />
                            <span>{screenshot ? screenshot.name : "Choose screenshot"}</span>
                            <input
                              id="screenshot"
                              type="file"
                              accept="image/*"
                              onChange={handleScreenshotUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>

                      {uploadProgress > 0 && (
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      )}

                      <Button
                        onClick={handleCryptoPayment}
                        className="w-full"
                        disabled={!screenshot || loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          "Submit Payment"
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Grey Account (Other African countries) */}
              {!isNigeria && !isCryptoOnly && (
                <div className="p-4 rounded-lg border-2">
                  <div className="font-semibold">Grey Account</div>
                  <div className="text-sm text-muted-foreground">
                    Contact support for grey account payment details
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground">
            ⚠️ Payment verification usually takes 10-30 minutes. You'll receive a notification once approved.
          </p>
        </div>
      </Card>
    </div>
  );
};