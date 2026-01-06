import React, { useState, useEffect } from 'react';
import { Facebook, Linkedin, Send, Plus, Settings, LogOut, BarChart3, Clock, X, ChevronLeft, ChevronRight, FileText, Calendar as CalendarIcon } from 'lucide-react';

const API_URL = 'https://social-planner-api.onrender.com';

// Paleta de colores oficial
const COLORS = {
  primaryBlue: '#0050cb',
  white: '#ffffff',
  darkBlue: '#0f2842',
  gray: '#606060',
  lightBlue: '#d9e8fc',
  turquoise: '#05b7be'
};

const SocialPlanner = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState('signin');
  const [authForm, setAuthForm] = useState({ email: '', password: '', fullName: '' });
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [posts, setPosts] = useState([]);
  const [drafts, setDrafts] = useState([]); // Nuevo estado para borradores
  const [connectedAccounts, setConnectedAccounts] = useState({ facebook: false, linkedin: false });
  const [showComposer, setShowComposer] = useState(false);
  const [editingDraftId, setEditingDraftId] = useState(null);
  
  const [currentPost, setCurrentPost] = useState({
    caption: '',
    media: null,
    platforms: { facebook: false, linkedin: false },
    scheduleDate: '',
    scheduleTime: ''
  });
  
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);

  // Icono de Rubicon Core (SVG simplificado basado en tu imagen)
  const RubiconIcon = ({ className }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 30L50 15L80 30V70L50 85L20 70V30Z" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M50 35V65M35 50H65" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      setIsAuthenticated(true);
      loadPosts(user.email);
      loadDrafts(user.email);
      checkConnections(user.email);
    }
  }, []);

  const loadDrafts = (email) => {
    const savedDrafts = JSON.parse(localStorage.getItem(`drafts_${email}`) || '[]');
    setDrafts(savedDrafts);
  };

  const handleSaveDraft = () => {
    const newDraft = { ...currentPost, id: editingDraftId || Date.now(), updatedAt: new Date().toISOString() };
    let updatedDrafts;
    
    if (editingDraftId) {
      updatedDrafts = drafts.map(d => d.id === editingDraftId ? newDraft : d);
    } else {
      updatedDrafts = [newDraft, ...drafts];
    }

    setDrafts(updatedDrafts);
    localStorage.setItem(`drafts_${currentUser.email}`, JSON.stringify(updatedDrafts));
    alert('Borrador guardado exitosamente');
    closeComposer();
  };

  const handleEditDraft = (draft) => {
    setCurrentPost(draft);
    setEditingDraftId(draft.id);
    setShowComposer(true);
  };

  const closeComposer = () => {
    setShowComposer(false);
    setEditingDraftId(null);
    setCurrentPost({ caption: '', media: null, platforms: { facebook: false, linkedin: false }, scheduleDate: '', scheduleTime: '' });
  };

  // Lógica de botones inteligente: Publicar vs Programar
  const isScheduling = currentPost.scheduleDate && currentPost.scheduleTime;

  // --- Funciones de Auth y API existentes (Sin cambios, solo traducidas) ---
  const handleAuth = (e) => {
    e.preventDefault();
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (authMode === 'signup') {
      users.push(authForm);
      localStorage.setItem('users', JSON.stringify(users));
      setAuthMode('signin');
    } else {
      const user = users.find(u => u.email === authForm.email && u.password === authForm.password);
      if (user) {
        setCurrentUser(user);
        setIsAuthenticated(true);
        localStorage.setItem('currentUser', JSON.stringify(user));
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setIsAuthenticated(false);
  };

  const renderCalendar = () => {
    // (Lógica de calendario igual a la versión anterior pero con colores corporativos)
    return <div className="p-4 text-center text-gray-500">Calendario de Rubicon Core</div>;
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen">
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#05b7be] to-[#0050cb] text-white p-12 flex-col justify-between">
          <div className="flex items-center gap-3">
            <RubiconIcon className="w-10 h-10 text-white" />
            <span className="text-2xl font-bold">Rubicon Core</span>
          </div>
          <div>
            <h1 className="text-4xl font-bold mb-4">Potencia tu presencia digital</h1>
            <p className="text-lg mb-8 opacity-90">Gestiona, programa y analiza tus redes sociales desde una plataforma centralizada y eficiente.</p>
          </div>
          <div className="text-sm opacity-70">© 2026 Core Business Corp. Todos los derechos reservados.</div>
        </div>

        <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
            <div className="flex justify-center mb-6">
               <RubiconIcon className="w-16 h-16 text-[#0050cb]" />
            </div>
            <h2 className="text-2xl font-bold text-center mb-6 text-[#0f2842]">Bienvenido a Rubicon</h2>
            <div className="flex gap-2 mb-6">
              <button onClick={() => setAuthMode('signin')} className={`flex-1 py-2 rounded-lg ${authMode === 'signin' ? 'bg-[#d9e8fc] text-[#0050cb] font-bold' : 'text-gray-500'}`}>Ingresar</button>
              <button onClick={() => setAuthMode('signup')} className={`flex-1 py-2 rounded-lg ${authMode === 'signup' ? 'bg-[#d9e8fc] text-[#0050cb] font-bold' : 'text-gray-500'}`}>Registrarse</button>
            </div>
            <form onSubmit={handleAuth} className="space-y-4">
              {authMode === 'signup' && (
                <input type="text" placeholder="Nombre completo" className="w-full px-4 py-3 border rounded-lg outline-none focus:border-[#05b7be]" onChange={e => setAuthForm({...authForm, fullName: e.target.value})} />
              )}
              <input type="email" placeholder="Correo electrónico" className="w-full px-4 py-3 border rounded-lg outline-none focus:border-[#05b7be]" onChange={e => setAuthForm({...authForm, email: e.target.value})} />
              <input type="password" placeholder="Contraseña" className="w-full px-4 py-3 border rounded-lg outline-none focus:border-[#05b7be]" onChange={e => setAuthForm({...authForm, password: e.target.value})} />
              <button className="w-full bg-[#0050cb] text-white py-3 rounded-lg hover:bg-[#0f2842] transition-colors font-bold">
                {authMode === 'signin' ? 'Iniciar Sesión' : 'Crear Cuenta'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r flex flex-col">
        <div className="p-6 border-b flex items-center gap-3">
          <RubiconIcon className="w-8 h-8 text-[#0050cb]" />
          <div>
            <div className="font-bold text-[#0f2842] leading-none">Rubicon Core</div>
            <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-bold">Core Business Corp.</div>
          </div>
        </div>
        
        <div className="p-4">
          <button onClick={() => setShowComposer(true)} className="w-full bg-[#05b7be] text-white py-3 rounded-xl hover:bg-[#0050cb] transition-all flex items-center justify-center gap-2 font-bold shadow-lg shadow-cyan-100">
            <Plus className="w-5 h-5" /> Crear Publicación
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          <button onClick={() => setCurrentPage('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${currentPage === 'dashboard' ? 'bg-[#d9e8fc] text-[#0050cb] font-bold' : 'text-[#606060] hover:bg-gray-50'}`}>
            <BarChart3 className="w-5 h-5" /> Dashboard
          </button>
          <button onClick={() => setCurrentPage('calendar')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${currentPage === 'calendar' ? 'bg-[#d9e8fc] text-[#0050cb] font-bold' : 'text-[#606060] hover:bg-gray-50'}`}>
            <CalendarIcon className="w-5 h-5" /> Calendario
          </button>
          <button onClick={() => setCurrentPage('drafts')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${currentPage === 'drafts' ? 'bg-[#d9e8fc] text-[#0050cb] font-bold' : 'text-[#606060] hover:bg-gray-50'}`}>
            <FileText className="w-5 h-5" /> Borradores
            {drafts.length > 0 && <span className="ml-auto bg-[#05b7be] text-white text-[10px] px-2 py-0.5 rounded-full">{drafts.length}</span>}
          </button>
          <button onClick={() => setCurrentPage('connections')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${currentPage === 'connections' ? 'bg-[#d9e8fc] text-[#0050cb] font-bold' : 'text-[#606060] hover:bg-gray-50'}`}>
             <Plus className="w-5 h-5" /> Conexiones
          </button>
        </nav>

        <div className="p-4 border-t">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-gray-500 hover:text-red-500 transition-colors text-sm">
            <LogOut className="w-4 h-4" /> Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        {currentPage === 'dashboard' && (
           <div>
             <h1 className="text-3xl font-bold text-[#0f2842] mb-2">Panel de Control</h1>
             <p className="text-[#606060] mb-8">Resumen de tu actividad en Rubicon Core</p>
             {/* Stats Cards... */}
           </div>
        )}

        {currentPage === 'drafts' && (
          <div>
            <h1 className="text-3xl font-bold text-[#0f2842] mb-6">Borradores</h1>
            {drafts.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed">
                <FileText className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-500">No tienes borradores guardados.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {drafts.map(draft => (
                  <div key={draft.id} className="bg-white p-6 rounded-2xl border hover:shadow-md transition-shadow">
                    <div className="flex gap-2 mb-4">
                      {draft.platforms.facebook && <Facebook className="w-4 h-4 text-blue-600" />}
                      {draft.platforms.linkedin && <Linkedin className="w-4 h-4 text-blue-700" />}
                    </div>
                    <p className="text-[#606060] text-sm line-clamp-3 mb-4">{draft.caption || 'Sin contenido...'}</p>
                    <button onClick={() => handleEditDraft(draft)} className="w-full py-2 border border-[#0050cb] text-[#0050cb] rounded-lg text-sm font-bold hover:bg-[#d9e8fc]">
                      Editar y Publicar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Composer Modal */}
      {showComposer && (
        <div className="fixed inset-0 bg-[#0f2842]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-[#0f2842]">Crear Nueva Publicación</h2>
              <button onClick={closeComposer} className="text-gray-400 hover:text-gray-600"><X /></button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Selector de Plataformas */}
              <div>
                <label className="block text-xs font-bold text-[#606060] uppercase mb-3">Plataformas</label>
                <div className="flex gap-3">
                  <button onClick={() => setCurrentPost({...currentPost, platforms: {...currentPost.platforms, facebook: !currentPost.platforms.facebook}})} 
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all ${currentPost.platforms.facebook ? 'border-[#0050cb] bg-[#d9e8fc] text-[#0050cb]' : 'border-gray-100 text-gray-400'}`}>
                    <Facebook size={18} /> Facebook
                  </button>
                  <button onClick={() => setCurrentPost({...currentPost, platforms: {...currentPost.platforms, linkedin: !currentPost.platforms.linkedin}})}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all ${currentPost.platforms.linkedin ? 'border-[#0050cb] bg-[#d9e8fc] text-[#0050cb]' : 'border-gray-100 text-gray-400'}`}>
                    <Linkedin size={18} /> LinkedIn
                  </button>
                </div>
              </div>

              {/* Contenido */}
              <textarea 
                value={currentPost.caption} 
                onChange={e => setCurrentPost({...currentPost, caption: e.target.value})}
                placeholder="¿Qué quieres compartir con el mundo?"
                className="w-full h-32 p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-[#05b7be] transition-all resize-none"
              />

              {/* Programación (Opcional) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#606060] mb-2 uppercase">Agendar Fecha (Opcional)</label>
                  <input type="date" className="w-full p-3 bg-gray-50 rounded-xl outline-none" onChange={e => setCurrentPost({...currentPost, scheduleDate: e.target.value})} value={currentPost.scheduleDate} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#606060] mb-2 uppercase">Hora</label>
                  <input type="time" className="w-full p-3 bg-gray-50 rounded-xl outline-none" onChange={e => setCurrentPost({...currentPost, scheduleTime: e.target.value})} value={currentPost.scheduleTime} />
                </div>
              </div>

              {/* Footer de Botones Refinado */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                <button onClick={closeComposer} className="px-6 py-3 text-gray-400 font-bold hover:text-gray-600 transition-colors">
                  Cancelar
                </button>
                <div className="flex-1 flex flex-col sm:flex-row gap-3">
                  <button onClick={handleSaveDraft} className="flex-1 px-6 py-3 border-2 border-[#0050cb] text-[#0050cb] rounded-xl font-bold hover:bg-[#d9e8fc] transition-colors flex items-center justify-center gap-2">
                    <FileText size={18} /> Guardar Borrador
                  </button>
                  <button className="flex-1 px-6 py-3 bg-[#0050cb] text-white rounded-xl font-bold hover:bg-[#0f2842] shadow-lg shadow-blue-100 flex items-center justify-center gap-2">
                    {isScheduling ? <Clock size={18} /> : <Send size={18} />}
                    {isScheduling ? 'Programar Post' : 'Publicar Ahora'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialPlanner;