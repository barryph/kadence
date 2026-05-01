import { motion, useMotionValue, useTransform, animate } from "motion/react";
import type { PanInfo } from "motion/react";
import { useRef, type ReactNode } from "react";
// TODO: Convert styles to css

const ACTION_THRESHOLD = 110;
const MAX_SWIPE = 110;

interface IProps {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  swipeLeftChild: ReactNode;
  swipeLeftColor: string;
  swipeLeftBackground: string;
  swipeRightChild: ReactNode;
  swipeRightColor: string;
  swipeRightBackground: string;
  children: ReactNode;
  queued: boolean | undefined;
}

export default function SwipeRow({
  onSwipeLeft,
  onSwipeRight,
  swipeLeftChild,
  swipeLeftColor,
  swipeLeftBackground,
  swipeRightChild,
  swipeRightColor,
  swipeRightBackground,
  children,
  queued,
}: IProps) {
  const x = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // background colors fade in
  const leftOpacity = useTransform(x, [-ACTION_THRESHOLD, 0], [1, 0]);
  const rightOpacity = useTransform(x, [0, ACTION_THRESHOLD], [0, 1]);

  function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    const finalX = info.offset.x;
    const backToCenter = () => animate(x, 0, { type: "spring", stiffness: 300, damping: 30 });

    if (finalX > ACTION_THRESHOLD) {
      // animate(x, MAX_SWIPE, { type: "spring", stiffness: 1000, damping: 30 })
      //   .then(() => {
      //     // animate(x, 0, { type: "spring", stiffness: 1000, damping: 30 });
      //   });
      // return;
      // Right swipe
      navigator.vibrate?.(10);
      onSwipeRight();
      backToCenter();
    } else if (finalX < -ACTION_THRESHOLD) {
      // Left swipe
      navigator.vibrate?.(10);
      onSwipeLeft();
      backToCenter();
    } else {
      // Snap back
      backToCenter();
    }
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        overflow: "hidden",
        touchAction: "pan-y", // keeps vertical scroll smooth
        width: '100%',
      }}
    >
      {/* SWIPE LEFT  */}
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          background: swipeLeftBackground,
          color: swipeLeftColor,
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          paddingRight: 20,
          opacity: leftOpacity,
          fontSize: '30px',
          marginTop: '-2px',
        }}
      >
        {swipeLeftChild}
      </motion.div>

      {/* SWIPE RIGHT */}
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          background: swipeRightBackground,
          color: swipeRightColor,
          display: "flex",
          alignItems: "center",
          paddingLeft: 20,
          opacity: rightOpacity,
          fontSize: '30px',
          marginTop: '-0px',
        }}
      >
        {swipeRightChild}
      </motion.div>

      {/* FOREGROUND */}
      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -MAX_SWIPE, right: MAX_SWIPE }}
        dragElastic={0.2} // Resistance feel
        style={{
          x,
          position: "relative",
          zIndex: 1,
        }}
        className={`activity-inner ${queued ? 'activity-inner--selected' : ''}`}
        onDragEnd={handleDragEnd}
      >
        {children}
      </motion.div>
    </div>
  );
}
