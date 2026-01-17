import { motion } from 'framer-motion';
import { useState } from 'react';

export const GlassCard = ({
  children,
  className = '',
  variant = 'default',
  hoverable = true,
  delay = 0
}) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!hoverable) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const variants = {
    default: 'bg-white/5 border-white/10',
    winner: 'bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-400/30',
    primary: 'bg-white/8 border-purple-300/20',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative rounded-2xl backdrop-blur-xl border
        ${variants[variant]}
        ${hoverable ? 'transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]' : ''}
        ${className}
      `}
      style={{
        boxShadow: isHovered && hoverable
          ? `0 0 40px rgba(147, 51, 234, 0.3), 0 0 80px rgba(59, 130, 246, 0.2)`
          : '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      }}
    >
      {hoverable && isHovered && (
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(147, 51, 234, 0.15), transparent 40%)`,
          }}
        />
      )}

      {variant === 'winner' && (
        <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-amber-400/20 via-orange-400/20 to-amber-400/20 blur-sm -z-10" />
      )}

      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};

export const GlassSectionTitle = ({ children, className = '' }) => {
  return (
    <motion.h2
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
      className={`text-3xl font-extralight tracking-[0.2em] text-white/90 uppercase mb-8 ${className}`}
      style={{ letterSpacing: '0.3em' }}
    >
      {children}
    </motion.h2>
  );
};

export const MetricDisplay = ({ label, value, trend, className = '' }) => {
  const getTrendColor = () => {
    if (!trend) return 'text-gray-400';
    if (trend === 'increasing' || trend === 'up') return 'text-emerald-400';
    if (trend === 'decreasing' || trend === 'down') return 'text-rose-400';
    return 'text-gray-400';
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <p className="text-xs uppercase tracking-[0.2em] text-white/50 font-light">
        {label}
      </p>
      <p className="text-4xl font-extralight text-white/95">
        {value}
      </p>
      {trend && (
        <p className={`text-sm font-light ${getTrendColor()}`}>
          {trend === 'increasing' || trend === 'up' ? '↗' : trend === 'decreasing' || trend === 'down' ? '↘' : '→'} {trend}
        </p>
      )}
    </div>
  );
};

export const FloatingBubble = ({ children, onClick, className = '', delay = 0 }) => {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.1, y: -5 }}
      whileTap={{ scale: 0.95 }}
      transition={{
        duration: 0.3,
        delay,
        type: 'spring',
        stiffness: 300,
      }}
      onClick={onClick}
      className={`
        px-6 py-3 rounded-full
        bg-white/10 backdrop-blur-md border border-white/20
        text-white/90 text-sm font-light tracking-wider
        hover:bg-white/20 hover:border-white/30
        transition-all duration-300
        ${className}
      `}
    >
      {children}
    </motion.button>
  );
};

export const ScanningText = ({ children, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, filter: 'blur(10px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)' }}
      transition={{ duration: 1, delay }}
      className="text-white/80 font-light leading-relaxed"
    >
      {children}
    </motion.div>
  );
};

export const BentoGridContainer = ({ children, className = '' }) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {children}
    </div>
  );
};

export const BentoGridItem = ({ children, span = 1, className = '', delay = 0 }) => {
  return (
    <div className={`md:col-span-${span} ${className}`}>
      <GlassCard delay={delay}>
        {children}
      </GlassCard>
    </div>
  );
};
