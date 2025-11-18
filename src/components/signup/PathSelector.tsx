import { GraduationCap, Briefcase } from "lucide-react";
import { Card } from "@/components/ui/card";

interface PathSelectorProps {
  onSelect: (path: "student" | "investor") => void;
}

export const PathSelector = ({ onSelect }: PathSelectorProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-6xl">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Choose Your Path
          </h1>
          <p className="text-lg text-muted-foreground">
            Select the journey that aligns with your goals
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Student Path */}
          <Card
            onClick={() => onSelect("student")}
            className="group relative overflow-hidden cursor-pointer transition-all duration-500 hover:scale-105 hover:shadow-2xl bg-card/50 backdrop-blur-sm border-2 hover:border-primary p-8"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative z-10">
              <div className="mb-6 flex justify-center">
                <div className="p-6 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                  <GraduationCap className="w-16 h-16 text-primary" />
                </div>
              </div>
              
              <h2 className="text-3xl font-bold mb-3 text-center">Student</h2>
              <p className="text-center text-muted-foreground mb-6">
                Learn. Trade. Become Elite.
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span>Access premium trading courses</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span>Live mentorship sessions</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span>Demo trading accounts</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span>Community access</span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <button className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors">
                  Start Learning →
                </button>
              </div>
            </div>
          </Card>

          {/* Investor Path */}
          <Card
            onClick={() => onSelect("investor")}
            className="group relative overflow-hidden cursor-pointer transition-all duration-500 hover:scale-105 hover:shadow-2xl bg-card/50 backdrop-blur-sm border-2 hover:border-accent p-8"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative z-10">
              <div className="mb-6 flex justify-center">
                <div className="p-6 rounded-full bg-accent/10 group-hover:bg-accent/20 transition-colors duration-300">
                  <Briefcase className="w-16 h-16 text-accent" />
                </div>
              </div>
              
              <h2 className="text-3xl font-bold mb-3 text-center">Investor</h2>
              <p className="text-center text-muted-foreground mb-6">
                Fund. Partner. Earn Returns.
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-accent" />
                  <span>Exclusive investment opportunities</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-accent" />
                  <span>Priority trading insights</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-accent" />
                  <span>Direct partnership options</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-accent" />
                  <span>Premium support</span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <button className="w-full py-3 rounded-lg bg-accent text-accent-foreground font-semibold hover:bg-accent/90 transition-colors">
                  Start Investing →
                </button>
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Encrypted. Secure. Private.</p>
        </div>
      </div>
    </div>
  );
};