import React, { useState, useEffect } from 'react';
import { Calendar, Facebook, Linkedin, Send, Plus, Settings, LogOut, BarChart3, Clock, X, ChevronLeft, ChevronRight, FileText, Save } from 'lucide-react';
import RubiconLogo from './assets/Rubicon-Core-Icon.png';

const API_URL = 'https://social-planner-api.onrender.com';

const SocialPlanner = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState('signin');
  const [authForm, setAuthForm] = useState({ email: '', password: '', fullName: '' });
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [posts, setPosts] = useState([]);
  const [connectedAccounts, setConnectedAccounts] = useState({ facebook: false, linkedin: false });
  const [showComposer, setShowComposer] = useState(false);
  const [currentPost, setCurrentPost] = useState({
    caption: '',
    media: null,
    platforms: { facebook: false, linkedin: false },
    scheduleDate: '',
    scheduleTime: '',
    status: 'draft', // 'draft', 'scheduled', 'published'
    id: null
  });
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [filterView, setFilterView] = useState(null); // 'all', 'scheduled', 'published', 'drafts'

  // Colores de la marca Core Business Corp
  const colors = {
    primaryBlue: '#0050cb',
    turquoise: '#05b7be',
    darkBlue: '#0f2842',
    gray: '#606060',
    lightBlue: '#d9e8fc'
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      setIsAuthenticated(true);
      loadPosts(user.email);
      checkConnections(user.email);
    }
  }, []);

  const handleAuth = (e) => {
    e.preventDefault();
    if (authMode === 'signup') {
      if (!authForm.fullName || !authForm.email || !authForm.password) {
        alert('Por favor, completa todos los campos');
        return;
      }
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      if (users.find(u => u.email === authForm.email)) {
        alert('El correo electrónico ya existe');
        return;
      }
      users.push(authForm);
      localStorage.setItem('users', JSON.stringify(users));
      alert('¡Cuenta creada! Por favor, inicia sesión.');
      setAuthMode('signin');
    } else {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find(u => u.email === authForm.email && u.password === authForm.password);
      if (user) {
        setCurrentUser(user);
        setIsAuthenticated(true);
        localStorage.setItem('currentUser', JSON.stringify(user));
        loadPosts(user.email);
        checkConnections(user.email);
      } else {
        alert('Credenciales inválidas');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setPosts([]);
  };

  const checkConnections = async (email) => {
    try {
      const response = await fetch(`${API_URL}/api/connections?userId=${email}`);
      const data = await response.json();
      setConnectedAccounts(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const loadPosts = async (email) => {
    try {
      // Cargar desde localStorage primero
      const localPosts = JSON.parse(localStorage.getItem(`posts_${email}`) || '[]');
      setPosts(localPosts);

      // Intentar sincronizar con el servidor
      const response = await fetch(`${API_URL}/api/posts?userId=${email}`);
      const data = await response.json();
      if (data && Array.isArray(data)) {
        setPosts(data);
      }
    } catch (error) {
      console.error('Error:', error);
      // Si falla la API, usar solo localStorage
      const localPosts = JSON.parse(localStorage.getItem(`posts_${email}`) || '[]');
      setPosts(localPosts);
    }
  };

  const handleMediaUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentPost({ ...currentPost, media: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePublishNow = async () => {
    if (!currentPost.caption) {
      alert('Por favor, añade una descripción');
      return;
    }
    if (!currentPost.platforms.facebook && !currentPost.platforms.linkedin) {
      alert('Por favor, selecciona al menos una plataforma');
      return;
    }
    setLoading(true);
    try {
      const postData = {
        ...currentPost,
        status: 'published',
        id: currentPost.id || Date.now(),
        publishedAt: new Date().toISOString()
      };

      // Guardar en localStorage
      const userPosts = JSON.parse(localStorage.getItem(`posts_${currentUser.email}`) || '[]');
      if (currentPost.id) {
        // Actualizar post existente
        const index = userPosts.findIndex(p => p.id === currentPost.id);
        if (index !== -1) userPosts[index] = postData;
      } else {
        // Nuevo post
        userPosts.push(postData);
      }
      localStorage.setItem(`posts_${currentUser.email}`, JSON.stringify(userPosts));

      alert('¡Publicado con éxito!');
      loadPosts(currentUser.email);
      setShowComposer(false);
      resetCurrentPost();
    } catch (error) {
      alert('Error al publicar');
    }
    setLoading(false);
  };

  const handleSchedule = async () => {
    if (!currentPost.caption) {
      alert('Por favor, añade una descripción');
      return;
    }
    if (!currentPost.platforms.facebook && !currentPost.platforms.linkedin) {
      alert('Por favor, selecciona al menos una plataforma');
      return;
    }
    if (!currentPost.scheduleDate || !currentPost.scheduleTime) {
      alert('Por favor, selecciona fecha y hora para programar');
      return;
    }
    setLoading(true);
    try {
      const postData = {
        ...currentPost,
        status: 'scheduled',
        id: currentPost.id || Date.now()
      };

      // Guardar en localStorage
      const userPosts = JSON.parse(localStorage.getItem(`posts_${currentUser.email}`) || '[]');
      if (currentPost.id) {
        const index = userPosts.findIndex(p => p.id === currentPost.id);
        if (index !== -1) userPosts[index] = postData;
      } else {
        userPosts.push(postData);
      }
      localStorage.setItem(`posts_${currentUser.email}`, JSON.stringify(userPosts));

      alert('¡Publicación programada con éxito!');
      loadPosts(currentUser.email);
      setShowComposer(false);
      resetCurrentPost();
    } catch (error) {
      alert('Error al programar');
    }
    setLoading(false);
  };

  const handleSaveDraft = async () => {
    if (!currentPost.caption) {
      alert('Por favor, añade una descripción');
      return;
    }
    setLoading(true);
    try {
      const postData = {
        ...currentPost,
        status: 'draft',
        id: currentPost.id || Date.now()
      };

      // Guardar en localStorage
      const userPosts = JSON.parse(localStorage.getItem(`posts_${currentUser.email}`) || '[]');
      if (currentPost.id) {
        const index = userPosts.findIndex(p => p.id === currentPost.id);
        if (index !== -1) userPosts[index] = postData;
      } else {
        userPosts.push(postData);
      }
      localStorage.setItem(`posts_${currentUser.email}`, JSON.stringify(userPosts));

      alert('¡Borrador guardado con éxito!');
      loadPosts(currentUser.email);
      setShowComposer(false);
      resetCurrentPost();
    } catch (error) {
      alert('Error al guardar borrador');
    }
    setLoading(false);
  };

  const resetCurrentPost = () => {
    setCurrentPost({
      caption: '',
      media: null,
      platforms: { facebook: false, linkedin: false },
      scheduleDate: '',
      scheduleTime: '',
      status: 'draft',
      id: null
    });
  };

  const connectAccount = (platform) => {
    window.location.href = `${API_URL}/auth/${platform}?userId=${currentUser.email}`;
  };

  const stats = {
    total: posts.length,
    scheduled: posts.filter(p => p.status === 'scheduled').length,
    published: posts.filter(p => p.status === 'published').length,
    drafts: posts.filter(p => p.status === 'draft').length
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(selectedMonth);
    const days = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-gray-50 border-r border-b last:border-r-0"></div>);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayPosts = posts.filter(post => post.scheduleDate === dateStr);
      const isToday = dateStr === new Date().toISOString().split('T')[0];
      
      days.push(
        <div key={`day-${day}`} className={`h-24 border-r border-b last:border-r-0 p-2 hover:bg-gray-50 ${isToday ? 'bg-blue-50' : 'bg-white'}`}>
          <div className={`font-semibold text-sm mb-1 ${isToday ? 'text-[#0050cb]' : 'text-gray-700'}`}>{day}</div>
          {dayPosts.length > 0 && (
            <div className="space-y-1">
              {dayPosts.map(post => (
                <div key={post.id} className="text-xs bg-[#05b7be] text-white rounded px-2 py-1 truncate cursor-pointer hover:bg-[#0050cb]" onClick={() => {
                  setCurrentPost(post);
                  setShowComposer(true);
                }}>
                  {post.scheduleTime}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    
    return days;
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen">
        {/* Lado Izquierdo - Branding con el degradado de la empresa */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#05b7be] to-[#0050cb] text-white p-12 flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center p-1">
              <img src={RubiconLogo} alt="Rubicon Core" className="w-full h-full object-contain" />
            </div>
            <span className="text-2xl font-bold">Rubicon Core</span>
          </div>
          <div>
            <h1 className="text-4xl font-bold mb-4">Programa tus redes sociales con facilidad</h1>
            <p className="text-lg mb-8 text-blue-50">Planifica, crea y programa tu contenido en múltiples plataformas desde un solo lugar.</p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                </div>
                <span>Publicación multiplataforma</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <span>Programación inteligente</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <span>Vista de calendario visual</span>
              </div>
            </div>
          </div>
          <div className="text-sm text-blue-50">© 2026 Rubicon Core.</div>
        </div>

        {/* Lado Derecho - Login */}
        <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-3xl font-bold text-center mb-2" style={{ color: colors.darkBlue }}>Bienvenido</h2>
              <p className="text-center text-gray-600 mb-6">Inicia sesión o crea una cuenta nueva</p>
              <div className="flex gap-2 mb-6">
                <button onClick={() => setAuthMode('signin')} className={`flex-1 py-3 rounded-lg font-medium transition-all ${authMode === 'signin' ? 'bg-[#d9e8fc] text-[#0050cb]' : 'text-gray-500 hover:bg-gray-100'}`}>Ingresar</button>
                <button onClick={() => setAuthMode('signup')} className={`flex-1 py-3 rounded-lg font-medium transition-all ${authMode === 'signup' ? 'bg-[#d9e8fc] text-[#0050cb]' : 'text-gray-500 hover:bg-gray-100'}`}>Registrarse</button>
              </div>
              <div className="space-y-4">
                {authMode === 'signup' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Nombre Completo</label>
                    <input type="text" value={authForm.fullName} onChange={(e) => setAuthForm({...authForm, fullName: e.target.value})} placeholder="Ej: Juan Pérez" className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#05b7be] outline-none" />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-2">Correo Electrónico</label>
                  <input type="email" value={authForm.email} onChange={(e) => setAuthForm({...authForm, email: e.target.value})} placeholder="usuario@empresa.com" className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#05b7be] outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Contraseña</label>
                  <input type="password" value={authForm.password} onChange={(e) => setAuthForm({...authForm, password: e.target.value})} placeholder="••••••••" className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#05b7be] outline-none" />
                </div>
                <button onClick={handleAuth} className="w-full bg-[#0050cb] text-white py-3 rounded-lg hover:bg-[#0f2842] transition-colors font-medium">
                  {authMode === 'signin' ? 'Iniciar Sesión' : 'Crear Cuenta'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar con colores corporativos */}
      <div className="w-64 bg-white border-r flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#05b7be] to-[#0050cb] rounded-lg flex items-center justify-center p-1.5">
              <img src={RubiconLogo} alt="Rubicon Core" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="font-bold text-[#0f2842]">Rubicon Core</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Core Business Corp.</div>
            </div>
          </div>
        </div>
        <div className="p-4">
          <button onClick={() => setShowComposer(true)} className="w-full bg-[#05b7be] text-white px-4 py-3 rounded-lg hover:bg-[#0050cb] transition-colors flex items-center justify-center gap-2 font-medium">
            <Plus className="w-5 h-5" />Crear Publicación
          </button>
        </div>
        <nav className="flex-1 px-3">
          <button onClick={() => setCurrentPage('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${currentPage === 'dashboard' ? 'bg-[#d9e8fc] text-[#0050cb]' : 'text-[#606060] hover:bg-gray-50'}`}>
            <BarChart3 className="w-5 h-5" />Panel de Control
          </button>
          <button onClick={() => setCurrentPage('calendar')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${currentPage === 'calendar' ? 'bg-[#d9e8fc] text-[#0050cb]' : 'text-[#606060] hover:bg-gray-50'}`}>
            <Calendar className="w-5 h-5" />Calendario
          </button>
          <button onClick={() => setCurrentPage('drafts')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${currentPage === 'drafts' ? 'bg-[#d9e8fc] text-[#0050cb]' : 'text-[#606060] hover:bg-gray-50'}`}>
            <FileText className="w-5 h-5" />
            <span className="flex-1 text-left">Borradores</span>
            {stats.drafts > 0 && (
              <span className="bg-[#05b7be] text-white text-xs font-bold px-2 py-0.5 rounded-full">{stats.drafts}</span>
            )}
          </button>
          <button onClick={() => setCurrentPage('connections')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${currentPage === 'connections' ? 'bg-[#d9e8fc] text-[#0050cb]' : 'text-[#606060] hover:bg-gray-50'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
            Conexiones
          </button>
          <button onClick={() => setCurrentPage('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${currentPage === 'settings' ? 'bg-[#d9e8fc] text-[#0050cb]' : 'text-[#606060] hover:bg-gray-50'}`}>
            <Settings className="w-5 h-5" />Configuración
          </button>
        </nav>
        <div className="p-4 border-t">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 bg-[#d9e8fc] rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-[#0050cb]">{currentUser?.fullName?.[0] || 'U'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-700 truncate">{currentUser?.email}</div>
            </div>
            <button onClick={handleLogout} className="text-gray-400 hover:text-red-500">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="flex-1 overflow-auto p-8">
        {currentPage === 'dashboard' && (
          <div>
            <h1 className="text-3xl font-bold mb-2 text-[#0f2842]">Panel de Control</h1>
            <p className="text-gray-600 mb-8">¡Bienvenido de nuevo! Aquí tienes un resumen de tu contenido.</p>
            <div className="grid grid-cols-4 gap-6 mb-8">
              <button onClick={() => setFilterView('all')} className="bg-white rounded-lg p-6 border shadow-sm hover:shadow-md transition-all hover:border-[#0050cb] text-left">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-[#0050cb]" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 font-medium">Total</div>
                    <div className="text-2xl font-bold text-[#0f2842]">{stats.total}</div>
                  </div>
                </div>
              </button>
              <button onClick={() => setFilterView('scheduled')} className="bg-white rounded-lg p-6 border shadow-sm hover:shadow-md transition-all hover:border-orange-500 text-left">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 font-medium">Programadas</div>
                    <div className="text-2xl font-bold text-[#0f2842]">{stats.scheduled}</div>
                  </div>
                </div>
              </button>
              <button onClick={() => setFilterView('published')} className="bg-white rounded-lg p-6 border shadow-sm hover:shadow-md transition-all hover:border-green-500 text-left">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                    <Send className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 font-medium">Publicadas</div>
                    <div className="text-2xl font-bold text-[#0f2842]">{stats.published}</div>
                  </div>
                </div>
              </button>
              <button onClick={() => setFilterView('drafts')} className="bg-white rounded-lg p-6 border shadow-sm hover:shadow-md transition-all hover:border-purple-500 text-left">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 font-medium">Borradores</div>
                    <div className="text-2xl font-bold text-[#0f2842]">{stats.drafts}</div>
                  </div>
                </div>
              </button>
            </div>
            {/* Vista filtrada de publicaciones */}
            {filterView ? (
              <div className="bg-white rounded-lg border shadow-sm">
                <div className="p-6 border-b flex justify-between items-center">
                  <h2 className="text-xl font-bold text-[#0f2842]">
                    {filterView === 'all' && 'Todas las Publicaciones'}
                    {filterView === 'scheduled' && 'Publicaciones Programadas'}
                    {filterView === 'published' && 'Publicaciones Realizadas'}
                    {filterView === 'drafts' && 'Borradores'}
                  </h2>
                  <button onClick={() => setFilterView(null)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6">
                  {(() => {
                    const filteredPosts = filterView === 'all'
                      ? posts
                      : filterView === 'drafts'
                      ? posts.filter(p => p.status === 'draft')
                      : posts.filter(p => p.status === filterView);

                    if (filteredPosts.length === 0) {
                      return (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-8 h-8 text-gray-300" />
                          </div>
                          <p className="text-gray-500">No hay publicaciones en esta categoría</p>
                        </div>
                      );
                    }

                    return (
                      <div className="grid gap-4">
                        {filteredPosts.map(post => (
                          <div key={post.id} className="border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer" onClick={() => {
                            setCurrentPost(post);
                            setShowComposer(true);
                          }}>
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex gap-2">
                                {post.platforms.facebook && <div className="w-6 h-6 bg-blue-50 rounded flex items-center justify-center"><Facebook className="w-4 h-4 text-blue-600" /></div>}
                                {post.platforms.linkedin && <div className="w-6 h-6 bg-blue-50 rounded flex items-center justify-center"><Linkedin className="w-4 h-4 text-blue-700" /></div>}
                              </div>
                              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                post.status === 'published' ? 'bg-green-100 text-green-700' :
                                post.status === 'scheduled' ? 'bg-orange-100 text-orange-700' :
                                'bg-purple-100 text-purple-700'
                              }`}>
                                {post.status === 'published' ? 'Publicada' : post.status === 'scheduled' ? 'Programada' : 'Borrador'}
                              </span>
                            </div>
                            <p className="text-gray-700 line-clamp-2 mb-2">{post.caption}</p>
                            {post.scheduleDate && (
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Clock className="w-4 h-4" />
                                <span>{post.scheduleDate} {post.scheduleTime}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg p-12 text-center border dashed">
                <Calendar className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Vista rápida de tus publicaciones</h3>
                <p className="text-gray-500 mb-6">Haz clic en cualquiera de las tarjetas de arriba para ver tus publicaciones.</p>
                <button onClick={() => setShowComposer(true)} className="px-6 py-3 bg-[#05b7be] text-white rounded-lg hover:bg-[#0050cb] transition-colors inline-flex items-center gap-2">
                  <Plus className="w-5 h-5" />Crear Publicación
                </button>
              </div>
            )}
          </div>
        )}

        {currentPage === 'drafts' && (
          <div>
            <h1 className="text-3xl font-bold mb-2 text-[#0f2842]">Borradores</h1>
            <p className="text-gray-600 mb-8">Edita y publica tus borradores guardados</p>
            {posts.filter(p => p.status === 'draft').length === 0 ? (
              <div className="bg-white rounded-lg p-12 text-center border">
                <FileText className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No tienes borradores guardados</h3>
                <p className="text-gray-500 mb-6">Los borradores te permiten guardar publicaciones y editarlas más tarde.</p>
                <button onClick={() => setShowComposer(true)} className="px-6 py-3 bg-[#05b7be] text-white rounded-lg hover:bg-[#0050cb] transition-colors inline-flex items-center gap-2">
                  <Plus className="w-5 h-5" />Crear Publicación
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {posts.filter(p => p.status === 'draft').map(post => (
                  <div key={post.id} className="bg-white border rounded-lg p-6 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex gap-2">
                        {post.platforms.facebook && (
                          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                            <Facebook className="w-5 h-5 text-blue-600" />
                          </div>
                        )}
                        {post.platforms.linkedin && (
                          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                            <Linkedin className="w-5 h-5 text-blue-700" />
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-medium px-3 py-1 rounded-full bg-purple-100 text-purple-700">
                        Borrador
                      </span>
                    </div>
                    <p className="text-gray-700 mb-4">{post.caption}</p>
                    {post.media && (
                      <img src={post.media} alt="Preview" className="w-full h-48 object-cover rounded-lg mb-4" />
                    )}
                    <div className="flex gap-3 pt-4 border-t">
                      <button
                        onClick={() => {
                          setCurrentPost(post);
                          setShowComposer(true);
                        }}
                        className="flex-1 px-4 py-2 bg-[#0050cb] text-white rounded-lg hover:bg-[#0f2842] transition-colors font-medium"
                      >
                        Editar y Publicar
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('¿Estás seguro de eliminar este borrador?')) {
                            const userPosts = JSON.parse(localStorage.getItem(`posts_${currentUser.email}`) || '[]');
                            const filtered = userPosts.filter(p => p.id !== post.id);
                            localStorage.setItem(`posts_${currentUser.email}`, JSON.stringify(filtered));
                            loadPosts(currentUser.email);
                          }
                        }}
                        className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {currentPage === 'calendar' && (
          <div>
            <h1 className="text-3xl font-bold mb-2 text-[#0f2842]">Calendario</h1>
            <p className="text-gray-600 mb-8">Visualiza y gestiona tus publicaciones programadas</p>
            <div className="bg-white rounded-lg p-6 border shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-[#0f2842]">
                  {selectedMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase()}
                </h2>
                <div className="flex gap-2">
                  <button onClick={() => {
                    const newDate = new Date(selectedMonth);
                    newDate.setMonth(newDate.getMonth() - 1);
                    setSelectedMonth(newDate);
                  }} className="p-2 border rounded-lg hover:bg-gray-50"><ChevronLeft className="w-5 h-5" /></button>
                  <button onClick={() => setSelectedMonth(new Date())} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 font-medium">Hoy</button>
                  <button onClick={() => {
                    const newDate = new Date(selectedMonth);
                    newDate.setMonth(newDate.getMonth() + 1);
                    setSelectedMonth(newDate);
                  }} className="p-2 border rounded-lg hover:bg-gray-50"><ChevronRight className="w-5 h-5" /></button>
                </div>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <div className="grid grid-cols-7 bg-gray-50 border-b">
                  {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                    <div key={day} className="font-semibold text-center text-sm py-3 border-r last:border-r-0 text-[#606060]">{day}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {renderCalendar()}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentPage === 'connections' && (
          <div className="max-w-4xl">
            <h1 className="text-3xl font-bold mb-2 text-[#0f2842]">Conexiones</h1>
            <p className="text-gray-600 mb-8">Conecta tus redes sociales para empezar a publicar</p>
            <div className="bg-[#d9e8fc] border border-[#0050cb] rounded-lg p-4 mb-6 flex items-start gap-3">
              <div className="w-5 h-5 bg-[#0050cb] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs">i</span>
              </div>
              <div>
                <h3 className="font-semibold text-[#0f2842] mb-1">Configuración OAuth Requerida</h3>
                <p className="text-[#0f2842] text-sm opacity-80">Para habilitar conexiones reales con Facebook y LinkedIn, es necesario configurar las credenciales de API. El modo demo simula las cuentas para pruebas.</p>
              </div>
            </div>
            <div className="grid gap-6">
              <div className="bg-white rounded-lg p-6 border shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Facebook className="w-6 h-6 text-[#0050cb]" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Facebook</h3>
                      <p className="text-sm text-gray-600">Conecta tu página de Facebook para programar posts</p>
                    </div>
                  </div>
                  <button onClick={() => connectAccount('facebook')} className={`px-6 py-2 rounded-lg font-medium transition-all ${connectedAccounts.facebook ? 'bg-blue-50 text-[#0050cb] border border-[#0050cb]' : 'bg-[#0050cb] text-white hover:bg-[#0f2842]'}`}>
                    {connectedAccounts.facebook ? '✓ Conectado' : 'Conectar Facebook'}
                  </button>
                </div>
              </div>
              <div className="bg-white rounded-lg p-6 border shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Linkedin className="w-6 h-6 text-[#0050cb]" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">LinkedIn</h3>
                      <p className="text-sm text-gray-600">Conecta tu perfil profesional de LinkedIn</p>
                    </div>
                  </div>
                  <button onClick={() => connectAccount('linkedin')} className={`px-6 py-2 rounded-lg font-medium transition-all ${connectedAccounts.linkedin ? 'bg-blue-50 text-[#0050cb] border border-[#0050cb]' : 'bg-[#0050cb] text-white hover:bg-[#0f2842]'}`}>
                    {connectedAccounts.linkedin ? '✓ Conectado' : 'Conectar LinkedIn'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentPage === 'settings' && (
          <div className="max-w-3xl">
            <h1 className="text-3xl font-bold mb-2 text-[#0f2842]">Configuración</h1>
            <p className="text-gray-600 mb-8">Gestiona tus preferencias de cuenta</p>
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6 border shadow-sm">
                <h3 className="font-semibold text-lg mb-4">Perfil de Usuario</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-[#606060]">Correo Electrónico</label>
                    <input type="email" value={currentUser?.email} disabled className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-gray-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-[#606060]">Nombre para mostrar</label>
                    <input type="text" defaultValue={currentUser?.fullName} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#05b7be] outline-none" />
                  </div>
                  <button className="px-6 py-2 bg-[#0050cb] text-white rounded-lg hover:bg-[#0f2842] transition-colors">Guardar Cambios</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal del Compositor con colores corporativos */}
      {showComposer && (
        <div className="fixed inset-0 bg-[#0f2842] bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h2 className="text-2xl font-bold text-[#0f2842]">Nueva Publicación</h2>
              <button onClick={() => setShowComposer(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3 text-[#606060]">1. Selecciona plataformas</label>
                <div className="flex gap-3">
                  <button onClick={() => setCurrentPost({...currentPost, platforms: {...currentPost.platforms, facebook: !currentPost.platforms.facebook}})} className={`flex items-center gap-2 px-6 py-3 rounded-lg border-2 transition-all ${currentPost.platforms.facebook ? 'border-[#0050cb] bg-[#d9e8fc] text-[#0050cb]' : 'border-gray-100 text-gray-400'}`}>
                    <Facebook className="w-5 h-5" />Facebook
                  </button>
                  <button onClick={() => setCurrentPost({...currentPost, platforms: {...currentPost.platforms, linkedin: !currentPost.platforms.linkedin}})} className={`flex items-center gap-2 px-6 py-3 rounded-lg border-2 transition-all ${currentPost.platforms.linkedin ? 'border-[#0050cb] bg-[#d9e8fc] text-[#0050cb]' : 'border-gray-100 text-gray-400'}`}>
                    <Linkedin className="w-5 h-5" />LinkedIn
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-3 text-[#606060]">2. Contenido del post</label>
                <textarea value={currentPost.caption} onChange={(e) => setCurrentPost({...currentPost, caption: e.target.value})} placeholder="¿Qué quieres compartir hoy?" className="w-full border rounded-lg p-4 h-32 resize-none focus:ring-2 focus:ring-[#05b7be] outline-none" />
                <div className="text-xs text-gray-400 mt-1">{currentPost.caption.length} caracteres</div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-3 text-[#606060]">3. Multimedia</label>
                <label className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                  <Plus className="w-8 h-8 text-gray-300 mb-2" />
                  <span className="text-sm text-gray-500">Añadir imagen o video</span>
                  <input type="file" accept="image/*,video/*" onChange={handleMediaUpload} className="hidden" />
                </label>
                {currentPost.media && <img src={currentPost.media} alt="Preview" className="mt-4 max-w-full h-32 object-cover rounded-lg" />}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-[#606060]">Fecha</label>
                  <input type="date" value={currentPost.scheduleDate} onChange={(e) => setCurrentPost({...currentPost, scheduleDate: e.target.value})} className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#05b7be]" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-[#606060]">Hora</label>
                  <input type="time" value={currentPost.scheduleTime} onChange={(e) => setCurrentPost({...currentPost, scheduleTime: e.target.value})} className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#05b7be]" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowComposer(false);
                    resetCurrentPost();
                  }}
                  className="flex-1 py-3 text-gray-500 font-medium hover:bg-gray-50 rounded-lg border"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveDraft}
                  disabled={loading}
                  className="flex-1 bg-purple-50 text-purple-700 border-2 border-purple-200 py-3 rounded-lg hover:bg-purple-100 transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  {loading ? 'Guardando...' : 'Guardar Borrador'}
                </button>
                <button
                  onClick={handleSchedule}
                  disabled={loading}
                  className="flex-1 bg-orange-50 text-orange-700 border-2 border-orange-200 py-3 rounded-lg hover:bg-orange-100 transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50"
                >
                  <Clock className="w-5 h-5" />
                  {loading ? 'Programando...' : 'Programar'}
                </button>
                <button
                  onClick={handlePublishNow}
                  disabled={loading}
                  className="flex-1 bg-[#0050cb] text-white py-3 rounded-lg hover:bg-[#0f2842] transition-colors flex items-center justify-center gap-2 font-bold shadow-lg shadow-blue-200 disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                  {loading ? 'Publicando...' : 'Publicar Ahora'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialPlanner;