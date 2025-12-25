/**
 * Animation Variants for Framer Motion
 * Reusable animation patterns following Product Engineer approach
 */

// Page transitions
export const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

export const pageTransition = {
  duration: 0.3,
  ease: "easeOut",
}

// Stagger children (for lists)
export const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

export const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

// Modal/Dialog
export const modalVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
}

export const modalTransition = {
  duration: 0.2,
  ease: "easeOut",
}

// Card hover
export const cardHoverVariants = {
  rest: { y: 0 },
  hover: { y: -4 },
}

export const cardHoverTransition = {
  duration: 0.2,
  ease: "easeOut",
}

// Button tap
export const buttonTapVariants = {
  scale: 0.98,
}

// Spring physics for natural feel
export const springTransition = {
  type: "spring",
  stiffness: 400,
  damping: 17,
}

// Fade in from side
export const fadeInVariants = {
  left: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
  },
  right: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
  },
  up: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  },
  down: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
  },
}
