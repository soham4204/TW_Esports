import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ChevronRight } from 'lucide-react';

const TournamentCard = ({ tournament }) => {
    const navigate = useNavigate();

    // The card now serves as a clean entry point to the overview page
    return (
        <div 
            onClick={() => navigate(`/tournament/${tournament.id}`)}
            className="max-w-md mx-auto bg-slate-900 rounded-xl border border-slate-700 overflow-hidden shadow-lg mb-6 cursor-pointer hover:border-blue-500 transition-all hover:scale-[1.02] group"
        >
            <div className="relative">
                <img src={tournament.thumbnail} alt="Banner" className="w-full h-40 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                
                <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                    <div>
                        <h2 className="text-xl font-bold text-white leading-tight">{tournament.name}</h2>
                        <p className="text-blue-400 text-xs font-semibold uppercase mt-1 tracking-wider">
                            {tournament.type} Mode
                        </p>
                    </div>
                    <div className="bg-blue-600 p-2 rounded-full text-white shadow-lg group-hover:bg-blue-500 transition-colors">
                        <ChevronRight size={20} />
                    </div>
                </div>
            </div>
            
            <div className="px-4 py-3 bg-slate-800/50 flex justify-between items-center border-t border-slate-700">
                <div className="flex items-center gap-2 text-slate-300">
                    <Users size={16} className="text-blue-400" />
                    <span className="text-sm font-medium">{tournament.slots} Total Slots</span>
                </div>
                <span className="text-xs text-slate-500 italic">Click for full details</span>
            </div>
        </div>
    );
};

export default TournamentCard;