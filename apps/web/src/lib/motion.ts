import { type Variants, type Transition } from "framer-motion";

// Smooth & elegant timing
export const spring: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 25,
};

export const easeOut: Transition = {
  duration: 0.25,
  ease: [0.0, 0.0, 0.2, 1],
};

// Page fade (used by PageTransition)
export const pageFade: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.25, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.15, ease: "easeIn" } },
};

// Fade + slight slide up (cards appearing)
export const fadeSlideUp: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

// Scale in (modals, popovers)
export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: "easeOut" } },
};

// Stagger container — wraps children that each have staggerItem
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

// Stagger item (use with staggerContainer parent)
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};
