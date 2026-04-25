import React from 'react';
import Dashboard from '../apps/mobile/app/(tabs)/index';
import GoalsScreen from '../apps/mobile/app/(tabs)/goals';
import CalendarScreen from '../apps/mobile/app/(tabs)/calendar';
import ProfileScreen from '../apps/mobile/app/(tabs)/profile';
import ProgressScreen from '../apps/mobile/app/(tabs)/progress';
import CreateGoalScreen from '../apps/mobile/app/goals/create';
import GoalDetailsScreen from '../apps/mobile/app/goals/[id]';
import AuthScreen from '../apps/mobile/app/auth';
import { useNavigationStore } from './mocks/expo-router';
import { LayoutDashboard, Target, Calendar, User, BarChart2 } from 'lucide-react';
import { useAppBootstrap } from '../apps/mobile/src/hooks/useAppBootstrap';
import { useStore } from '../apps/mobile/src/store/useStore';

export default function App() {
  const { currentPath, navigate } = useNavigationStore();
  const user = useStore((state) => state.user);
  const isInitialized = useStore((state) => state.isInitialized);

  useAppBootstrap();

  const renderScreen = () => {
    if (!isInitialized) {
      return (
        <div className="flex h-full items-center justify-center bg-black">
          <span className="text-sm font-medium text-zinc-400">Loading...</span>
        </div>
      );
    }

    if (!user || currentPath === '/auth') return <AuthScreen />;
    if (currentPath === '/goals/create') return <CreateGoalScreen />;
    if (/^\/goals\/[^/]+$/.test(currentPath)) return <GoalDetailsScreen />;
    
    // Handle tab paths
    if (currentPath.includes('dashboard')) return <Dashboard />;
    if (currentPath.includes('goals')) return <GoalsScreen />;
    if (currentPath.includes('progress')) return <ProgressScreen />;
    if (currentPath.includes('calendar')) return <CalendarScreen />;
    if (currentPath.includes('profile')) return <ProfileScreen />;
    
    return <Dashboard />;
  };

  const activeTab = currentPath.includes('dashboard') ? 'dashboard' :
                    currentPath.includes('goals') ? 'goals' :
                    currentPath.includes('progress') ? 'progress' :
                    currentPath.includes('calendar') ? 'calendar' :
                    currentPath.includes('profile') ? 'profile' : 'dashboard';
  const showTabBar = isInitialized && !!user && currentPath.startsWith('/(tabs)/');

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      {/* Phone Frame */}
      <div className="relative w-[375px] h-[812px] bg-black rounded-[60px] shadow-2xl border-[8px] border-[#1a1a1a] overflow-hidden flex flex-col">
        {/* Status Bar */}
        <div className="h-12 flex items-center justify-between px-8 pt-4">
          <span className="text-white text-sm font-medium">9:41</span>
          <div className="flex gap-1.5">
            <div className="w-4 h-4 rounded-full border border-white/30" />
            <div className="w-4 h-4 rounded-full border border-white/30" />
            <div className="w-6 h-3 rounded-sm border border-white/30" />
          </div>
        </div>

        {/* Dynamic Island */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-32 h-8 bg-black rounded-full z-50" />

        {/* Screen Content */}
        <div className="flex-1 overflow-hidden">
          {renderScreen()}
        </div>

        {/* Tab Bar */}
        {showTabBar && (
        <div className="h-[84px] bg-black border-t border-[#222] flex items-center justify-around px-4 pb-6">
          <button 
            onClick={() => navigate('/(tabs)/dashboard')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'dashboard' ? 'text-[#A855F7]' : 'text-[#888]'}`}
          >
            <LayoutDashboard size={24} />
            <span className="text-[10px] font-medium">Dashboard</span>
          </button>
          <button 
            onClick={() => navigate('/(tabs)/goals')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'goals' ? 'text-[#A855F7]' : 'text-[#888]'}`}
          >
            <Target size={24} />
            <span className="text-[10px] font-medium">Goals</span>
          </button>
          <button 
            onClick={() => navigate('/(tabs)/progress')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'progress' ? 'text-[#A855F7]' : 'text-[#888]'}`}
          >
            <BarChart2 size={24} />
            <span className="text-[10px] font-medium">Progress</span>
          </button>
          <button 
            onClick={() => navigate('/(tabs)/calendar')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'calendar' ? 'text-[#A855F7]' : 'text-[#888]'}`}
          >
            <Calendar size={24} />
            <span className="text-[10px] font-medium">Planner</span>
          </button>
          <button 
            onClick={() => navigate('/(tabs)/profile')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'profile' ? 'text-[#A855F7]' : 'text-[#888]'}`}
          >
            <User size={24} />
            <span className="text-[10px] font-medium">Profile</span>
          </button>
        </div>
        )}

        {/* Home Indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full" />
      </div>

      {/* Info Panel */}
      <div className="hidden lg:flex flex-col ml-12 max-w-md gap-6">
        <div className="bg-[#111] p-8 rounded-3xl border border-[#222]">
          <h1 className="text-3xl font-bold text-white mb-4">Aura AI Planner</h1>
          <p className="text-[#888] leading-relaxed">
            A production-ready mobile foundation for an AI-powered goal management system. 
            This preview demonstrates the mobile-first UI and core architecture.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#111] p-6 rounded-2xl border border-[#222]">
            <h3 className="text-[#A855F7] font-bold mb-1">AI Managed</h3>
            <p className="text-xs text-[#888]">Structured plans generated by Gemini</p>
          </div>
          <div className="bg-[#111] p-6 rounded-2xl border border-[#222]">
            <h3 className="text-[#10B981] font-bold mb-1">Smart Tracking</h3>
            <p className="text-xs text-[#888]">Automatic deadline projection logic</p>
          </div>
        </div>
      </div>
    </div>
  );
}
