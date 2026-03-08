import { useState, useEffect } from 'react';
import { Shield, MapPin, AlertCircle, Users, Activity, Landmark, Building2, Plus, Trash2, Edit, X, Circle, Square, Layers, MousePointer2 } from 'lucide-react';
import adminSocket from './services/adminSocket';
import { MapContainer, TileLayer, CircleMarker, useMapEvents, useMap, Polygon } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const API_BASE = 'http://localhost:5001/api';

// ---- Reusable Modal ----
const Modal = ({ title, onClose, children }: any) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-slate-700 sticky top-0 bg-slate-800 z-10">
                <h3 className="text-xl font-bold text-white">{title}</h3>
                <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                    <X className="w-5 h-5 text-slate-400" />
                </button>
            </div>
            <div className="p-6">{children}</div>
        </div>
    </div>
);

// ---- Places Management Panel ----
const PlacesPanel = () => {
    const [places, setPlaces] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingPlace, setEditingPlace] = useState<any>(null);
    const [form, setForm] = useState({
        name: '', location: '', city: '', state: '', address: '',
        rating: '4.5', image: '', history: '', builtYear: '', builtBy: '',
        timings: '6:00 AM – 6:00 PM', entryFee: 'Free',
        distanceFromDelhi: '', routeFromDelhi: '', category: 'heritage',
        lat: '', lng: '',
    });

    useEffect(() => { fetchPlaces(); }, []);

    const fetchPlaces = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/places`);
            const data = await res.json();
            if (data.success) setPlaces(data.data);
        } catch (e) { } finally { setLoading(false); }
    };

    const openAdd = () => {
        setEditingPlace(null);
        setForm({ name: '', location: '', city: '', state: '', address: '', rating: '4.5', image: '', history: '', builtYear: '', builtBy: '', timings: '6:00 AM – 6:00 PM', entryFee: 'Free', distanceFromDelhi: '', routeFromDelhi: '', category: 'heritage', lat: '', lng: '' });
        setShowForm(true);
    };

    const openEdit = (place: any) => {
        setEditingPlace(place);
        setForm({
            name: place.name || '', location: place.location || '', city: place.city || '',
            state: place.state || '', address: place.address || '', rating: String(place.rating || 4.5),
            image: place.image || '', history: place.history || '', builtYear: place.builtYear || '',
            builtBy: place.builtBy || '', timings: place.timings || '6:00 AM – 6:00 PM',
            entryFee: place.entryFee || 'Free', distanceFromDelhi: place.distanceFromDelhi || '',
            routeFromDelhi: place.routeFromDelhi || '', category: place.category || 'heritage',
            lat: String(place.coordinates?.lat || ''), lng: String(place.coordinates?.lng || ''),
        });
        setShowForm(true);
    };

    const handleSubmit = async () => {
        const body = {
            ...form, rating: parseFloat(form.rating),
            coordinates: { lat: parseFloat(form.lat) || 0, lng: parseFloat(form.lng) || 0 },
        };
        try {
            const url = editingPlace ? `${API_BASE}/places/${editingPlace._id}` : `${API_BASE}/places`;
            const method = editingPlace ? 'PUT' : 'POST';
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            const data = await res.json();
            if (data.success) { setShowForm(false); fetchPlaces(); }
        } catch (e) { alert('Failed to save place'); }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this place?')) return;
        try {
            await fetch(`${API_BASE}/places/${id}`, { method: 'DELETE' });
            fetchPlaces();
        } catch (e) { }
    };

    const Field = ({ label, value, onChange, type = 'text', rows = 1 }: any) => (
        <div className="mb-4">
            <label className="block text-slate-400 text-xs font-bold uppercase mb-1">{label}</label>
            {rows > 1 ? (
                <textarea className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-red-500" value={value} onChange={e => onChange(e.target.value)} rows={rows} />
            ) : (
                <input type={type} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500" value={value} onChange={e => onChange(e.target.value)} />
            )}
        </div>
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-2xl font-bold text-white">Heritage & Famous Places</h3>
                    <p className="text-slate-400 text-sm mt-1">{places.length} places verified & listed</p>
                </div>
                <button onClick={openAdd} className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-lg shadow-red-900/30">
                    <Plus className="w-5 h-5" /> Add Place
                </button>
            </div>

            {loading ? (
                <div className="text-center py-20 text-slate-500">Loading places...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {places.map(place => (
                        <div key={place._id} className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden hover:border-slate-600 transition-colors group">
                            <div className="relative">
                                <img src={place.image} alt={place.name} className="w-full h-40 object-cover" onError={e => (e.currentTarget.src = 'https://placehold.co/400x200/1E293B/64748B?text=No+Image')} />
                                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openEdit(place)} className="bg-blue-600 hover:bg-blue-500 p-2 rounded-lg transition-colors"><Edit className="w-4 h-4 text-white" /></button>
                                    <button onClick={() => handleDelete(place._id)} className="bg-red-600 hover:bg-red-500 p-2 rounded-lg transition-colors"><Trash2 className="w-4 h-4 text-white" /></button>
                                </div>
                                <div className="absolute top-2 left-2 bg-slate-900/80 px-2 py-1 rounded-lg text-xs font-bold text-amber-400 uppercase">{place.category}</div>
                            </div>
                            <div className="p-4">
                                <div className="flex justify-between items-start">
                                    <h4 className="text-white font-bold text-lg leading-tight">{place.name}</h4>
                                    <span className="text-yellow-400 font-bold text-sm ml-2 shrink-0">⭐ {place.rating}</span>
                                </div>
                                <p className="text-slate-400 text-sm mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" />{place.location}</p>
                                <p className="text-slate-500 text-xs mt-2 line-clamp-2">{place.history}</p>
                                <div className="flex gap-2 mt-3">
                                    <span className="text-xs bg-slate-700 rounded px-2 py-1 text-slate-300">{place.entryFee}</span>
                                    <span className="text-xs bg-slate-700 rounded px-2 py-1 text-slate-300">{place.distanceFromDelhi}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showForm && (
                <Modal title={editingPlace ? 'Edit Place' : 'Add New Place'} onClose={() => setShowForm(false)}>
                    <Field label="Place Name *" value={form.name} onChange={(v: string) => setForm(f => ({ ...f, name: v }))} />
                    <Field label="Location (City, State)" value={form.location} onChange={(v: string) => setForm(f => ({ ...f, location: v }))} />
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="City *" value={form.city} onChange={(v: string) => setForm(f => ({ ...f, city: v }))} />
                        <Field label="State *" value={form.state} onChange={(v: string) => setForm(f => ({ ...f, state: v }))} />
                    </div>
                    <Field label="Full Address *" value={form.address} onChange={(v: string) => setForm(f => ({ ...f, address: v }))} rows={2} />
                    <Field label="Image URL *" value={form.image} onChange={(v: string) => setForm(f => ({ ...f, image: v }))} />
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Rating (0-5)" value={form.rating} onChange={(v: string) => setForm(f => ({ ...f, rating: v }))} type="number" />
                        <div className="mb-4">
                            <label className="block text-slate-400 text-xs font-bold uppercase mb-1">Category</label>
                            <select className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                                {['heritage', 'monument', 'temple', 'palace', 'natural', 'famous'].map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                    <Field label="History & Description *" value={form.history} onChange={(v: string) => setForm(f => ({ ...f, history: v }))} rows={4} />
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Built Year" value={form.builtYear} onChange={(v: string) => setForm(f => ({ ...f, builtYear: v }))} />
                        <Field label="Built By" value={form.builtBy} onChange={(v: string) => setForm(f => ({ ...f, builtBy: v }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Timings" value={form.timings} onChange={(v: string) => setForm(f => ({ ...f, timings: v }))} />
                        <Field label="Entry Fee" value={form.entryFee} onChange={(v: string) => setForm(f => ({ ...f, entryFee: v }))} />
                    </div>
                    <Field label="Distance from Delhi" value={form.distanceFromDelhi} onChange={(v: string) => setForm(f => ({ ...f, distanceFromDelhi: v }))} />
                    <Field label="Route from New Delhi" value={form.routeFromDelhi} onChange={(v: string) => setForm(f => ({ ...f, routeFromDelhi: v }))} rows={3} />
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Latitude" value={form.lat} onChange={(v: string) => setForm(f => ({ ...f, lat: v }))} type="number" />
                        <Field label="Longitude" value={form.lng} onChange={(v: string) => setForm(f => ({ ...f, lng: v }))} type="number" />
                    </div>
                    <button onClick={handleSubmit} className="w-full bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl font-bold transition-all mt-2">
                        {editingPlace ? 'Update Place' : 'Add Place'}
                    </button>
                </Modal>
            )}
        </div>
    );
};

// ---- Hotels Management Panel ----
const HotelsPanel = () => {
    const [hotels, setHotels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingHotel, setEditingHotel] = useState<any>(null);
    const [form, setForm] = useState({
        name: '', location: '', city: '', state: '', address: '',
        rating: '4.5', image: '', description: '', pricePerNight: '',
        phone: '', website: '', distanceFromDelhi: '', routeFromDelhi: '',
        category: 'luxury', checkIn: '2:00 PM', checkOut: '12:00 PM',
        amenities: '', lat: '', lng: '',
    });

    useEffect(() => { fetchHotels(); }, []);

    const fetchHotels = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/hotels`);
            const data = await res.json();
            if (data.success) setHotels(data.data);
        } catch (e) { } finally { setLoading(false); }
    };

    const openAdd = () => {
        setEditingHotel(null);
        setForm({ name: '', location: '', city: '', state: '', address: '', rating: '4.5', image: '', description: '', pricePerNight: '', phone: '', website: '', distanceFromDelhi: '', routeFromDelhi: '', category: 'luxury', checkIn: '2:00 PM', checkOut: '12:00 PM', amenities: '', lat: '', lng: '' });
        setShowForm(true);
    };

    const openEdit = (hotel: any) => {
        setEditingHotel(hotel);
        setForm({
            name: hotel.name || '', location: hotel.location || '', city: hotel.city || '',
            state: hotel.state || '', address: hotel.address || '', rating: String(hotel.rating || 4.5),
            image: hotel.image || '', description: hotel.description || '',
            pricePerNight: hotel.pricePerNight || '', phone: hotel.phone || '',
            website: hotel.website || '', distanceFromDelhi: hotel.distanceFromDelhi || '',
            routeFromDelhi: hotel.routeFromDelhi || '', category: hotel.category || 'luxury',
            checkIn: hotel.checkIn || '2:00 PM', checkOut: hotel.checkOut || '12:00 PM',
            amenities: (hotel.amenities || []).join(', '),
            lat: String(hotel.coordinates?.lat || ''), lng: String(hotel.coordinates?.lng || ''),
        });
        setShowForm(true);
    };

    const handleSubmit = async () => {
        const body = {
            ...form,
            rating: parseFloat(form.rating),
            amenities: form.amenities.split(',').map((a: string) => a.trim()).filter(Boolean),
            coordinates: { lat: parseFloat(form.lat) || 0, lng: parseFloat(form.lng) || 0 },
        };
        try {
            const url = editingHotel ? `${API_BASE}/hotels/${editingHotel._id}` : `${API_BASE}/hotels`;
            const method = editingHotel ? 'PUT' : 'POST';
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            const data = await res.json();
            if (data.success) { setShowForm(false); fetchHotels(); }
        } catch (e) { alert('Failed to save hotel'); }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this hotel?')) return;
        try {
            await fetch(`${API_BASE}/hotels/${id}`, { method: 'DELETE' });
            fetchHotels();
        } catch (e) { }
    };

    const categoryColors: Record<string, string> = { luxury: 'text-yellow-400', heritage: 'text-amber-400', budget: 'text-green-400', business: 'text-blue-400', boutique: 'text-purple-400' };

    const Field = ({ label, value, onChange, type = 'text', rows = 1 }: any) => (
        <div className="mb-4">
            <label className="block text-slate-400 text-xs font-bold uppercase mb-1">{label}</label>
            {rows > 1 ? (
                <textarea className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-emerald-500" value={value} onChange={e => onChange(e.target.value)} rows={rows} />
            ) : (
                <input type={type} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" value={value} onChange={e => onChange(e.target.value)} />
            )}
        </div>
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-2xl font-bold text-white">Verified Safe Hotels</h3>
                    <p className="text-slate-400 text-sm mt-1">{hotels.length} hotels admin-verified</p>
                </div>
                <button onClick={openAdd} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/30">
                    <Plus className="w-5 h-5" /> Add Hotel
                </button>
            </div>

            {loading ? (
                <div className="text-center py-20 text-slate-500">Loading hotels...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {hotels.map(hotel => (
                        <div key={hotel._id} className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden hover:border-slate-600 transition-colors group">
                            <div className="relative">
                                <img src={hotel.image} alt={hotel.name} className="w-full h-40 object-cover" onError={e => (e.currentTarget.src = 'https://placehold.co/400x200/1E293B/64748B?text=No+Image')} />
                                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openEdit(hotel)} className="bg-blue-600 hover:bg-blue-500 p-2 rounded-lg transition-colors"><Edit className="w-4 h-4 text-white" /></button>
                                    <button onClick={() => handleDelete(hotel._id)} className="bg-red-600 hover:bg-red-500 p-2 rounded-lg transition-colors"><Trash2 className="w-4 h-4 text-white" /></button>
                                </div>
                                <div className="absolute top-2 left-2">
                                    <span className={`bg-slate-900/80 px-2 py-1 rounded-lg text-xs font-bold uppercase ${categoryColors[hotel.category] || 'text-slate-400'}`}>{hotel.category}</span>
                                </div>
                                <div className="absolute bottom-2 right-2 bg-emerald-500/20 border border-emerald-500/40 px-2 py-1 rounded-lg">
                                    <span className="text-emerald-400 text-xs font-black">✓ VERIFIED</span>
                                </div>
                            </div>
                            <div className="p-4">
                                <div className="flex justify-between items-start">
                                    <h4 className="text-white font-bold text-lg leading-tight">{hotel.name}</h4>
                                    <span className="text-yellow-400 font-bold text-sm ml-2 shrink-0">⭐ {hotel.rating}</span>
                                </div>
                                <p className="text-slate-400 text-sm mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" />{hotel.location}</p>
                                <p className="text-emerald-400 font-bold mt-2">{hotel.pricePerNight}/night</p>
                                <p className="text-slate-500 text-xs mt-2 line-clamp-2">{hotel.description}</p>
                                {hotel.amenities?.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-3">
                                        {hotel.amenities.slice(0, 3).map((a: string, i: number) => (
                                            <span key={i} className="text-xs bg-slate-700 rounded px-2 py-1 text-slate-300">{a}</span>
                                        ))}
                                        {hotel.amenities.length > 3 && <span className="text-xs text-slate-500">+{hotel.amenities.length - 3}</span>}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showForm && (
                <Modal title={editingHotel ? 'Edit Hotel' : 'Add New Hotel'} onClose={() => setShowForm(false)}>
                    <Field label="Hotel Name *" value={form.name} onChange={(v: string) => setForm(f => ({ ...f, name: v }))} />
                    <Field label="Location (City, State)" value={form.location} onChange={(v: string) => setForm(f => ({ ...f, location: v }))} />
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="City *" value={form.city} onChange={(v: string) => setForm(f => ({ ...f, city: v }))} />
                        <Field label="State *" value={form.state} onChange={(v: string) => setForm(f => ({ ...f, state: v }))} />
                    </div>
                    <Field label="Full Address *" value={form.address} onChange={(v: string) => setForm(f => ({ ...f, address: v }))} rows={2} />
                    <Field label="Image URL *" value={form.image} onChange={(v: string) => setForm(f => ({ ...f, image: v }))} />
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Price Per Night *" value={form.pricePerNight} onChange={(v: string) => setForm(f => ({ ...f, pricePerNight: v }))} />
                        <Field label="Rating (0-5)" value={form.rating} onChange={(v: string) => setForm(f => ({ ...f, rating: v }))} type="number" />
                    </div>
                    <div className="mb-4">
                        <label className="block text-slate-400 text-xs font-bold uppercase mb-1">Category</label>
                        <select className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                            {['luxury', 'budget', 'heritage', 'business', 'boutique'].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <Field label="Description *" value={form.description} onChange={(v: string) => setForm(f => ({ ...f, description: v }))} rows={3} />
                    <Field label="Amenities (comma-separated)" value={form.amenities} onChange={(v: string) => setForm(f => ({ ...f, amenities: v }))} rows={2} />
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Check In" value={form.checkIn} onChange={(v: string) => setForm(f => ({ ...f, checkIn: v }))} />
                        <Field label="Check Out" value={form.checkOut} onChange={(v: string) => setForm(f => ({ ...f, checkOut: v }))} />
                    </div>
                    <Field label="Phone" value={form.phone} onChange={(v: string) => setForm(f => ({ ...f, phone: v }))} />
                    <Field label="Distance from Delhi" value={form.distanceFromDelhi} onChange={(v: string) => setForm(f => ({ ...f, distanceFromDelhi: v }))} />
                    <Field label="Route from New Delhi" value={form.routeFromDelhi} onChange={(v: string) => setForm(f => ({ ...f, routeFromDelhi: v }))} rows={3} />
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Latitude" value={form.lat} onChange={(v: string) => setForm(f => ({ ...f, lat: v }))} type="number" />
                        <Field label="Longitude" value={form.lng} onChange={(v: string) => setForm(f => ({ ...f, lng: v }))} type="number" />
                    </div>
                    <button onClick={handleSubmit} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold transition-all mt-2">
                        {editingHotel ? 'Update Hotel' : 'Add Hotel'}
                    </button>
                </Modal>
            )}
        </div>
    );
};

// ---- GeoZones / Danger Zones Panel ----
const GeoZonesPanel = () => {
    const [zones, setZones] = useState<any[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingZone, setEditingZone] = useState<any>(null);
    const [points, setPoints] = useState<[number, number][]>([]);
    const [mapType, setMapType] = useState<'streets' | 'satellite'>('streets');
    const [drawMode, setDrawMode] = useState<'polygon' | 'circle' | 'square'>('polygon');
    const [form, setForm] = useState({
        name: '', description: '', type: 'danger'
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [mapCenter, setMapCenter] = useState<[number, number]>([28.6139, 77.2090]);

    useEffect(() => { fetchZones(); }, []);

    const fetchZones = async () => {
        try {
            const res = await fetch(`${API_BASE}/geo`);
            const data = await res.json();
            if (data.success) setZones(data.data);
        } catch (e) { }
    };

    const handleSearch = async () => {
        if (!searchQuery) return;
        let q = searchQuery;
        // If it looks like a 6-digit Indian pincode, append India for better results
        if (/^\d{6}$/.test(searchQuery.trim())) {
            q = `${searchQuery.trim()}, India`;
        }
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`, {
                headers: {
                    'User-Agent': 'TouristSafety-Admin-Dashboard/1.0'
                }
            });
            const data = await res.json();
            if (data && data.length > 0) {
                setMapCenter([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
            } else {
                alert('Location not found. Try adding more details like city or district.');
            }
        } catch (e) {
            console.error('Search error:', e);
            alert('Search failed. Please try again.');
        }
    };

    const openAdd = () => {
        setEditingZone(null);
        setPoints([]);
        setForm({ name: '', description: '', type: 'danger' });
        setShowForm(true);
    };

    const openEdit = (zone: any) => {
        setEditingZone(zone);
        const zPoints = zone.geometry?.coordinates?.[0]?.map((c: any) => [c[1], c[0]]) || [];
        setPoints(zPoints);
        setForm({
            name: zone.name || '',
            description: zone.description || '',
            type: zone.type || 'danger'
        });
        if (zPoints.length > 0) setMapCenter(zPoints[0]);
        setShowForm(true);
    };

    const handleSubmit = async () => {
        if (!form.name.trim()) {
            alert('Please provide a name for the zone.');
            return;
        }
        if (points.length < 3) {
            alert('Please mark at least 3 points on the map to define the area.');
            return;
        }

        // Ensure polygon is closed for GeoJSON
        const closedPoints = [...points];
        if (closedPoints[0][0] !== closedPoints[closedPoints.length - 1][0] ||
            closedPoints[0][1] !== closedPoints[closedPoints.length - 1][1]) {
            closedPoints.push(closedPoints[0]);
        }

        const body = {
            ...form,
            coordinates: [closedPoints.map(p => [p[1], p[0]])], // GeoJSON is [lng, lat]
            severity: form.type === 'danger' ? 90 : 50
        };

        try {
            const url = editingZone ? `${API_BASE}/geo/${editingZone._id}` : `${API_BASE}/geo`;
            const method = editingZone ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (data.success) {
                setShowForm(false);
                fetchZones();
            } else {
                alert(data.message || 'Failed to save zone');
            }
        } catch (e) {
            alert('Failed to save zone. Please ensure the shape is valid and lines do not cross.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this zone?')) return;
        try {
            await fetch(`${API_BASE}/geo/${id}`, { method: 'DELETE' });
            fetchZones();
        } catch (e) { }
    };

    const addPoint = (lat: number, lng: number) => {
        if (drawMode === 'polygon') {
            setPoints(prev => [...prev, [lat, lng]]);
        } else if (drawMode === 'circle') {
            // Generate 32 points for a 500m radius circle
            const circlePoints: [number, number][] = [];
            for (let i = 0; i < 32; i++) {
                const angle = (i * 360) / 32;
                const rad = (angle * Math.PI) / 180;
                const pLat = lat + (0.5 / 111.32) * Math.cos(rad);
                const pLng = lng + (0.5 / (111.32 * Math.cos(lat * Math.PI / 180))) * Math.sin(rad);
                circlePoints.push([pLat, pLng]);
            }
            setPoints(circlePoints);
        } else if (drawMode === 'square') {
            // Generate 4 points for a 1km square
            const d = 0.5; // half size
            const latDiff = d / 111.32;
            const lngDiff = d / (111.32 * Math.cos(lat * Math.PI / 180));
            setPoints([
                [lat - latDiff, lng - lngDiff],
                [lat - latDiff, lng + lngDiff],
                [lat + latDiff, lng + lngDiff],
                [lat + latDiff, lng - lngDiff]
            ]);
        }
    };

    const clearPoints = () => setPoints([]);
    const undoLastPoint = () => setPoints(prev => prev.slice(0, -1));

    const Field = ({ label, value, onChange, type = 'text', rows = 1 }: any) => (
        <div className="mb-4">
            <label className="block text-slate-400 text-xs font-bold uppercase mb-1">{label}</label>
            {rows > 1 ? (
                <textarea className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500" value={value} onChange={e => onChange(e.target.value)} rows={rows} />
            ) : (
                <input type={type} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500" value={value} onChange={e => onChange(e.target.value)} />
            )}
        </div>
    );

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-2xl font-bold text-white">Geo-Fence Manager</h3>
                    <p className="text-slate-400 text-sm mt-1">{zones.length} zones defined</p>
                </div>
                {!showForm && (
                    <button onClick={openAdd} className="bg-red-600 hover:bg-red-500 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2">
                        <Plus className="w-5 h-5" /> Start Marking Zone
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1">
                {/* Information & List Panel */}
                <div className="lg:col-span-1 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    {showForm ? (
                        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 border-t-4 border-t-red-500 shadow-xl">
                            <h4 className="text-white font-bold mb-4">{editingZone ? 'Update Zone' : 'New Zone Details'}</h4>
                            <Field label="Zone Name" value={form.name} onChange={(v: string) => setForm(f => ({ ...f, name: v }))} />
                            <div className="mb-4">
                                <label className="block text-slate-400 text-xs font-bold uppercase mb-1">Type</label>
                                <select className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                                    <option value="danger">Danger (High Risk)</option>
                                    <option value="restricted">Restricted (No Entry)</option>
                                </select>
                            </div>
                            <Field label="Notes" value={form.description} onChange={(v: string) => setForm(f => ({ ...f, description: v }))} rows={3} />

                            <div className="bg-slate-900 p-3 rounded-xl mb-4 border border-slate-700">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs text-slate-500 font-bold uppercase">Marked Points</span>
                                    <div className="flex gap-2">
                                        <button onClick={undoLastPoint} title="Undo last point" className="text-[10px] bg-slate-700 hover:bg-slate-600 px-2 py-0.5 rounded text-white">Undo</button>
                                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">{points.length}</span>
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-400 italic">Click on the map to define vertices. Minimum 3 points required.</p>
                            </div>

                            <button onClick={handleSubmit} className="w-full bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl font-bold transition-all mb-2">
                                {editingZone ? 'Apply Updates' : 'Save Geo-Fence'}
                            </button>
                            <button onClick={() => setShowForm(false)} className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 py-3 rounded-xl font-bold transition-all">
                                Cancel
                            </button>
                        </div>
                    ) : (
                        zones.map(zone => (
                            <div key={zone._id} className={`bg-slate-800 border-l-4 rounded-xl p-4 border border-slate-700 ${zone.type === 'danger' ? 'border-l-red-500' : 'border-l-amber-500'}`}>
                                <h5 className="text-white font-bold">{zone.name}</h5>
                                <p className="text-slate-400 text-xs mt-1">{zone.description}</p>
                                <div className="flex gap-2 mt-4">
                                    <button onClick={() => openEdit(zone)} className="bg-blue-600 hover:bg-blue-500 p-2 rounded-lg"><Edit className="w-4 h-4 text-white" /></button>
                                    <button onClick={() => handleDelete(zone._id)} className="bg-red-600 hover:bg-red-500 p-2 rounded-lg"><Trash2 className="w-4 h-4 text-white" /></button>
                                    <button onClick={() => setMapCenter(zone.geometry.coordinates[0][0].reverse())} className="text-xs text-slate-500 ml-auto hover:text-white underline">Find on Map</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Interactive Map Panel */}
                <div className="lg:col-span-3 bg-slate-800 rounded-3xl overflow-hidden border-2 border-slate-700 relative shadow-2xl z-0 group">
                    {/* Floating Toolbar */}
                    <div className="absolute top-4 left-4 z-[1000] right-4 flex gap-3 pointer-events-none">
                        <div className="flex-1 flex gap-2 pointer-events-auto">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    placeholder="Search location (Address, Pincode)..."
                                    className="w-full bg-slate-900/80 border border-slate-700/50 rounded-2xl px-5 py-3 text-white text-sm backdrop-blur-xl shadow-2xl focus:outline-none focus:border-red-500/50"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <button onClick={handleSearch} className="bg-red-600 hover:bg-red-500 text-white px-4 py-1.5 rounded-xl font-bold text-xs transition-all">Go</button>
                                </div>
                            </div>
                        </div>

                        {showForm && (
                            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-1.5 flex gap-1 pointer-events-auto shadow-2xl">
                                {[
                                    { id: 'polygon', icon: MousePointer2, label: 'Line' },
                                    { id: 'circle', icon: Circle, label: 'Circle' },
                                    { id: 'square', icon: Square, label: 'Square' }
                                ].map(tool => (
                                    <button
                                        key={tool.id}
                                        onClick={() => { setDrawMode(tool.id as any); setPoints([]); }}
                                        className={`p-2.5 rounded-xl transition-all flex items-center gap-2 ${drawMode === tool.id ? 'bg-red-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
                                        title={tool.label}
                                    >
                                        <tool.icon className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-tighter">{tool.label}</span>
                                    </button>
                                ))}
                                <div className="w-px bg-slate-700 mx-1 my-1" />
                                <button onClick={clearPoints} className="px-3 text-[10px] font-black text-amber-500 hover:bg-slate-800 rounded-xl uppercase tracking-tighter">Reset</button>
                            </div>
                        )}

                        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-1.5 flex gap-1 pointer-events-auto shadow-2xl ml-auto">
                            <button
                                onClick={() => setMapType(mapType === 'streets' ? 'satellite' : 'streets')}
                                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center gap-2 border border-slate-700/50"
                            >
                                <Layers className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-tighter">{mapType === 'streets' ? 'Satellite' : 'Street'}</span>
                            </button>
                        </div>
                    </div>

                    <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                        <MapUpdater center={mapCenter} />
                        {mapType === 'streets' ? (
                            <TileLayer key="streets" url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                        ) : (
                            <TileLayer key="satellite" url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="&copy; Esri" />
                        )}

                        {/* Render existing zones */}
                        {zones.map(zone => {
                            if (!zone.geometry?.coordinates?.[0]) return null;
                            const coords = zone.geometry.coordinates[0].map((c: any) => [c[1], c[0]]);
                            const color = zone.type === 'danger' ? '#EF4444' : '#F59E0B';
                            return <Polygon key={zone._id} positions={coords} pathOptions={{ color, fillColor: color, fillOpacity: 0.4 }} />;
                        })}

                        {/* Render preview for current drawing */}
                        {points.length > 1 && (
                            <Polygon
                                key={`drawing-${points.length}-${drawMode}`}
                                positions={points}
                                pathOptions={{
                                    color: '#3B82F6',
                                    dashArray: '5, 5',
                                    fillColor: '#3B82F6',
                                    fillOpacity: 0.3,
                                    weight: 4
                                }}
                            />
                        )}

                        {/* Render points/markers for drawing */}
                        {drawMode === 'polygon' ? (
                            points.map((p, i) => (
                                <CircleMarker key={i} center={p} radius={5} pathOptions={{ color: 'white', fillColor: '#3B82F6', fillOpacity: 1, weight: 2 }} />
                            ))
                        ) : (
                            points.length > 0 && <CircleMarker center={[points[0][0], points[0][1]]} radius={6} pathOptions={{ color: 'white', fillColor: '#10B981', fillOpacity: 1 }} />
                        )}

                        {/* Capture clicks */}
                        {showForm && (
                            <CaptureMapClicks key={drawMode} onAddPoint={addPoint} />
                        )}
                    </MapContainer>
                </div>
            </div>
        </div>
    );
};

const CaptureMapClicks = ({ onAddPoint }: { onAddPoint: (lat: number, lng: number) => void }) => {
    useMapEvents({
        click(e) {
            onAddPoint(e.latlng.lat, e.latlng.lng);
        }
    });
    return null;
};

// Map Updater component
const MapUpdater = ({ center }: { center: [number, number] }) => {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, 14);
    }, [center, map]);
    return null;
};

