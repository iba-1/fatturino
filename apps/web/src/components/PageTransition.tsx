import { motion } from "framer-motion";
import { pageFade } from "@/lib/motion";
import { useLocation } from "react-router-dom";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <motion.div
      key={location.pathname}
      variants={pageFade}
      initial="initial"
      animate="animate"
    >
      {children}
    </motion.div>
  );
}
