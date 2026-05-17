import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, CheckCircle2 } from 'lucide-react';
import { useUserStore, getUIString } from '../../store/userStore';

const C = {
  green: '#58CC02', greenDark: '#46A302',
  teal: '#37607D', tealDark: '#2A4B63',
  bg: '#F6F3E6',
  doneGreen: '#D7FFB1', doneBorder: '#218151',
};

const btn3d = 'border-2 border-b-[6px] rounded-2xl active:border-b-2 active:translate-y-[4px] transition-all select-none';

const Step3Notification = ({ onComplete }) => {
  const { preferredLanguage, notificationTime, setNotificationTime, completeOnboarding } = useUserStore();
  const s = (k) => getUIString(preferredLanguage, k);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const handleRequestPermission = async () => {
    if (!('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    setPermissionGranted(permission === 'granted');
  };

  const handleComplete = () => {
    completeOnboarding();
    onComplete();
  };

  return (
    <div className="w-full flex flex-col gap-5">
      {/* Card */}
      <div className="w-full bg-white rounded-3xl border-2 border-b-[6px] overflow-hidden p-6 flex flex-col gap-5" style={{ borderColor: C.tealDark }}>
        {/* Icon + title */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: C.doneGreen }}>
            <Bell className="w-7 h-7" style={{ color: C.doneBorder }} />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-black text-slate-800">{s('notification')}</h2>
            <p className="text-xs font-medium text-slate-400 mt-0.5">
              {preferredLanguage === 'en' ? 'Set your daily reminder' : 'Atur pengingat harian kamu'}
            </p>
          </div>
        </div>

        {/* Time label */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">
            {s('notificationTime')}
          </span>
          <input
            type="time"
            value={notificationTime}
            onChange={(e) => setNotificationTime(e.target.value)}
            className={`w-full text-2xl font-black text-center rounded-2xl border-2 border-b-[6px] px-4 py-3 focus:outline-none transition-all`}
            style={{ color: C.teal, borderColor: C.tealDark, backgroundColor: '#F6F3E6' }}
          />
        </div>

        {/* Notification permission button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleRequestPermission}
          disabled={permissionGranted}
          className={`w-full flex items-center justify-center gap-2 py-3.5 font-black text-sm rounded-2xl border-2 border-b-[6px] transition-all ${
            permissionGranted ? 'opacity-60 cursor-default' : ''
          }`}
          style={
            permissionGranted
              ? { backgroundColor: C.doneGreen, borderColor: C.doneBorder, color: C.doneBorder }
              : { backgroundColor: '#fff', borderColor: '#E5E7EB', color: C.teal }
          }
        >
          {permissionGranted
            ? <><CheckCircle2 className="w-4 h-4" /> {preferredLanguage === 'en' ? 'Notifications enabled' : 'Notifikasi diizinkan'}</>
            : <><Bell className="w-4 h-4" /> {s('notificationsPermission')}</>
          }
        </motion.button>
      </div>

      {/* CTA */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleComplete}
        className={`w-full py-4 font-black text-base text-white ${btn3d}`}
        style={{ backgroundColor: C.green, borderColor: C.greenDark }}
      >
        {s('startJourney')} →
      </motion.button>
    </div>
  );
};

export default Step3Notification;
