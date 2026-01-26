import React, { useState, useEffect } from 'react';
import { Calendar, Facebook, Linkedin, Send, Plus, Settings, LogOut, BarChart3, Clock, X, ChevronLeft, ChevronRight, FileText, Save, CheckCircle, Trash2 } from 'lucide-react';
import RubiconLogo from './assets/Rubicon-Core-Icon.png';
import CBCLogo from './assets/logocbc.png';

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
  const [previewPlatform, setPreviewPlatform] = useState('facebook'); // 'facebook' or 'linkedin'
  const [showActionMenu, setShowActionMenu] = useState(false); // Para el dropdown del botón
  const [showScheduleModal, setShowScheduleModal] = useState(false); // Para el modal de programación
  const [allUsers, setAllUsers] = useState([]); // Lista de todos los usuarios (solo admin)
  const [showApprovalModal, setShowApprovalModal] = useState(false); // Modal para enviar para aprobación
  const [approvalData, setApprovalData] = useState({ approverId: '', note: '' }); // Datos de aprobación
  const [pendingApprovals, setPendingApprovals] = useState([]); // Posts pendientes de aprobación (para admin)
  const [myPendingApprovals, setMyPendingApprovals] = useState([]); // Mis posts pendientes (para colaborador)
  const [newUserForm, setNewUserForm] = useState({ fullName: '', email: '', password: '', role: 'collaborator' }); // Formulario de nuevo usuario
  const [selectionMode, setSelectionMode] = useState(false); // Modo de selección para eliminación masiva
  const [selectedPosts, setSelectedPosts] = useState([]); // Posts seleccionados para eliminar

  // Colores de la marca Core Business Corp
  const colors = {
    primaryBlue: '#0050cb',
    green: '#0050cb',
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
      loadAllUsers(); // Load all users to show author names on posts

      // Load pending approvals based on role
      if (user.role === 'admin') {
        loadPendingApprovals(user.email);
      } else if (user.role === 'collaborator') {
        loadMyPendingApprovals(user.email);
      }
    }

    // Handle OAuth callback from LinkedIn/Facebook
    const urlParams = new URLSearchParams(window.location.search);
    const connected = urlParams.get('connected');
    const error = urlParams.get('error');

    if (error === 'auth_failed') {
      alert('Error al conectar la cuenta. Por favor, intenta de nuevo.');
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (connected) {
      const platformName = connected === 'facebook' ? 'Facebook' : 'LinkedIn';
      alert(`¡${platformName} conectado exitosamente!`);

      // Reload connections
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        checkConnections(user.email);
      }

      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();

    if (authMode === 'signup') {
      // Registration
      try {
        const response = await fetch(`${API_URL}/api/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: authForm.fullName,
            email: authForm.email,
            password: authForm.password
          })
        });

        const data = await response.json();

        if (response.ok) {
          alert('¡Cuenta creada! Por favor, inicia sesión.');
          setAuthMode('signin');
          setAuthForm({ fullName: '', email: '', password: '' });
        } else {
          alert(data.error || 'Error al registrar usuario');
        }
      } catch (error) {
        console.error('Registration error:', error);
        alert('Error al conectar con el servidor');
      }
    } else {
      // Login
      try {
        const response = await fetch(`${API_URL}/api/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: authForm.email,
            password: authForm.password
          })
        });

        const data = await response.json();

        if (response.ok) {
          setCurrentUser(data.user);
          setIsAuthenticated(true);
          localStorage.setItem('currentUser', JSON.stringify(data.user));
          loadPosts(data.user.email);
          checkConnections(data.user.email);
        } else {
          alert(data.error || 'Credenciales inválidas');
        }
      } catch (error) {
        console.error('Login error:', error);
        alert('Error al conectar con el servidor');
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
      const response = await fetch(`${API_URL}/api/posts?userId=${email}`);
      if (!response.ok) throw new Error('Error al cargar posts');

      const data = await response.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar posts:', error);
      setPosts([]);
    }
  };

  // Load media for a specific post
  const loadPostMedia = async (postId) => {
    try {
      const response = await fetch(`${API_URL}/api/posts/${postId}/media`);
      if (!response.ok) throw new Error('Error al cargar media');

      const { media } = await response.json();
      return media;
    } catch (error) {
      console.error('Error al cargar media:', error);
      return null;
    }
  };

  const loadAllUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users`);
      if (!response.ok) throw new Error('Error al cargar usuarios');

      const data = await response.json();
      setAllUsers(data.users || []);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      setAllUsers([]);
    }
  };

  const updateUserRole = async (email, newRole) => {
    try {
      const response = await fetch(`${API_URL}/api/users/update-role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          role: newRole,
          adminKey: 'rubicon2026admin'
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Rol actualizado exitosamente para ${email}`);
        loadAllUsers(); // Reload users list
      } else {
        alert(data.error || 'Error al actualizar rol');
      }
    } catch (error) {
      console.error('Update role error:', error);
      alert('Error al conectar con el servidor');
    }
  };

  const deleteUser = async (email, fullName) => {
    if (!confirm(`¿Estás seguro que deseas eliminar al usuario ${fullName}?\n\nEsta acción no se puede deshacer y eliminará:\n- La cuenta del usuario\n- Todas sus publicaciones\n- Sus conexiones a redes sociales`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/admin/delete-user`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailToDelete: email,
          adminKey: 'rubicon2026admin'
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Usuario ${fullName} eliminado exitosamente`);
        loadAllUsers(); // Reload users list
      } else {
        alert(data.error || 'Error al eliminar usuario');
      }
    } catch (error) {
      console.error('Delete user error:', error);
      alert('Error al conectar con el servidor');
    }
  };

  const loadPendingApprovals = async (userEmail = currentUser?.email) => {
    if (!userEmail) return;
    try {
      const response = await fetch(`${API_URL}/api/posts/pending-approval?userId=${userEmail}`);
      if (!response.ok) throw new Error('Error al cargar aprobaciones');

      const data = await response.json();
      setPendingApprovals(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar aprobaciones:', error);
      setPendingApprovals([]);
    }
  };

  const loadMyPendingApprovals = async (userEmail = currentUser?.email) => {
    if (!userEmail) return;
    try {
      const response = await fetch(`${API_URL}/api/posts/my-pending-approvals?userId=${userEmail}`);
      if (!response.ok) throw new Error('Error al cargar mis aprobaciones');

      const data = await response.json();
      setMyPendingApprovals(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar mis aprobaciones:', error);
      setMyPendingApprovals([]);
    }
  };

  const handleSendForApproval = async () => {
    if (!currentPost.caption) {
      alert('Por favor, añade una descripción');
      return;
    }
    if (!currentPost.platforms.facebook && !currentPost.platforms.linkedin) {
      alert('Por favor, selecciona al menos una plataforma');
      return;
    }
    if (!approvalData.approverId) {
      alert('Por favor, selecciona un aprobador');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/posts/send-for-approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.email,
          postData: currentPost,
          approverId: approvalData.approverId,
          note: approvalData.note
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('¡Post enviado para aprobación!');
        setShowApprovalModal(false);
        setShowComposer(false);
        setApprovalData({ approverId: '', note: '' });
        resetCurrentPost();
        loadPosts(currentUser.email);
        loadMyPendingApprovals(); // Reload collaborator's pending posts
      } else {
        alert(data.error || 'Error al enviar para aprobación');
      }
    } catch (error) {
      console.error('Send for approval error:', error);
      alert('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePost = async (postId) => {
    try {
      const response = await fetch(`${API_URL}/api/posts/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          approverId: currentUser.email
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('¡Post aprobado y programado!');
        loadPendingApprovals();
        loadPosts(currentUser.email);
      } else {
        alert(data.error || 'Error al aprobar post');
      }
    } catch (error) {
      console.error('Approve post error:', error);
      alert('Error al conectar con el servidor');
    }
  };

  const handleRejectPost = async (postId) => {
    const reason = prompt('¿Por qué rechazas este post? (opcional)');

    try {
      const response = await fetch(`${API_URL}/api/posts/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          approverId: currentUser.email,
          reason
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Post rechazado');
        loadPendingApprovals();
        loadPosts(currentUser.email);
      } else {
        alert(data.error || 'Error al rechazar post');
      }
    } catch (error) {
      console.error('Reject post error:', error);
      alert('Error al conectar con el servidor');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();

    if (!newUserForm.fullName || !newUserForm.email || !newUserForm.password) {
      alert('Por favor, completa todos los campos');
      return;
    }

    if (newUserForm.password.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/admin/create-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: newUserForm.fullName,
          email: newUserForm.email,
          password: newUserForm.password,
          role: newUserForm.role,
          adminKey: 'rubicon2026admin'
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message || '¡Usuario creado exitosamente!');
        setNewUserForm({ fullName: '', email: '', password: '', role: 'collaborator' });
        loadAllUsers(); // Reload users list
      } else {
        alert(data.error || 'Error al crear usuario');
      }
    } catch (error) {
      console.error('Create user error:', error);
      alert('Error al conectar con el servidor');
    }
  };

  const handleMediaUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (200MB max for LinkedIn, Facebook allows more)
      const maxSize = 200 * 1024 * 1024; // 200MB in bytes
      if (file.size > maxSize) {
        alert('El archivo es demasiado grande. El tamaño máximo es 200MB.');
        return;
      }

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
      // Publicar en el backend (que publicará en Facebook/LinkedIn)
      const response = await fetch(`${API_URL}/api/post-now`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.email,
          postData: currentPost
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al publicar');
      }

      alert('¡Publicado con éxito en tus redes sociales!');
      loadPosts(currentUser.email);
      setShowComposer(false);
      resetCurrentPost();
      setShowActionMenu(false);
    } catch (error) {
      console.error('Error:', error);
      alert(`Error al publicar: ${error.message}`);
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
      const response = await fetch(`${API_URL}/api/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.email,
          postData: currentPost
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al programar');
      }

      alert(`¡Publicación programada para ${currentPost.scheduleDate} a las ${currentPost.scheduleTime}!`);
      loadPosts(currentUser.email);
      setShowComposer(false);
      resetCurrentPost();
      setShowActionMenu(false);
    } catch (error) {
      console.error('Error:', error);
      alert(`Error al programar: ${error.message}`);
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
      const response = await fetch(`${API_URL}/api/drafts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.email,
          postData: currentPost
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al guardar borrador');
      }

      alert('¡Borrador guardado con éxito!');
      loadPosts(currentUser.email);
      setShowComposer(false);
      resetCurrentPost();
      setShowActionMenu(false);
    } catch (error) {
      console.error('Error:', error);
      alert(`Error al guardar borrador: ${error.message}`);
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
      id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` // Unique ID
    });
  };

  // Eliminar un post individual
  const handleDeletePost = async (postId, postStatus) => {
    const statusText = postStatus === 'published' ? 'publicada' : postStatus === 'scheduled' ? 'programada' : 'borrador';
    if (!confirm(`¿Estás seguro de eliminar esta publicación ${statusText}? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/posts/${postId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Error al eliminar la publicación');
      }

      alert('Publicación eliminada con éxito');
      loadPosts(currentUser.email);
    } catch (error) {
      console.error('Error:', error);
      alert(`Error al eliminar: ${error.message}`);
    }
  };

  // Alternar modo de selección
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedPosts([]); // Limpiar selección al cambiar de modo
  };

  // Seleccionar/deseleccionar un post
  const togglePostSelection = (postId) => {
    if (selectedPosts.includes(postId)) {
      setSelectedPosts(selectedPosts.filter(id => id !== postId));
    } else {
      setSelectedPosts([...selectedPosts, postId]);
    }
  };

  // Eliminar posts seleccionados
  const handleDeleteSelected = async () => {
    if (selectedPosts.length === 0) {
      alert('No hay publicaciones seleccionadas');
      return;
    }

    if (!confirm(`¿Estás seguro de eliminar ${selectedPosts.length} publicación${selectedPosts.length > 1 ? 'es' : ''}? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      // Eliminar todos los posts seleccionados
      await Promise.all(
        selectedPosts.map(postId =>
          fetch(`${API_URL}/api/posts/${postId}`, { method: 'DELETE' })
        )
      );

      alert(`${selectedPosts.length} publicación${selectedPosts.length > 1 ? 'es eliminadas' : ' eliminada'} con éxito`);
      setSelectedPosts([]);
      setSelectionMode(false);
      loadPosts(currentUser.email);
    } catch (error) {
      console.error('Error:', error);
      alert(`Error al eliminar publicaciones: ${error.message}`);
    }
  };

  const connectAccount = (platform) => {
    window.location.href = `${API_URL}/auth/${platform}?userId=${currentUser.email}`;
  };

  const disconnectAccount = async (platform) => {
    // Solo admins pueden desconectar
    if (currentUser.role !== 'admin') {
      alert('Solo los administradores pueden desconectar cuentas');
      return;
    }

    const platformName = platform === 'facebook' ? 'Facebook' : 'LinkedIn';

    // Advertencia: desconectar afecta a todos los usuarios
    if (!confirm(`¿Estás seguro de desconectar ${platformName}?\n\nEsto desconectará ${platformName} para TODOS los usuarios de la aplicación.`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.email,
          platform: platform
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert(`${platformName} desconectado exitosamente para todos los usuarios`);
        checkConnections(currentUser.email);
      } else {
        alert(data.error || 'Error al desconectar la cuenta');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al desconectar la cuenta');
    }
  };

  // Helper function to get user name from email
  const getUserName = (email) => {
    const user = allUsers.find(u => u.email === email);
    return user ? user.fullName : email;
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
                <div key={post.id} className="text-xs bg-[#0050cb] text-white rounded px-2 py-1 truncate cursor-pointer hover:bg-[#0050cb]" onClick={() => {
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
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Lado Izquierdo - Branding Corporativo */}
        <div className="hidden lg:flex lg:w-1/2 bg-white p-12 flex-col justify-center items-center border-r shadow-lg">
          <div className="max-w-lg">
            <img src={CBCLogo} alt="Core Business Corp" className="h-16 mb-8" />
            <h1 className="text-4xl font-bold mb-4 text-[#0f2842]">Social Media Planner</h1>
            <p className="text-lg text-gray-600 mb-12">Gestiona tus redes sociales de manera profesional desde una sola plataforma.</p>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-[#0050cb]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                </div>
                <div>
                  <h3 className="font-semibold text-[#0f2842] mb-1">Publicación multiplataforma</h3>
                  <p className="text-sm text-gray-600">Publica en Facebook y LinkedIn simultáneamente</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-[#0050cb]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#0f2842] mb-1">Programación inteligente</h3>
                  <p className="text-sm text-gray-600">Planifica tu contenido con anticipación</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#0f2842] mb-1">Vista de calendario</h3>
                  <p className="text-sm text-gray-600">Visualiza y gestiona tus publicaciones</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lado Derecho - Login */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Logo móvil */}
            <div className="lg:hidden mb-8 text-center">
              <img src={CBCLogo} alt="Core Business Corp" className="h-12 mx-auto mb-4" />
            </div>

            <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-[#0f2842] mb-2">
                  {authMode === 'signin' ? 'Iniciar Sesión' : 'Crear Cuenta'}
                </h2>
                <p className="text-gray-600">
                  {authMode === 'signin' ? 'Accede a tu cuenta corporativa' : 'Regístrate con tu correo corporativo'}
                </p>
              </div>

              <div className="flex gap-2 mb-6 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setAuthMode('signin')}
                  className={`flex-1 py-2.5 rounded-md font-medium transition-all ${
                    authMode === 'signin' ? 'bg-white text-[#0050cb] shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Ingresar
                </button>
                <button
                  onClick={() => setAuthMode('signup')}
                  className={`flex-1 py-2.5 rounded-md font-medium transition-all ${
                    authMode === 'signup' ? 'bg-white text-[#0050cb] shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Registrarse
                </button>
              </div>

              <form onSubmit={handleAuth} className="space-y-4">
                {authMode === 'signup' && (
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700">Nombre Completo</label>
                    <input
                      type="text"
                      value={authForm.fullName}
                      onChange={(e) => setAuthForm({...authForm, fullName: e.target.value})}
                      placeholder="Juan Pérez"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0050cb] focus:border-transparent outline-none transition-all"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Correo Electrónico Corporativo</label>
                  <input
                    type="email"
                    value={authForm.email}
                    onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
                    placeholder="usuario@corebusinesscorp.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0050cb] focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Contraseña</label>
                  <input
                    type="password"
                    value={authForm.password}
                    onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0050cb] focus:border-transparent outline-none transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#0050cb] text-white py-3.5 rounded-lg hover:bg-[#0f2842] transition-colors font-semibold shadow-lg hover:shadow-xl"
                >
                  {authMode === 'signin' ? 'Iniciar Sesión' : 'Crear Cuenta'}
                </button>
              </form>
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
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-1.5">
              <img src={RubiconLogo} alt="Rubicon Core" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="font-bold text-[#0f2842]">Rubicon Core</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Core Business Corp.</div>
            </div>
          </div>
        </div>
        <div className="p-4">
          <button onClick={() => {
            resetCurrentPost();
            setShowComposer(true);
          }} className="w-full bg-[#0050cb] text-white px-4 py-3 rounded-lg hover:bg-[#0050cb] transition-colors flex items-center justify-center gap-2 font-medium">
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
              <span className="bg-[#0050cb] text-white text-xs font-bold px-2 py-0.5 rounded-full">{stats.drafts}</span>
            )}
          </button>
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => {
                setCurrentPage('approvals');
                loadPendingApprovals();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${currentPage === 'approvals' ? 'bg-[#d9e8fc] text-[#0050cb]' : 'text-[#606060] hover:bg-gray-50'}`}
            >
              <CheckCircle className="w-5 h-5" />
              <span className="flex-1 text-left">Aprobaciones</span>
              {pendingApprovals.length > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{pendingApprovals.length}</span>
              )}
            </button>
          )}
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

            {/* Card for Collaborator's Pending Approvals */}
            {currentUser?.role === 'collaborator' && myPendingApprovals.length > 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 mb-6 border-2 border-blue-200">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#0f2842]">Publicaciones en Espera de Aprobación</h3>
                    <p className="text-sm text-gray-600">Tienes {myPendingApprovals.length} publicación(es) pendiente(s)</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {myPendingApprovals.map(post => (
                    <div key={post.id} className="bg-white rounded-lg p-4 border shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex gap-2">
                          {post.platforms?.facebook && <div className="w-6 h-6 bg-blue-50 rounded flex items-center justify-center"><Facebook className="w-4 h-4 text-blue-600" /></div>}
                          {post.platforms?.linkedin && <div className="w-6 h-6 bg-blue-50 rounded flex items-center justify-center"><Linkedin className="w-4 h-4 text-blue-700" /></div>}
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          post.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-700' :
                          post.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {post.status === 'pending_approval' ? 'Esperando aprobación' :
                           post.status === 'rejected' ? 'Rechazada' : post.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800 mb-2 line-clamp-2">{post.caption}</p>
                      {post.scheduleDate && <p className="text-xs text-gray-500">Programado: {post.scheduleDate} {post.scheduleTime}</p>}
                      {post.status === 'rejected' && post.approvalStatus?.rejectedReason && (
                        <div className="mt-2 p-2 bg-red-50 border-l-4 border-red-500 rounded">
                          <p className="text-xs text-red-700"><strong>Motivo:</strong> {post.approvalStatus.rejectedReason}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                  <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-[#0f2842]">
                      {filterView === 'all' && 'Todas las Publicaciones'}
                      {filterView === 'scheduled' && 'Publicaciones Programadas'}
                      {filterView === 'published' && 'Publicaciones Realizadas'}
                      {filterView === 'drafts' && 'Borradores'}
                    </h2>
                    {!selectionMode && filterView !== 'drafts' && (
                      <button
                        onClick={toggleSelectionMode}
                        className="text-sm px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                      >
                        Seleccionar
                      </button>
                    )}
                    {selectionMode && (
                      <>
                        <button
                          onClick={handleDeleteSelected}
                          disabled={selectedPosts.length === 0}
                          className="text-sm px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          Eliminar ({selectedPosts.length})
                        </button>
                        <button
                          onClick={toggleSelectionMode}
                          className="text-sm px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                        >
                          Cancelar
                        </button>
                      </>
                    )}
                  </div>
                  <button onClick={() => { setFilterView(null); setSelectionMode(false); setSelectedPosts([]); }} className="text-gray-400 hover:text-gray-600">
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
                          <div key={post.id} className={`border rounded-lg p-4 transition-all ${!selectionMode ? 'hover:shadow-md cursor-pointer' : ''}`}>
                            <div className="flex items-start gap-3">
                              {/* Checkbox en modo selección */}
                              {selectionMode && (
                                <input
                                  type="checkbox"
                                  checked={selectedPosts.includes(post.id)}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    togglePostSelection(post.id);
                                  }}
                                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                              )}
                              {/* Contenido del post */}
                              <div className="flex-1" onClick={() => {
                                if (!selectionMode) {
                                  setCurrentPost(post);
                                  setShowComposer(true);
                                }
                              }}>
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex gap-2">
                                    {post.platforms.facebook && <div className="w-6 h-6 bg-blue-50 rounded flex items-center justify-center"><Facebook className="w-4 h-4 text-blue-600" /></div>}
                                    {post.platforms.linkedin && <div className="w-6 h-6 bg-blue-50 rounded flex items-center justify-center"><Linkedin className="w-4 h-4 text-blue-700" /></div>}
                                  </div>
                                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                    post.status === 'published' ? 'bg-green-100 text-green-700' :
                                    post.status === 'scheduled' ? 'bg-orange-100 text-orange-700' :
                                    post.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-purple-100 text-purple-700'
                                  }`}>
                                    {post.status === 'published' ? 'Publicada' :
                                     post.status === 'scheduled' ? 'Programada' :
                                     post.status === 'pending_approval' ? 'Pendiente' :
                                     'Borrador'}
                                  </span>
                                </div>
                                <p className="text-gray-700 line-clamp-2 mb-2">{post.caption}</p>
                                <div className="flex items-center gap-3 flex-wrap">
                                  {post.scheduleDate && (
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                      <Clock className="w-4 h-4" />
                                      <span>{post.scheduleDate} {post.scheduleTime}</span>
                                    </div>
                                  )}
                                  {post.userId && (
                                    <div className="text-xs text-gray-500">
                                      Por: <span className="font-medium text-gray-700">{getUserName(post.userId)}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {/* Botón eliminar individual (solo fuera de modo selección) */}
                              {!selectionMode && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeletePost(post.id, post.status);
                                  }}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Eliminar publicación"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
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
                <button onClick={() => {
                  resetCurrentPost();
                  setShowComposer(true);
                }} className="px-6 py-3 bg-[#0050cb] text-white rounded-lg hover:bg-[#0050cb] transition-colors inline-flex items-center gap-2">
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
                <button onClick={() => {
                  resetCurrentPost();
                  setShowComposer(true);
                }} className="px-6 py-3 bg-[#0050cb] text-white rounded-lg hover:bg-[#0050cb] transition-colors inline-flex items-center gap-2">
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
                    {post.hasMedia && (
                      <div className="w-full h-48 bg-gray-100 rounded-lg mb-4 flex items-center justify-center text-gray-400">
                        <span className="text-sm">📷 Imagen/Video adjunto</span>
                      </div>
                    )}
                    <div className="flex gap-3 pt-4 border-t">
                      <button
                        onClick={async () => {
                          // Load media if post has it
                          if (post.hasMedia) {
                            const media = await loadPostMedia(post.id);
                            setCurrentPost({ ...post, media });
                          } else {
                            setCurrentPost(post);
                          }
                          setShowComposer(true);
                        }}
                        className="flex-1 px-4 py-2 bg-[#0050cb] text-white rounded-lg hover:bg-[#0f2842] transition-colors font-medium"
                      >
                        Editar y Publicar
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm('¿Estás seguro de eliminar este borrador?')) {
                            try {
                              const response = await fetch(`${API_URL}/api/posts/${post.id}`, {
                                method: 'DELETE'
                              });
                              if (response.ok) {
                                loadPosts(currentUser.email);
                              } else {
                                alert('Error al eliminar el borrador');
                              }
                            } catch (error) {
                              console.error('Error:', error);
                              alert('Error al eliminar el borrador');
                            }
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
                <p className="text-[#0f2842] text-sm opacity-80">Para habilitar conexiones reales con Facebook y LinkedIn, es necesario configurar las credenciales de API.</p>
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
                      <p className="text-sm text-gray-600">Conecta tu página de Facebook para programar publicaciones</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {connectedAccounts.facebook ? (
                      <>
                        <div className="px-6 py-2 rounded-lg font-medium bg-green-50 text-green-700 border border-green-300">
                          ✓ Conectado
                        </div>
                        {currentUser.role === 'admin' && (
                          <button
                            onClick={() => disconnectAccount('facebook')}
                            className="px-4 py-2 rounded-lg font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-all"
                          >
                            Desconectar
                          </button>
                        )}
                      </>
                    ) : (
                      currentUser.role === 'admin' && (
                        <button
                          onClick={() => connectAccount('facebook')}
                          className="px-6 py-2 rounded-lg font-medium bg-[#0050cb] text-white hover:bg-[#0f2842] transition-all"
                        >
                          Conectar Facebook
                        </button>
                      )
                    )}
                  </div>
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
                      <p className="text-sm text-gray-600">Conecta tu perfil profesional de LinkedIn para programar publicaciones</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {connectedAccounts.linkedin ? (
                      <>
                        <div className="px-6 py-2 rounded-lg font-medium bg-green-50 text-green-700 border border-green-300">
                          ✓ Conectado
                        </div>
                        {currentUser.role === 'admin' && (
                          <button
                            onClick={() => disconnectAccount('linkedin')}
                            className="px-4 py-2 rounded-lg font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-all"
                          >
                            Desconectar
                          </button>
                        )}
                      </>
                    ) : (
                      currentUser.role === 'admin' && (
                        <button
                          onClick={() => connectAccount('linkedin')}
                          className="px-6 py-2 rounded-lg font-medium bg-[#0050cb] text-white hover:bg-[#0f2842] transition-all"
                        >
                          Conectar LinkedIn
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentPage === 'approvals' && currentUser?.role === 'admin' && (
          <div>
            <h1 className="text-3xl font-bold mb-2 text-[#0f2842]">Aprobaciones Pendientes</h1>
            <p className="text-gray-600 mb-8">Revisa y aprueba publicaciones solicitadas por colaboradores</p>

            {pendingApprovals.length === 0 ? (
              <div className="bg-white rounded-lg p-12 text-center border shadow-sm">
                <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No hay aprobaciones pendientes</h3>
                <p className="text-gray-500">Todas las publicaciones han sido revisadas</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingApprovals.map(post => (
                  <div key={post.id} className="bg-white rounded-lg p-6 border shadow-sm">
                    <div className="flex gap-6">
                      {/* Preview */}
                      <div className="w-1/3">
                        {post.hasMedia ? (
                          <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                            <span className="text-sm">📷 Media adjunto</span>
                          </div>
                          )
                        ) : (
                          <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-8 h-8 text-gray-300" />
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-medium text-gray-600">Solicitado por:</span>
                              <span className="text-sm font-semibold text-[#0f2842]">{post.approvalStatus.requestedBy}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(post.approvalStatus.requestedAt).toLocaleString('es-ES')}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {post.platforms.facebook && (
                              <div className="bg-blue-100 p-2 rounded">
                                <Facebook className="w-4 h-4 text-blue-600" />
                              </div>
                            )}
                            {post.platforms.linkedin && (
                              <div className="bg-blue-100 p-2 rounded">
                                <Linkedin className="w-4 h-4 text-blue-700" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Caption */}
                        <div className="bg-gray-50 rounded-lg p-4 mb-3">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{post.caption}</p>
                        </div>

                        {/* Schedule Info */}
                        {post.scheduleDate && post.scheduleTime && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                            <Clock className="w-4 h-4" />
                            <span>Programado para: {post.scheduleDate} a las {post.scheduleTime}</span>
                          </div>
                        )}

                        {/* Note */}
                        {post.approvalStatus.note && (
                          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-3">
                            <div className="text-xs font-semibold text-yellow-800 mb-1">Nota del colaborador:</div>
                            <p className="text-sm text-yellow-700">{post.approvalStatus.note}</p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 pt-3">
                          <button
                            onClick={() => handleApprovePost(post.id)}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Aprobar y Programar
                          </button>
                          <button
                            onClick={() => handleRejectPost(post.id)}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2"
                          >
                            <X className="w-4 h-4" />
                            Rechazar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                    <label className="block text-sm font-medium mb-2 text-[#606060]">Nombre Completo</label>
                    <input type="text" value={currentUser?.fullName} disabled className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-gray-500" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-6 border shadow-sm">
                <h3 className="font-semibold text-lg mb-4">Cambiar Contraseña</h3>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const currentPassword = e.target.currentPassword.value;
                  const newPassword = e.target.newPassword.value;
                  const confirmPassword = e.target.confirmPassword.value;

                  if (!currentPassword || !newPassword || !confirmPassword) {
                    alert('Por favor, completa todos los campos');
                    return;
                  }

                  if (newPassword !== confirmPassword) {
                    alert('Las contraseñas nuevas no coinciden');
                    return;
                  }

                  if (newPassword.length < 6) {
                    alert('La nueva contraseña debe tener al menos 6 caracteres');
                    return;
                  }

                  try {
                    const response = await fetch(`${API_URL}/api/update-password`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        email: currentUser.email,
                        currentPassword,
                        newPassword
                      })
                    });

                    const data = await response.json();

                    if (response.ok) {
                      const updatedUser = data.user;
                      setCurrentUser(updatedUser);
                      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
                      alert('¡Contraseña actualizada exitosamente!');
                      e.target.reset();
                    } else {
                      alert(data.error || 'Error al actualizar la contraseña');
                    }
                  } catch (error) {
                    console.error('Password update error:', error);
                    alert('Error al conectar con el servidor');
                  }
                }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-[#606060]">Contraseña Actual</label>
                    <input type="password" name="currentPassword" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0050cb] outline-none" placeholder="Ingresa tu contraseña actual" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-[#606060]">Nueva Contraseña</label>
                    <input type="password" name="newPassword" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0050cb] outline-none" placeholder="Mínimo 6 caracteres" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-[#606060]">Confirmar Nueva Contraseña</label>
                    <input type="password" name="confirmPassword" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0050cb] outline-none" placeholder="Repite la nueva contraseña" />
                  </div>
                  <button type="submit" className="px-6 py-2 bg-[#0050cb] text-white rounded-lg hover:bg-[#0f2842] transition-colors font-medium">Actualizar Contraseña</button>
                </form>
              </div>

              {/* Crear Nuevo Usuario - Solo Admin */}
              {currentUser?.role === 'admin' && (
                <div className="bg-white rounded-lg p-6 border shadow-sm">
                  <h3 className="font-semibold text-lg mb-4">Crear Nuevo Usuario</h3>
                  <form onSubmit={handleCreateUser} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-[#606060]">Nombre Completo</label>
                        <input
                          type="text"
                          value={newUserForm.fullName}
                          onChange={(e) => setNewUserForm({ ...newUserForm, fullName: e.target.value })}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0050cb] outline-none"
                          placeholder="Ej: Juan Pérez"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-[#606060]">Correo Corporativo</label>
                        <input
                          type="email"
                          value={newUserForm.email}
                          onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0050cb] outline-none"
                          placeholder="usuario@corebusinesscorp.com"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-[#606060]">Contraseña</label>
                        <input
                          type="text"
                          value={newUserForm.password}
                          onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0050cb] outline-none"
                          placeholder="Mínimo 6 caracteres"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-[#606060]">Rol</label>
                        <select
                          value={newUserForm.role}
                          onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0050cb] outline-none"
                        >
                          <option value="collaborator">Colaborador</option>
                          <option value="admin">Administrador</option>
                        </select>
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      Crear Usuario
                    </button>
                    <p className="text-xs text-gray-500">
                      💡 El usuario recibirá sus credenciales y podrá acceder con el email y contraseña proporcionados.
                    </p>
                  </form>
                </div>
              )}

              {/* Gestión de Usuarios - Solo visible para Admin */}
              {currentUser?.role === 'admin' && (
                <div className="bg-white rounded-lg p-6 border shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-lg">Lista de Usuarios</h3>
                    <button
                      onClick={loadAllUsers}
                      className="text-sm px-4 py-2 bg-[#0050cb] text-white rounded-lg hover:bg-[#0f2842] transition-colors"
                    >
                      Recargar Lista
                    </button>
                  </div>
                  <div className="space-y-3">
                    {allUsers.length === 0 ? (
                      <p className="text-gray-500 text-sm">Haz clic en "Recargar Lista" para ver todos los usuarios</p>
                    ) : (
                      allUsers.map(user => (
                        <div key={user.email} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                          <div className="flex-1">
                            <div className="font-medium text-[#0f2842]">{user.fullName}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              user.role === 'admin'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {user.role === 'admin' ? 'Administrador' : 'Colaborador'}
                            </span>
                            {user.email !== currentUser.email && (
                              <>
                                <select
                                  value={user.role}
                                  onChange={(e) => updateUserRole(user.email, e.target.value)}
                                  className="px-3 py-1 border rounded-lg text-sm focus:ring-2 focus:ring-[#0050cb] outline-none"
                                >
                                  <option value="admin">Administrador</option>
                                  <option value="collaborator">Colaborador</option>
                                </select>
                                <button
                                  onClick={() => deleteUser(user.email, user.fullName)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Eliminar usuario"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {user.email === currentUser.email && (
                              <span className="text-xs text-gray-400">(Tú)</span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal del Compositor - Diseño Profesional de 2 Columnas */}
      {showComposer && (
        <div className="fixed inset-0 bg-[#0f2842] bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-6xl w-full h-[90vh] shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b flex justify-between items-center bg-white">
              <h2 className="text-xl font-bold text-[#0f2842]">Nueva Publicación</h2>
              <button onClick={() => {
                setShowComposer(false);
                resetCurrentPost();
              }} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Contenido Principal - 2 Columnas */}
            <div className="flex-1 flex overflow-hidden">
              {/* Columna Izquierda - Editor */}
              <div className="flex-1 overflow-y-auto p-6 border-r">
                <div className="space-y-6 max-w-xl">
                  {/* Selección de Plataformas */}
                  <div>
                    <label className="block text-sm font-semibold mb-3 text-[#0f2842]">Publicar en</label>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setCurrentPost({...currentPost, platforms: {...currentPost.platforms, facebook: !currentPost.platforms.facebook}});
                          if (!currentPost.platforms.facebook) setPreviewPlatform('facebook');
                        }}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all font-medium ${
                          currentPost.platforms.facebook
                            ? 'border-[#1877f2] bg-[#1877f2] text-white'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <Facebook className="w-5 h-5" />
                        Facebook
                      </button>
                      <button
                        onClick={() => {
                          setCurrentPost({...currentPost, platforms: {...currentPost.platforms, linkedin: !currentPost.platforms.linkedin}});
                          if (!currentPost.platforms.linkedin) setPreviewPlatform('linkedin');
                        }}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all font-medium ${
                          currentPost.platforms.linkedin
                            ? 'border-[#0a66c2] bg-[#0a66c2] text-white'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <Linkedin className="w-5 h-5" />
                        LinkedIn
                      </button>
                    </div>
                  </div>

                  {/* Contenido */}
                  <div>
                    <label className="block text-sm font-semibold mb-3 text-[#0f2842]">Contenido</label>
                    <textarea
                      value={currentPost.caption}
                      onChange={(e) => setCurrentPost({...currentPost, caption: e.target.value})}
                      placeholder="¿Qué quieres compartir hoy?"
                      className="w-full border border-gray-300 rounded-lg p-4 h-40 resize-none focus:ring-2 focus:ring-[#0050cb] focus:border-transparent outline-none"
                    />
                    <div className="text-xs text-gray-500 mt-2">{currentPost.caption.length} caracteres</div>
                  </div>

                  {/* Multimedia */}
                  <div>
                    <label className="block text-sm font-semibold mb-3 text-[#0f2842]">Multimedia</label>
                    {currentPost.media ? (
                      <div className="relative">
                        {currentPost.media.startsWith('data:video') ? (
                          <video src={currentPost.media} controls className="w-full h-64 object-cover rounded-lg" />
                        ) : (
                          <img src={currentPost.media} alt="Preview" className="w-full h-64 object-cover rounded-lg" />
                        )}
                        <button
                          onClick={() => setCurrentPost({...currentPost, media: null})}
                          className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-[#0050cb] hover:bg-gray-50 transition-all">
                        <Plus className="w-10 h-10 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600 font-medium">Añadir imagen o video</span>
                        <span className="text-xs text-gray-400 mt-1">PNG, JPG, MP4, MOV (max. 200MB)</span>
                        <input type="file" accept="image/*,video/*" onChange={handleMediaUpload} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* Columna Derecha - Preview */}
              <div className="w-[45%] bg-gray-50 overflow-y-auto p-6">
                <div className="sticky top-0 bg-gray-50 pb-4">
                  <h3 className="text-sm font-semibold text-[#0f2842] mb-3">Vista Previa</h3>

                  {/* Pestañas de Plataforma */}
                  <div className="flex gap-2 mb-4">
                    {currentPost.platforms.facebook && (
                      <button
                        onClick={() => setPreviewPlatform('facebook')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          previewPlatform === 'facebook'
                            ? 'bg-white text-[#1877f2] shadow-sm'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <Facebook className="w-4 h-4" />
                        Facebook
                      </button>
                    )}
                    {currentPost.platforms.linkedin && (
                      <button
                        onClick={() => setPreviewPlatform('linkedin')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          previewPlatform === 'linkedin'
                            ? 'bg-white text-[#0a66c2] shadow-sm'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <Linkedin className="w-4 h-4" />
                        LinkedIn
                      </button>
                    )}
                  </div>
                </div>

                {/* Preview Card */}
                {!currentPost.platforms.facebook && !currentPost.platforms.linkedin ? (
                  <div className="bg-white rounded-lg p-12 text-center border-2 border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BarChart3 className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-gray-500 text-sm">Selecciona una plataforma para ver el preview</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-md overflow-hidden border">
                    {/* Facebook Preview */}
                    {previewPlatform === 'facebook' && currentPost.platforms.facebook && (
                      <div>
                        {/* Header del post */}
                        <div className="p-4 flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#d9e8fc] rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-[#0050cb]">C</span>
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-sm text-gray-900">Core Business Corp</div>
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              Ahora · <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 9V6h2v3h3v2h-3v3H9v-3H6V9h3z"/></svg>
                            </div>
                          </div>
                        </div>

                        {/* Contenido */}
                        <div className="px-4 pb-3">
                          <p className="text-gray-800 text-sm whitespace-pre-wrap">
                            {currentPost.caption || <span className="text-gray-400 italic">Tu contenido aparecerá aquí...</span>}
                          </p>
                        </div>

                        {/* Media */}
                        {currentPost.media && (
                          <div className="relative">
                            {currentPost.media.startsWith('data:video') ? (
                              <video src={currentPost.media} controls className="w-full" />
                            ) : (
                              <img src={currentPost.media} alt="Post media" className="w-full" />
                            )}
                          </div>
                        )}

                        {/* Acciones */}
                        <div className="border-t px-4 py-2 flex items-center justify-around text-gray-600">
                          <div className="flex items-center gap-2 text-sm hover:bg-gray-100 px-4 py-2 rounded cursor-pointer">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
                            Me gusta
                          </div>
                          <div className="flex items-center gap-2 text-sm hover:bg-gray-100 px-4 py-2 rounded cursor-pointer">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                            Comentar
                          </div>
                          <div className="flex items-center gap-2 text-sm hover:bg-gray-100 px-4 py-2 rounded cursor-pointer">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                            Compartir
                          </div>
                        </div>
                      </div>
                    )}

                    {/* LinkedIn Preview */}
                    {previewPlatform === 'linkedin' && currentPost.platforms.linkedin && (
                      <div>
                        {/* Header del post */}
                        <div className="p-4 flex items-start gap-3">
                          <div className="w-12 h-12 bg-[#d9e8fc] rounded-full flex items-center justify-center">
                            <span className="text-base font-bold text-[#0050cb]">C</span>
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-sm text-gray-900">Core Business Corp</div>
                            <div className="text-xs text-gray-600">Empresa</div>
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              Ahora · <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 16 16"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zM3 8a5 5 0 1110 0A5 5 0 013 8z"/></svg>
                            </div>
                          </div>
                          <button className="text-gray-500 hover:bg-gray-100 p-1 rounded">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 16 16"><path d="M3 9.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm5 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm5 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3z"/></svg>
                          </button>
                        </div>

                        {/* Contenido */}
                        <div className="px-4 pb-3">
                          <p className="text-gray-800 text-sm whitespace-pre-wrap">
                            {currentPost.caption || <span className="text-gray-400 italic">Tu contenido aparecerá aquí...</span>}
                          </p>
                        </div>

                        {/* Media */}
                        {currentPost.media && (
                          <div className="relative bg-gray-100">
                            {currentPost.media.startsWith('data:video') ? (
                              <video src={currentPost.media} controls className="w-full" />
                            ) : (
                              <img src={currentPost.media} alt="Post media" className="w-full" />
                            )}
                          </div>
                        )}

                        {/* Stats y Acciones */}
                        <div className="px-4 py-2 border-t">
                          <div className="flex items-center justify-between text-xs text-gray-600 pb-2">
                            <div className="flex items-center gap-1">
                              <div className="flex -space-x-1">
                                <div className="w-4 h-4 bg-[#0a66c2] rounded-full border border-white flex items-center justify-center">
                                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 16 16"><path d="M8 3.5l.964 2.952h3.104l-2.51 1.824.96 2.952L8 9.404l-2.518 1.824.96-2.952-2.51-1.824h3.104z"/></svg>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="border-t pt-1 flex items-center justify-around text-gray-600">
                            <button className="flex items-center gap-2 text-sm hover:bg-gray-100 px-4 py-2 rounded">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
                              Recomendar
                            </button>
                            <button className="flex items-center gap-2 text-sm hover:bg-gray-100 px-4 py-2 rounded">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                              Comentar
                            </button>
                            <button className="flex items-center gap-2 text-sm hover:bg-gray-100 px-4 py-2 rounded">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                              Compartir
                            </button>
                            <button className="flex items-center gap-2 text-sm hover:bg-gray-100 px-4 py-2 rounded">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                              Enviar
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer con Botones de Acción */}
            <div className="border-t px-6 py-4 bg-gray-50 flex items-center justify-between">
              <button
                onClick={() => {
                  setShowComposer(false);
                  resetCurrentPost();
                }}
                className="px-5 py-2.5 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>

              {/* Botón Split con Dropdown */}
              <div className="relative">
                <div className="flex gap-0 shadow-lg rounded-lg overflow-hidden">
                  {/* Botón Principal - Siempre dice "Publicar" */}
                  <button
                    onClick={() => setShowActionMenu(!showActionMenu)}
                    disabled={loading || !currentPost.caption || (!currentPost.platforms.facebook && !currentPost.platforms.linkedin)}
                    className="px-6 py-2.5 bg-[#0050cb] text-white font-semibold hover:bg-[#0f2842] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Publicando...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Publicar
                      </>
                    )}
                  </button>

                  {/* Botón Dropdown */}
                  <button
                    onClick={() => setShowActionMenu(!showActionMenu)}
                    disabled={loading || !currentPost.caption || (!currentPost.platforms.facebook && !currentPost.platforms.linkedin)}
                    className="px-3 bg-[#0050cb] text-white hover:bg-[#0f2842] border-l border-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className={`w-4 h-4 transition-transform ${showActionMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {/* Menú Dropdown */}
                {showActionMenu && (
                  <div className="absolute bottom-full right-0 mb-2 w-72 bg-white rounded-lg shadow-xl border overflow-hidden z-10">
                    <button
                      onClick={() => {
                        handlePublishNow();
                        setShowActionMenu(false);
                      }}
                      disabled={loading || !currentPost.platforms.facebook && !currentPost.platforms.linkedin}
                      className="w-full px-5 py-3 text-left hover:bg-gray-50 transition-colors flex items-start gap-3 border-b disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-5 h-5 text-[#0050cb] mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">Publicar Ahora</div>
                        <div className="text-xs text-gray-500 mt-0.5">Publica inmediatamente en las plataformas seleccionadas</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setShowActionMenu(false);
                        setShowScheduleModal(true);
                      }}
                      disabled={loading || (!currentPost.platforms.facebook && !currentPost.platforms.linkedin)}
                      className="w-full px-5 py-3 text-left hover:bg-gray-50 transition-colors flex items-start gap-3 border-b disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Clock className="w-5 h-5 text-[#0050cb] mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">Programar Publicación</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {currentPost.scheduleDate && currentPost.scheduleTime
                            ? `Programado: ${currentPost.scheduleDate} a las ${currentPost.scheduleTime}`
                            : 'Elige fecha y hora para programar'}
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setShowApprovalModal(true);
                        setShowActionMenu(false);
                        loadAllUsers(); // Load admin users
                      }}
                      disabled={loading || !currentPost.platforms.facebook && !currentPost.platforms.linkedin}
                      className="w-full px-5 py-3 text-left hover:bg-gray-50 transition-colors flex items-start gap-3 border-b disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FileText className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">Enviar para Aprobación</div>
                        <div className="text-xs text-gray-500 mt-0.5">Solicita aprobación de un administrador antes de publicar</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        handleSaveDraft();
                        setShowActionMenu(false);
                      }}
                      disabled={loading}
                      className="w-full px-5 py-3 text-left hover:bg-gray-50 transition-colors flex items-start gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">Guardar Borrador</div>
                        <div className="text-xs text-gray-500 mt-0.5">Guarda tu publicación para editarla más tarde</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Programación */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]" onClick={() => setShowScheduleModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-[#0f2842]">Programar Publicación</h2>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Fecha */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-[#0f2842]">Fecha</label>
                <input
                  type="date"
                  value={currentPost.scheduleDate}
                  onChange={(e) => setCurrentPost({...currentPost, scheduleDate: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#0050cb] focus:border-transparent"
                />
              </div>

              {/* Hora */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-[#0f2842]">Hora</label>
                <input
                  type="time"
                  value={currentPost.scheduleTime}
                  onChange={(e) => setCurrentPost({...currentPost, scheduleTime: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#0050cb] focus:border-transparent"
                />
              </div>

              {/* Resumen */}
              {currentPost.scheduleDate && currentPost.scheduleTime && (
                <div className="bg-[#0050cb]/10 border border-[#0050cb]/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-[#0050cb] mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-semibold text-[#0f2842]">Tu publicación se programará para:</div>
                      <div className="text-sm text-gray-700 mt-1">
                        {(() => {
                          const [year, month, day] = currentPost.scheduleDate.split('-');
                          const [hours, minutes] = currentPost.scheduleTime.split(':');
                          const date = new Date(year, month - 1, day);
                          const hour = parseInt(hours);
                          const ampm = hour >= 12 ? 'PM' : 'AM';
                          const displayHour = hour % 12 || 12;

                          return `${date.toLocaleDateString('es-PE', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })} a las ${displayHour}:${minutes} ${ampm}`;
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Botones */}
            <div className="border-t p-6 flex gap-3 justify-end">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-5 py-2.5 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (!currentPost.scheduleDate || !currentPost.scheduleTime) {
                    alert('Por favor, selecciona fecha y hora');
                    return;
                  }
                  handleSchedule();
                  setShowScheduleModal(false);
                }}
                disabled={!currentPost.scheduleDate || !currentPost.scheduleTime}
                className="px-6 py-2.5 bg-[#0050cb] text-white font-semibold rounded-lg hover:bg-[#4db85f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Clock className="w-5 h-5" />
                Programar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Enviar para Aprobación */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-[#0f2842] bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-[#0f2842]">Enviar para Aprobación</h3>
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  setApprovalData({ approverId: '', note: '' });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Selector de Aprobador */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-[#0f2842]">
                  Seleccionar Aprobador <span className="text-red-500">*</span>
                </label>
                <select
                  value={approvalData.approverId}
                  onChange={(e) => setApprovalData({ ...approvalData, approverId: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0050cb] outline-none"
                >
                  <option value="">Selecciona un administrador</option>
                  {allUsers.filter(u => u.role === 'admin').map(user => (
                    <option key={user.email} value={user.email}>
                      {user.fullName} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Fecha y Hora Programada */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-[#606060]">Fecha Deseada</label>
                  <input
                    type="date"
                    value={currentPost.scheduleDate}
                    onChange={(e) => setCurrentPost({ ...currentPost, scheduleDate: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0050cb] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-[#606060]">Hora Deseada</label>
                  <input
                    type="time"
                    value={currentPost.scheduleTime}
                    onChange={(e) => setCurrentPost({ ...currentPost, scheduleTime: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0050cb] outline-none"
                  />
                </div>
              </div>

              {/* Nota para el Aprobador */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-[#0f2842]">
                  Nota para el Aprobador (Opcional)
                </label>
                <textarea
                  value={approvalData.note}
                  onChange={(e) => setApprovalData({ ...approvalData, note: e.target.value })}
                  placeholder="Añade contexto o instrucciones especiales..."
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0050cb] outline-none resize-none"
                />
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowApprovalModal(false);
                    setApprovalData({ approverId: '', note: '' });
                  }}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSendForApproval}
                  disabled={!approvalData.approverId || loading}
                  className="flex-1 px-4 py-2 bg-[#0050cb] text-white rounded-lg hover:bg-[#0f2842] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Enviando...' : 'Enviar'}
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