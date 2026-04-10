import iconChart from "@/assets/icons/icon-chart.png";
import iconWallet from "@/assets/icons/icon-wallet.png";
import iconSniper from "@/assets/icons/icon-sniper.png";
import iconAssets from "@/assets/icons/icon-assets.png";
import iconIntel from "@/assets/icons/icon-intel.png";
import iconTrade from "@/assets/icons/icon-trade.png";
import iconBrain from "@/assets/icons/icon-brain.png";
import iconShield from "@/assets/icons/icon-shield.png";
import iconBot from "@/assets/icons/icon-bot.png";
import iconUsers from "@/assets/icons/icon-users.png";

const iconMap = {
  chart: iconChart,
  wallet: iconWallet,
  sniper: iconSniper,
  assets: iconAssets,
  intel: iconIntel,
  trade: iconTrade,
  brain: iconBrain,
  shield: iconShield,
  bot: iconBot,
  users: iconUsers,
} as const;

export type Icon3DName = keyof typeof iconMap;

interface Icon3DProps {
  name: Icon3DName;
  size?: number;
  className?: string;
}

export const Icon3D = ({ name, size = 24, className = "" }: Icon3DProps) => {
  return (
    <img
      src={iconMap[name]}
      alt={name}
      width={size}
      height={size}
      loading="lazy"
      className={`inline-block object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  );
};
