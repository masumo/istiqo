import React from 'react';
import { Trophy } from 'lucide-react';

const leagues = [
  { name: 'Pemula', color: 'text-slate-500 bg-slate-100' },
  { name: 'Mutawassit', color: 'text-blue-500 bg-blue-100' },
  { name: 'Mutaqadim', color: 'text-orange-500 bg-orange-100' },
  { name: 'Al-Huffaz', color: 'text-purple-500 bg-purple-100 font-bold' },
];

const LeagueBoard = ({ currentLeague = 'Pemula' }) => {
  const current = leagues.find((l) => l.name === currentLeague) || leagues[0];

  return (
    <div className={`flex items-center space-x-3 px-5 py-3 rounded-2xl border-2 border-slate-200 shadow-sm ${current.color}`}>
      <div className="p-2 bg-white rounded-full shadow-inner">
        <Trophy className="w-6 h-6 text-yellow-500" />
      </div>
      <div className="flex flex-col">
        <span className="text-xs uppercase tracking-widest font-bold opacity-70">League</span>
        <span className="text-lg leading-tight">{current.name}</span>
      </div>
    </div>
  );
};

export default LeagueBoard;
