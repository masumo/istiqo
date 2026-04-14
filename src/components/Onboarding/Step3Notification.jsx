import React, { useState } from 'react';
import { useUserStore } from '../../store/userStore';
import { getTranslation } from '../../utils/i18n';
import { Bell } from 'lucide-react';

const Step3Notification = ({ onComplete }) => {
  const { preferredLanguage, notificationTime, setNotificationTime, completeOnboarding } = useUserStore();
  const t = (key) => getTranslation(preferredLanguage, key);
  const [permissionRequested, setPermissionRequested] = useState(false);

  const handleRequestPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setPermissionRequested(true);
      if (permission === 'granted') {
        console.log('Notification permission granted.');
      }
    } else {
      alert('Your browser does not support notifications.');
    }
  };

  const handleComplete = () => {
    completeOnboarding();
    onComplete();
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-8 h-full">
      <h2 className="text-3xl font-bold text-slate-800 text-center">{t('notification')}</h2>
      
      <div className="flex flex-col w-full max-w-md space-y-8 items-center bg-white p-8 rounded-3xl border-4 border-slate-100 shadow-sm">
        <div className="bg-emerald-100 p-4 rounded-full">
          <Bell className="w-12 h-12 text-emerald-600" />
        </div>
        
        <div className="flex flex-col items-center space-y-4 w-full">
          <label className="text-xl font-bold text-slate-700">{t('notificationTime')}</label>
          <input
            type="time"
            value={notificationTime}
            onChange={(e) => setNotificationTime(e.target.value)}
            className="text-4xl font-bold text-emerald-600 bg-emerald-50 border-4 border-emerald-200 p-4 rounded-2xl w-full text-center focus:outline-none focus:border-emerald-500"
          />
        </div>

        <button
          onClick={handleRequestPermission}
          className={`w-full py-4 px-6 rounded-2xl font-bold transition-all border-4 ${
            permissionRequested 
              ? 'bg-slate-50 border-slate-200 text-slate-400' 
              : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50'
          }`}
        >
          {t('notificationsPermission')}
        </button>
      </div>

      <button
        onClick={handleComplete}
        className="w-full max-w-md py-4 bg-emerald-600 text-white rounded-2xl font-bold text-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
      >
        {t('startJourney')}
      </button>
    </div>
  );
};

export default Step3Notification;
