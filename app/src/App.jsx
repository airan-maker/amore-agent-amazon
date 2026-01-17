import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AIAgentDashboard } from './pages/AIAgentDashboard';
import { AIMarketAnalysis } from './pages/AIMarketAnalysis';
import { LaneigeAIAgent } from './pages/LaneigeAIAgent';
import { BarChart3, Package, Home, Bot } from 'lucide-react';
import { motion } from 'framer-motion';

const Navigation = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Package, label: 'Market Analysis' },
    { path: '/dashboard', icon: Home, label: 'Brand Intelligence' },
    { path: '/ai-agent', icon: Bot, label: 'Q&A AI Agent' },
  ];

  return (
    <nav className="fixed top-8 left-1/2 -translate-x-1/2 z-50">
      <div className="flex gap-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full p-2">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <Link key={path} to={path}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-white/50 hover:text-white/80'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-light tracking-wider">{label}</span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Navigation />
      <div className="pt-24">
        <Routes>
          <Route path="/" element={<AIMarketAnalysis />} />
          <Route path="/dashboard" element={<AIAgentDashboard />} />
          <Route path="/ai-agent" element={<LaneigeAIAgent />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
