import React, { useState, useEffect } from 'react';
import { Facebook, Linkedin, Send, Plus, Settings, LogOut, BarChart3, Clock, X, FileText, Calendar as CalendarIcon, ChevronRight, Eye } from 'lucide-react';

const API_URL = 'https://social-planner-api.onrender.com';

const RubiconApp = () => {
  // --- ESTADOS ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState('signin');
  const [authForm, setAuthForm] = useState({ email: '', password: '', fullName: '' });
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [posts, setPosts] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [showComposer, setShowComposer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('all'); // 'all', 'scheduled', 'published'

  const [currentPost, setCurrentPost] = useState({
    caption: '',
    media: null,
    platforms: { facebook: false, linkedin: false },
    scheduleDate: '',
    scheduleTime: ''
  });

  // --- COMPONENTE LOGO RUBICON CORE ---
  const RubiconLogo = ({ className = "w-10 h-10" }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="rubiconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#05b7be" />
          <stop offset="100%" stopColor="#0050cb" />
        </linearGradient>
      </defs>
      <path d="M50 5L15 25V75L50 95L85 75V25L50 5Z" stroke="url(#rubiconGrad)" strokeWidth="8" strokeLinejoin="round" />
      <path d="M30 40L50 30L70 40V60L50 70L30 60V40Z" fill="url(#rubiconGrad)" />
    </svg>
  );

  // --- PERSISTENCIA Y CARGA ---
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      setIsAuthenticated(true);
      // Simulación de carga de datos iniciales
      const mockPosts = [
        { id: 1, caption: 'Lanzamiento de Rubicon Core', status: 'published', scheduleDate: '2026-01-01', platforms: { facebook: true } },
        { id: 2, caption: 'Reunión trimestral CBC', status: 'scheduled', scheduleDate: '2026-02-15', scheduleTime: '10:00', platforms: { linkedin: true } }
      ];
      setPosts(mockPosts);
      const savedDrafts = JSON.parse(localStorage.getItem(`drafts_${user.email}`) || '[]');
      setDrafts(savedDrafts);
    }
  }, []);

  // --- LÓGICA DE AUTENTICACIÓN (CORREGIDA) ---
  const handleAuth = (e) => {
    e.preventDefault();
    const users = JSON.parse(localStorage.getItem('users') || '[]');

    if (authMode === 'signup') {
      if (!authForm.email || !authForm.password) return alert('Completa los campos');
      users.push(authForm);
      localStorage.setItem('users', JSON.stringify(users));
      alert('Cuenta creada. Ahora inicia sesión.');
      setAuthMode('signin');
    } else {
      const user = users.find(u => u.email === authForm.email && u.password === authForm.password);
      if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        setCurrentUser(user);
        setIsAuthenticated(true);
      } else {
        alert('Credenciales incorrectas. Asegúrate de haberte registrado primero.');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  // --- MANEJO DE POSTS ---
  const stats = {
    total: posts.length,
    scheduled: posts.filter(p => p.status === 'scheduled').length,
    published: posts.filter(p => p.status === 'published').length
  };

  const handleStatClick = (type) => {
    setFilterType(type);
    setCurrentPage('post-list');
  };

  const filteredPosts = posts.filter(post => {
    if (filterType === 'all') return true;
    return post.status === filterType;
  });

  // --- RENDERIZADO DE VISTAS ---
  return (
    <div className="flex h-screen bg-[#f8fafc]">
      {!isAuthenticated ? (
        // PANTALLA DE LOGIN
        <div className="flex w-full min-h-screen">
          <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#05b7be] to-[#0050cb] p-12 flex-col justify-between text-white">
            <div className="flex items-center gap-3">
              <RubiconLogo className="w-12 h-12" />
              <span className="text-2xl font-bold tracking-tight">Rubicon Core</span>
            </div>
            <div>
              <h1 className="text-5xl font-extrabold mb-6 leading-tight">Gestión inteligente para Core Business Corp.</h1>
              <p className="text-lg opacity-90 max-w-md">Optimiza tu comunicación digital con nuestra suite de herramientas de alto rendimiento.</p>
            </div>
            <div className="text-sm opacity-60">© 2026 CBC - Business & Strategy.</div>
          </div>
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="w-full max-w-md space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-[#0f2842]">{authMode === 'signin' ? 'Bienvenido' : 'Crear Cuenta'}</h2>
                <p className="text-[#606060] mt-2">Ingresa tus credenciales para acceder a Rubicon</p>
              </div>
              <form onSubmit={handleAuth} className="space-y-4">
                {authMode === 'signup' && (
                  <input type="text" placeholder="Nombre completo" className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-[#05b7be] outline-none" onChange={e => setAuthForm({...authForm, fullName: e.target.value})} />
                )}
                <input type="email" placeholder="Email institucional" className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-[#05b7be] outline-none" onChange={e => setAuthForm({...authForm, email: e.target.value})} />
                <input type="password" placeholder="Contraseña" className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-[#05b7be] outline-none" onChange={e => setAuthForm({...authForm, password: e.target.value})} />
                <button className="w-full bg-[#0050cb] text-white py-4 rounded-xl font-bold hover:shadow-lg transition-all active:scale-[0.98]">
                  {authMode === 'signin' ? 'Iniciar Sesión' : 'Registrarse'}
                </button>
              </form>
              <button onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')} className="w-full text-sm text-[#606060] hover:text-[#0050cb]">
                {authMode === 'signin' ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya tienes cuenta? Inicia sesión'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        // APP PRINCIPAL
        <>
          {/* SIDEBAR */}
          <div className="w-64 bg-white border-r flex flex-col">
            <div className="p-6 border-b flex items-center gap-3">
              <RubiconLogo className="w-8 h-8" />
              <div>
                <span className="font-bold text-[#0f2842] block">Rubicon Core</span>
                <span className="text-[10px] text-[#05b7be] font-bold uppercase tracking-widest">Core Business Corp</span>
              </div>
            </div>
            <div className="p-4">
              <button onClick={() => setShowComposer(true)} className="w-full bg-[#05b7be] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#0050cb] transition-colors">
                <Plus size={20} /> Nueva Post
              </button>
            </div>
            <nav className="flex-1 px-3 space-y-1">
              <button onClick={() => setCurrentPage('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${currentPage === 'dashboard' ? 'bg-[#d9e8fc] text-[#0050cb] font-bold' : 'text-[#606060] hover:bg-gray-50'}`}>
                <BarChart3 size={20} /> Dashboard
              </button>
              <button onClick={() => setCurrentPage('calendar')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${currentPage === 'calendar' ? 'bg-[#d9e8fc] text-[#0050cb] font-bold' : 'text-[#606060] hover:bg-gray-50'}`}>
                <CalendarIcon size={20} /> Calendario
              </button>
              <button onClick={() => setCurrentPage('drafts')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${currentPage === 'drafts' ? 'bg-[#d9e8fc] text-[#0050cb] font-bold' : 'text-[#606060] hover:bg-gray-50'}`}>
                <FileText size={20} /> Borradores
              </button>
            </nav>
            <div className="p-4 border-t">
              <button onClick={handleLogout} className="flex items-center gap-2 text-[#606060] text-sm hover:text-red-500 transition-colors">
                <LogOut size={16} /> Cerrar Sesión
              </button>
            </div>
          </div>

          {/* CONTENIDO PRINCIPAL */}
          <main className="flex-1 overflow-auto p-8">
            {currentPage === 'dashboard' && (
              <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-[#0f2842] mb-2">Bienvenido, {currentUser?.fullName || 'Usuario'}</h1>
                <p className="text-[#606060] mb-8">Gestión de contenidos corporativos</p>
                
                {/* TARJETAS DE ESTADÍSTICAS CLIQUEABLES */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                  <button onClick={() => handleStatClick('all')} className="bg-white p-6 rounded-2xl border-2 border-transparent hover:border-[#0050cb] transition-all text-left shadow-sm group">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-blue-50 rounded-xl text-[#0050cb] group-hover:bg-[#0050cb] group-hover:text-white transition-colors">
                        <BarChart3 size={24} />
                      </div>
                      <ChevronRight className="text-gray-300 group-hover:text-[#0050cb]" />
                    </div>
                    <span className="text-sm font-medium text-[#606060]">Total de Publicaciones</span>
                    <div className="text-3xl font-bold text-[#0f2842] mt-1">{stats.total}</div>
                  </button>

                  <button onClick={() => handleStatClick('scheduled')} className="bg-white p-6 rounded-2xl border-2 border-transparent hover:border-orange-400 transition-all text-left shadow-sm group">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-orange-50 rounded-xl text-orange-500 group-hover:bg-orange-400 group-hover:text-white transition-colors">
                        <Clock size={24} />
                      </div>
                      <ChevronRight className="text-gray-300 group-hover:text-orange-400" />
                    </div>
                    <span className="text-sm font-medium text-[#606060]">Programadas</span>
                    <div className="text-3xl font-bold text-[#0f2842] mt-1">{stats.scheduled}</div>
                  </button>

                  <button onClick={() => handleStatClick('published')} className="bg-white p-6 rounded-2xl border-2 border-transparent hover:border-[#05b7be] transition-all text-left shadow-sm group">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-cyan-50 rounded-xl text-[#05b7be] group-hover:bg-[#05b7be] group-hover:text-white transition-colors">
                        <Send size={24} />
                      </div>
                      <ChevronRight className="text-gray-300 group-hover:text-[#05b7be]" />
                    </div>
                    <span className="text-sm font-medium text-[#606060]">Publicadas</span>
                    <div className="text-3xl font-bold text-[#0f2842] mt-1">{stats.published}</div>
                  </button>
                </div>
              </div>
            )}

            {/* VISTA DE LISTADO FILTRADO */}
            {currentPage === 'post-list' && (
              <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                  <button onClick={() => setCurrentPage('dashboard')} className="p-2 hover:bg-gray-100 rounded-lg text-[#606060]">
                    <ChevronRight className="rotate-180" />
                  </button>
                  <h1 className="text-3xl font-bold text-[#0f2842]">
                    {filterType === 'all' ? 'Todas las Publicaciones' : filterType === 'scheduled' ? 'Publicaciones Programadas' : 'Publicaciones Realizadas'}
                  </h1>
                </div>
                
                <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-[#606060] text-sm uppercase font-bold">
                      <tr>
                        <th className="px-6 py-4">Contenido</th>
                        <th className="px-6 py-4">Plataforma</th>
                        <th className="px-6 py-4">Fecha</th>
                        <th className="px-6 py-4">Estado</th>
                        <th className="px-6 py-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredPosts.map(post => (
                        <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-[#0f2842] font-medium truncate max-w-xs">{post.caption}</td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              {post.platforms.facebook && <Facebook size={16} className="text-blue-600" />}
                              {post.platforms.linkedin && <Linkedin size={16} className="text-blue-700" />}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-[#606060]">{post.scheduleDate}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${post.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                              {post.status === 'published' ? 'Publicado' : 'Programado'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button className="p-2 text-[#0050cb] hover:bg-blue-50 rounded-lg"><Eye size={18} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredPosts.length === 0 && (
                    <div className="p-20 text-center text-[#606060]">No hay registros en esta categoría.</div>
                  )}
                </div>
              </div>
            )}
          </main>
        </>
      )}
    </div>
  );
};

export default RubiconApp;