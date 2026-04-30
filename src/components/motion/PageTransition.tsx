import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { useLocation, useOutlet } from "react-router-dom";

export const PageTransition = () => {
  const outlet = useOutlet();
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      >
        {outlet}
      </motion.div>
    </AnimatePresence>
  );
};

export const StandalonePageTransition = ({ children }: { children: ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
);

