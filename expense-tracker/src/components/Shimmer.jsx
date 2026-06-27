/**
 * Shimmer — premium loading skeleton with animated gradient sweep.
 * Usage: <Shimmer className="w-full h-4 rounded-xl" />
 */
export default function Shimmer({ className = "", style = {} }) {
  return (
    <div
      className={`shimmer-box ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}
