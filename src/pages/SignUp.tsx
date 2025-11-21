import { useState } from "react";
import { PathSelector } from "@/components/signup/PathSelector";
import { RegistrationForm } from "@/components/signup/RegistrationForm";
import { PaymentActivation } from "@/components/signup/PaymentActivation";
import { useNavigate } from "react-router-dom";
import { CinematicIntro } from "@/components/CinematicIntro";
import { AchievementCinematic } from "@/components/AchievementCinematic";

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
      <AchievementCinematic
        title="Welcome to BlackPAL!"
        description="Your elite journey begins now. Prepare for transformation."
        xpEarned={100}
        coinsEarned={50}
        onComplete={() => navigate("/")}
      />
    );
  }

  return null;
}