import React from 'react';
import { motion } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import NurMascot from '../NurMascot/NurMascot';
import { useUserStore } from '../../store/userStore';

const LoginScreen = () => {
  const { setUser, setGuestMode } = useUserStore();

  const handleGoogleSuccess = (credentialResponse) => {
    try {
      const token = credentialResponse.credential;
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      setUser({
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
      });
    } catch (error) {
      console.error('Error parsing Google credential', error);
      // Fallback if parsing fails
      setGuestMode();
    }
  };

  const handleGoogleError = () => {
    console.error('Google Login Failed');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-[#F6F3E6] flex flex-col items-center justify-center p-6 text-center"
    >
      <div className="w-full max-w-sm flex flex-col items-center space-y-8 bg-white p-8 rounded-3xl shadow-xl border-b-[6px] border-slate-200">
        
        <NurMascot animateType="floating" size={150} />
        
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-slate-800">Istiqo</h1>
          <p className="text-sm font-bold text-slate-500">Mulai perjalanan Qurani kamu hari ini!</p>
        </div>

        <div className="w-full flex flex-col space-y-4 pt-4">
          <div className="w-full flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
              shape="pill"
              theme="outline"
              text="continue_with"
              width="300"
            />
          </div>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase tracking-wider">ATAU</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setGuestMode()}
            className="w-full py-3.5 bg-slate-100 text-slate-600 rounded-full font-bold border-2 border-b-4 border-slate-200 hover:bg-slate-200 transition-colors"
          >
            Coba Tanpa Login
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default LoginScreen;
