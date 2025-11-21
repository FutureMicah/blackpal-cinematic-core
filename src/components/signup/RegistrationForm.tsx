import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, Shield, Eye, EyeOff } from "lucide-react";

interface CountryData {
  country_code: string;
  country_name: string;
  region: string;
  currency: string;
  student_fee: number;
  investor_fee: number;
  payment_methods: string[];
}

interface RegistrationFormProps {
  accountTier: "student" | "investor";
  onComplete: (data: any) => void;
}

export const RegistrationForm = ({ accountTier, onComplete }: RegistrationFormProps) => {
  const [loading, setLoading] = useState(false);
  const [detectingCountry, setDetectingCountry] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [countryData, setCountryData] = useState<CountryData | null>(null);
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    referralCode: "",
  });

  useEffect(() => {
    detectCountry();
  }, []);

  const detectCountry = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('detect-country');
      
      if (error) throw error;
      
      if (data?.success) {
        setCountryData(data.data);
        toast({
          title: "Location Detected",
          description: `${data.data.country_name} - ${data.data.region.toUpperCase()} Zone`,
        });
      }
    } catch (error) {
      console.error('Country detection error:', error);
      toast({
        title: "Detection Failed",
        description: "Using default international pricing",
        variant: "destructive",
      });
    } finally {
      setDetectingCountry(false);
    }
  };

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    setPasswordStrength(strength);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (passwordStrength < 3) {
      toast({
        title: "Weak Password",
        description: "Please use a stronger password",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
            referral_code: formData.referralCode,
            account_tier: accountTier,
            country_code: countryData?.country_code,
            country_name: countryData?.country_name,
            detected_region: countryData?.region,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Update profile with country data
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            country_code: countryData?.country_code,
            country_name: countryData?.country_name,
            detected_region: countryData?.region,
            account_tier: accountTier,
            full_name: formData.fullName,
          })
          .eq('id', authData.user.id);

        if (profileError) console.error('Profile update error:', profileError);

        // Update country activity for heatmap
        if (countryData) {
          try {
            await supabase.functions.invoke('update-country-activity', {
              body: {
                country_code: countryData.country_code,
                country_name: countryData.country_name,
                region: countryData.region,
                xp_gained: 0,
                milestone: {
                  type: 'registration',
                  description: `New ${accountTier} joined from ${countryData.country_name}`,
                },
              },
            });
          } catch (activityError) {
            console.error('Country activity update error:', activityError);
          }
        }

        // Proceed to payment
        onComplete({
          userId: authData.user.id,
          email: formData.email,
          fullName: formData.fullName,
          countryData,
          accountTier,
        });
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = () => {
    if (passwordStrength <= 2) return "bg-red-500";
    if (passwordStrength <= 3) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStrengthLabel = () => {
    if (passwordStrength <= 1) return "Weak";
    if (passwordStrength <= 2) return "Medium";
    if (passwordStrength <= 3) return "Strong";
    return "Unbreakable";
  };

  if (detectingCountry) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg text-muted-foreground">Detecting your location...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-2xl p-8 bg-card/50 backdrop-blur-sm">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Create Your Account</h2>
          <p className="text-muted-foreground">
            {countryData && (
              <span className="inline-flex items-center gap-2">
                <Shield className="w-4 h-4" />
                {countryData.country_name} • {countryData.region.toUpperCase()} Tier • {accountTier.toUpperCase()}
              </span>
            )}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  calculatePasswordStrength(e.target.value);
                }}
                className="mt-1 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {formData.password && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full ${
                        i < passwordStrength ? getStrengthColor() : "bg-muted"
                      } transition-colors`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">{getStrengthLabel()}</p>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="referralCode">Referral Code (Optional)</Label>
            <Input
              id="referralCode"
              type="text"
              value={formData.referralCode}
              onChange={(e) => setFormData({ ...formData, referralCode: e.target.value })}
              className="mt-1"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Account...
              </>
            ) : (
              "Next → Payment Activation"
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <a href="/auth" className="text-primary hover:underline">
            Sign in
          </a>
        </p>
      </Card>
    </div>
  );
};