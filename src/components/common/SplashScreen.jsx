import React, { useEffect, useState } from 'react';
import { useCompany } from '../../contexts/CompanyContext';

const SplashScreen = ({ onFinish }) => {
  const { profile, loading: profileLoading } = useCompany();
  const [fadeOut, setFadeOut] = useState(false);
  const [canFinish, setCanFinish] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4002';

  useEffect(() => {
    const timer = setTimeout(() => {
      setCanFinish(true);
    }, 3000); // 3 seconds to appreciate the logo

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (canFinish && !profileLoading) {
      setFadeOut(true);
      const timer = setTimeout(onFinish, 800);
      return () => clearTimeout(timer);
    }
  }, [canFinish, profileLoading, onFinish]);

  const appLogo = profile?.app_logo_url ? `${apiUrl}${profile.app_logo_url}` : null;

  return (
    <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white transition-opacity duration-1000 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
      <div className="w-full h-full flex items-center justify-center p-8 md:p-16 animate-in zoom-in-95 duration-1000">
        
        {appLogo ? (
          <div className="w-full max-w-[80vw] h-full max-h-[70vh] flex items-center justify-center">
            <img src={appLogo} alt="App Logo" className="w-full h-full object-contain drop-shadow-2xl" />
          </div>
        ) : (
          <div className="w-48 h-48 md:w-64 md:h-64 bg-primary-600 rounded-[4rem] flex items-center justify-center shadow-2xl shadow-primary-200 overflow-hidden">
             <span className="text-white text-8xl md:text-[12rem] font-black italic tracking-tighter">NC</span>
          </div>
        )}
        
      </div>
    </div>
  );
};

export default SplashScreen;
