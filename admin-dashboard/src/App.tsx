import React, { useState, useEffect } from 'react';
import { Shield, MapPin, AlertCircle, Users, Activity, ExternalLink } from 'lucide-react';
import adminSocket from './services/adminSocket';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [sosAlerts, setSosAlerts] = useState<any[]>([]);
    const [touristUpdates, setTouristUpdates] = useState<any[]>([]);

    useEffect(() => {
        const socket = adminSocket.connect();

        adminSocket.onEmergencySOS((data) => {
            setSosAlerts((prev) => [data, ...prev]);
            // Play alert sound or trigger notification
        });

        adminSocket.onTouristUpdate((data) => {
            setTouristUpdates((prev) => {
                const index = prev.findIndex(t => t.id === data.id);
                if (index > -1) {
                    const newUpdates = [...prev];
                    newUpdates[index] = data;
                    return newUpdates;
                }
                return [data, ...prev].slice(0, 50); // Keep last 50
            });
        });

        return () => {
            adminSocket.disconnect();
        };
    }, []);

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
            {/* Sidebar */}
            <div className="fixed left-0 top-0 h-full w-64 bg-slate-800 border-r border-slate-700 p-6">
                <div className="flex items-center gap-3 mb-10">
                    <Shield className="text-red-500 w-8 h-8" />
                    <h1 className="text-xl font-bold tracking-tight text-white">SAFETY COMMAND</h1>
                </div>

                <nav className="space-y-2">
                    {[
                        { id: 'overview', icon: Activity, label: 'Live Overview' },
                        { id: 'map', icon: MapPin, label: 'Safe Map' },
                        { id: 'incidents', icon: AlertCircle, label: 'Recent Incidents' },
                        { id: 'tourists', icon: Users, label: 'Active Tourists' },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === item.id
                                    ? 'bg-red-500/10 text-red-500 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                                    : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                                }`}
                        >
                            <item.icon className="w-5 h-5" />
                            <span className="font-medium">{item.label}</span>
                        </button>
                    ))}
                </nav>
            </div>

            {/* Main Content */}
            <div className="ml-64 p-8">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-2">System Health</h2>
                        <p className="text-slate-400">Monitoring {touristUpdates.length} tourists in real-time.</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-slate-800 border border-slate-700 rounded-xl px-6 py-3 flex items-center gap-3">
                            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                            <span className="text-sm font-semibold">AEGIS AI ONLINE</span>
                        </div>
                        <button className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-red-900/20 active:scale-95">
                            BROADCAST ALERT
                        </button>
                    </div>
                </header>

                {/* SOS Alerts Section */}
                {sosAlerts.length > 0 && (
                    <div className="mb-10 space-y-4">
                        <h3 className="text-red-500 font-black text-xs tracking-[0.2em] mb-4 uppercase">Critical SOS Alerts</h3>
                        {sosAlerts.map((sos, i) => (
                            <div key={i} className="bg-red-500/10 border-2 border-red-500 p-6 rounded-2xl flex justify-between items-center animate-pulse">
                                <div className="flex items-center gap-4">
                                    <div className="bg-red-500 p-3 rounded-full">
                                        <AlertCircle className="text-white w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-black text-white">EMERGENCY SOS: {sos.id}</h4>
                                        <p className="text-red-300 font-medium">Location: {sos.lat}, {sos.lng} | {new Date(sos.timestamp).toLocaleTimeString()}</p>
                                    </div>
                                </div>
                                <button className="bg-white text-red-600 px-6 py-3 rounded-xl font-black hover:bg-slate-100 transition-colors">
                                    DISPATCH UNIT
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    {[
                        { label: 'Active SOS', value: sosAlerts.length.toString(), color: 'text-red-500', bg: 'bg-red-500/10' },
                        { label: 'Active Tourists', value: touristUpdates.length.toString(), color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                        { label: 'AI Risk Level', value: 'Low', color: 'text-blue-500', bg: 'bg-blue-500/10' },
                        { label: 'Zone Status', value: 'Normal', color: 'text-amber-500', bg: 'bg-amber-500/10' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-slate-800 border border-slate-700 p-6 rounded-2xl">
                            <p className="text-slate-400 text-sm font-medium mb-1">{stat.label}</p>
                            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Live Feed */}
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-white mb-6">Real-time Safety Feed</h3>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {touristUpdates.length === 0 && (
                            <p className="text-slate-500 italic text-center py-10">No active location streams detected...</p>
                        )}
                        {touristUpdates.map((update, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-slate-900/50 border border-slate-700/50 hover:border-slate-600 transition-colors">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${update.isSafe ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                                    <Activity className={`w-5 h-5 ${update.isSafe ? 'text-emerald-500' : 'text-red-500'}`} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-slate-200 font-semibold">Tourist #{update.id.slice(-4)}</h4>
                                    <p className="text-slate-500 text-sm">Coordinates: {update.lat.toFixed(4)}, {update.lng.toFixed(4)}</p>
                                </div>
                                <div className="text-right">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${update.isSafe ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                                        {update.isSafe ? 'SAFE' : 'RISK AREA'}
                                    </span>
                                    <p className="text-slate-600 text-[10px] mt-1 font-mono">{new Date().toLocaleTimeString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
