import { motion } from "framer-motion";

interface OnboardingDotsProps {
  total: number;
  current: number;
}

const OnboardingDots = ({ total, current }: OnboardingDotsProps) => (
  <div className="flex gap-2 justify-center mt-8">
    {Array.from({ length: total }).map((_, i) => (
      <motion.div
        key={i}
        className={`rounded-full ${i === current ? "bg-primary w-6 h-2.5" : "bg-muted-foreground/30 w-2.5 h-2.5"}`}
        layout
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    ))}
  </div>
);

export default OnboardingDots;
