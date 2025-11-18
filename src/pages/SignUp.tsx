import { useState } from "react";
import { PathSelector } from "@/components/signup/PathSelector";
import { RegistrationForm } from "@/components/signup/RegistrationForm";
import { PaymentActivation } from "@/components/signup/PaymentActivation";
import { useNavigate } from "react-router-dom";
import { CinematicIntro } from "@/components/CinematicIntro";

type SignUpStep = "intro" | "path" | "form" | "payment" | "complete";

export default function SignUp() {
  const navigate = useNavigate();
  const [step, setStep] = useState<SignUpStep>("intro");
  const [accountTier, setAccountTier] = useState<"student" | "investor">("student");
  const [userData, setUserData] = useState<any>(null);

  const handleIntroComplete = () => {
    setStep("path");
  };

  const handlePathSelect = (path: "student" | "investor") => {
    setAccountTier(path);
    setStep("form");
  };

  const handleFormComplete = (data: any) => {
    setUserData(data);
    setStep("payment");
  };

  const handlePaymentComplete = () => {
    setStep("complete");
    setTimeout(() => {
      navigate("/");
    }, 3000);
  };

  if (step === "intro") {
    return <CinematicIntro onComplete={handleIntroComplete} />;
  }

  if (step === "path") {
    return <PathSelector onSelect={handlePathSelect} />;
  }

  if (step === "form") {
    return (
      <RegistrationForm
        accountTier={accountTier}
        onComplete={handleFormComplete}
      />
    );
  }

  if (step === "payment") {
    return (
      <PaymentActivation
        userData={userData}
        onComplete={handlePaymentComplete}
      />
    );
  }

  if (step === "complete") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center animate-fade-in">
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <div className="text-5xl">🎉</div>
            </div>
            <h1 className="text-4xl font-bold mb-4">Welcome to BlackPAL!</h1>
            <p className="text-lg text-muted-foreground">
              Your account is being verified. Redirecting to dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}