// ---- Main Admin Dashboard ----
const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [sosAlerts, setSosAlerts] = useState<any[]>([]);
    const [touristUpdates, setTouristUpdates] = useState<any[]>([]);

    useEffect(() => {
        const socket = adminSocket.connect();

        adminSocket.onEmergencySOS((data) => {
            setSosAlerts((prev) => [data, ...prev]);
        });

        adminSocket.onTouristUpdate((data) => {
            setTouristUpdates((prev) => {
                const index = prev.findIndex(t => t.id === data.id);
                if (index > -1) {
                    const newUpdates = [...prev];
                    newUpdates[index] = data;
                    return newUpdates;
                }
                return [data, ...prev].slice(0, 50);
            });
        });

        return () => { adminSocket.disconnect(); };
    }, []);

    const navItems = [
        { id: 'overview', icon: Activity, label: 'Live Overview' },
        { id: 'places', icon: Landmark, label: 'Heritage Places' },
        { id: 'hotels', icon: Building2, label: 'Safe Hotels' },
        { id: 'map', icon: MapPin, label: 'Safe Map' },
        { id: 'incidents', icon: AlertCircle, label: 'Incidents' },
        { id: 'tourists', icon: Users, label: 'Active Tourists' },
    ];

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
            {/* Sidebar */}
            <div className="fixed left-0 top-0 h-full w-64 bg-slate-800 border-r border-slate-700 p-6 flex flex-col">
                <div className="flex items-center gap-3 mb-10">
                    <Shield className="text-red-500 w-8 h-8" />
                    <h1 className="text-xl font-bold tracking-tight text-white">SAFETY COMMAND</h1>
                </div>

                <nav className="space-y-2 flex-1">
                    {navItems.map((item) => (
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

                <div className="mt-auto pt-4 border-t border-slate-700">
                    <div className="flex items-center gap-2 px-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-xs text-slate-400 font-medium">AEGIS AI ONLINE</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="ml-64 p-8">
                {activeTab === 'overview' && (
                    <>
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

                        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
                            <h3 className="text-xl font-bold text-white mb-6">Real-time Safety Feed</h3>
                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
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
                    </>
                )}

                {activeTab === 'places' && <PlacesPanel />}
                {activeTab === 'hotels' && <HotelsPanel />}

                {activeTab === 'map' && <GeoZonesPanel />}

                {(activeTab === 'incidents' || activeTab === 'tourists') && (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="text-slate-500 text-6xl mb-4">🚧</div>
                            <h3 className="text-2xl font-bold text-white mb-2">Coming Soon</h3>
                            <p className="text-slate-400">This section is under development.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
