import { useState } from "react";
import { CinematicIntro } from "@/components/CinematicIntro";
import { Dashboard } from "@/components/Dashboard";
import { CustomCursor } from "@/components/CustomCursor";

const Index = () => {
  const [showIntro, setShowIntro] = useState(true);

  return (
    <>
      <CustomCursor />
      {showIntro ? (
        <CinematicIntro onComplete={() => setShowIntro(false)} />
      ) : (
        <Dashboard />
      )}
    </>
  );
};

export default Index;
