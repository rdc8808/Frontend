import React, { useState, useEffect } from 'react';
import { Calendar, Facebook, Linkedin, Send, Plus, Settings, LogOut, BarChart3, Clock, X } from 'lucide-react';

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
    scheduleTime: ''
  });
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);

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
        alert('Please fill in all fields');
        return;
      }
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      if (users.find(u => u.email === authForm.email)) {
        alert('Email already exists');
        return;
      }
      users.push(authForm);
      localStorage.setItem('users', JSON.stringify(users));
      alert('Account created! Please sign in.');
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
        alert('Invalid credentials');
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
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error('Error:', error);
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

  const handlePostNow = async () => {
    if (!currentPost.caption) {
      alert('Please add a caption');
      return;
    }
    setLoading(true);
    try {
      await fetch(`${API_URL}/api/post-now`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.email, postData: currentPost })
      });
      alert('Posted!');
      loadPosts(currentUser.email);
      setShowComposer(false);
      setCurrentPost({ caption: '', media: null, platforms: { facebook: false, linkedin: false }, scheduleDate: '', scheduleTime: '' });
    } catch (error) {
      alert('Error');
    }
    setLoading(false);
  };

  const connectAccount = (platform) => {
    window.location.href = `${API_URL}/auth/${platform}?userId=${currentUser.email}`;
  };

  const stats = {
    total: posts.length,
    scheduled: posts.filter(p => p.status === 'scheduled').length,
    published: posts.filter(p => p.status === 'published').length
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
        <div key={`day-${day}`} className={`h-24 border-r border-b last:border-r-0 p-2 hover:bg-gray-50 ${isToday ? 'bg-teal-50' : 'bg-white'}`}>
          <div className={`font-semibold text-sm mb-1 ${isToday ? 'text-teal-600' : 'text-gray-700'}`}>{day}</div>
          {dayPosts.length > 0 && (
            <div className="space-y-1">
              {dayPosts.map(post => (
                <div key={post.id} className="text-xs bg-teal-500 text-white rounded px-2 py-1 truncate cursor-pointer hover:bg-teal-600" onClick={() => {
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
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-400 to-teal-600 text-white p-12 flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold">SocialScheduler</span>
          </div>
          <div>
            <h1 className="text-4xl font-bold mb-4">Schedule your social media posts with ease</h1>
            <p className="text-lg mb-8 text-teal-50">Plan, create, and schedule your content across multiple platforms from one place.</p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                </div>
                <span>Multi-platform posting</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <span>Smart scheduling</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <span>Visual calendar view</span>
              </div>
            </div>
          </div>
          <div className="text-sm text-teal-50">© 2025 SocialScheduler. All rights reserved.</div>
        </div>

        <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-3xl font-bold text-center mb-2">Welcome</h2>
              <p className="text-center text-gray-600 mb-6">Sign in to your account or create a new one</p>
              <div className="flex gap-2 mb-6">
                <button onClick={() => setAuthMode('signin')} className={`flex-1 py-3 rounded-lg font-medium ${authMode === 'signin' ? 'bg-gray-100' : 'text-gray-500'}`}>Sign In</button>
                <button onClick={() => setAuthMode('signup')} className={`flex-1 py-3 rounded-lg font-medium ${authMode === 'signup' ? 'bg-gray-100' : 'text-gray-500'}`}>Sign Up</button>
              </div>
              <div className="space-y-4">
                {authMode === 'signup' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Full Name</label>
                    <input type="text" value={authForm.fullName} onChange={(e) => setAuthForm({...authForm, fullName: e.target.value})} placeholder="John Doe" className="w-full px-4 py-3 border rounded-lg" />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input type="email" value={authForm.email} onChange={(e) => setAuthForm({...authForm, email: e.target.value})} placeholder="you@example.com" className="w-full px-4 py-3 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Password</label>
                  <input type="password" value={authForm.password} onChange={(e) => setAuthForm({...authForm, password: e.target.value})} placeholder="••••••••" className="w-full px-4 py-3 border rounded-lg" />
                </div>
                <button onClick={handleAuth} className="w-full bg-teal-500 text-white py-3 rounded-lg hover:bg-teal-600 font-medium">
                  {authMode === 'signin' ? 'Sign In' : 'Create Account'}
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
      <div className="w-64 bg-white border-r flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-bold">SocialScheduler</div>
              <div className="text-xs text-gray-500">Rubicon Core</div>
            </div>
          </div>
        </div>
        <div className="p-4">
          <button onClick={() => setShowComposer(true)} className="w-full bg-teal-500 text-white px-4 py-3 rounded-lg hover:bg-teal-600 flex items-center justify-center gap-2 font-medium">
            <Plus className="w-5 h-5" />Create Post
          </button>
        </div>
        <nav className="flex-1 px-3">
          <button onClick={() => setCurrentPage('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 ${currentPage === 'dashboard' ? 'bg-teal-50 text-teal-600' : 'text-gray-600 hover:bg-gray-50'}`}>
            <BarChart3 className="w-5 h-5" />Dashboard
          </button>
          <button onClick={() => setCurrentPage('calendar')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 ${currentPage === 'calendar' ? 'bg-teal-50 text-teal-600' : 'text-gray-600 hover:bg-gray-50'}`}>
            <Calendar className="w-5 h-5" />Calendar
          </button>
          <button onClick={() => setCurrentPage('connections')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 ${currentPage === 'connections' ? 'bg-teal-50 text-teal-600' : 'text-gray-600 hover:bg-gray-50'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
            Connections
          </button>
          <button onClick={() => setCurrentPage('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 ${currentPage === 'settings' ? 'bg-teal-50 text-teal-600' : 'text-gray-600 hover:bg-gray-50'}`}>
            <Settings className="w-5 h-5" />Settings
          </button>
        </nav>
        <div className="p-4 border-t">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-teal-600">{currentUser?.fullName?.[0] || 'U'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-700 truncate">{currentUser?.email}</div>
            </div>
            <button onClick={handleLogout} className="text-gray-400 hover:text-gray-600">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-8">
        {currentPage === 'dashboard' && (
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-gray-600 mb-8">Welcome back! Here's an overview of your scheduled content.</p>
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg p-6 border">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Total Posts</div>
                    <div className="text-2xl font-bold">{stats.total}</div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-6 border">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Scheduled</div>
                    <div className="text-2xl font-bold">{stats.scheduled}</div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-6 border">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Send className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Published</div>
                    <div className="text-2xl font-bold">{stats.published}</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-8 text-center">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No scheduled posts yet</h3>
              <p className="text-gray-600 mb-4">Create your first post to get started</p>
              <button onClick={() => setShowComposer(true)} className="px-6 py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 inline-flex items-center gap-2">
                <Plus className="w-5 h-5" />Create Post
              </button>
            </div>
          </div>
        )}

        {currentPage === 'calendar' && (
          <div>
            <h1 className="text-3xl font-bold mb-2">Calendar</h1>
            <p className="text-gray-600 mb-8">View and manage your scheduled posts</p>
            <div className="bg-white rounded-lg p-6 border">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">{selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
                <div className="flex gap-2">
                  <button onClick={() => {
                    const newDate = new Date(selectedMonth);
                    newDate.setMonth(newDate.getMonth() - 1);
                    setSelectedMonth(newDate);
                  }} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">←</button>
                  <button onClick={() => setSelectedMonth(new Date())} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Today</button>
                  <button onClick={() => {
                    const newDate = new Date(selectedMonth);
                    newDate.setMonth(newDate.getMonth() + 1);
                    setSelectedMonth(newDate);
                  }} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">→</button>
                </div>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <div className="grid grid-cols-7 bg-gray-50 border-b">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="font-semibold text-center text-sm py-3 border-r last:border-r-0">{day}</div>
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
            <h1 className="text-3xl font-bold mb-2">Connections</h1>
            <p className="text-gray-600 mb-8">Connect your social media accounts to start scheduling posts</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs">i</span>
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">OAuth Setup Required</h3>
                <p className="text-blue-800 text-sm">To enable real Facebook and LinkedIn connections, you'll need to configure OAuth credentials. The demo mode simulates connected accounts for testing purposes.</p>
              </div>
            </div>
            <div className="grid gap-6">
              <div className="bg-white rounded-lg p-6 border">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Facebook className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Facebook</h3>
                      <p className="text-sm text-gray-600">Connect your Facebook page to schedule posts</p>
                    </div>
                  </div>
                  <button onClick={() => connectAccount('facebook')} className={`px-6 py-2 rounded-lg font-medium ${connectedAccounts.facebook ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-blue-600 text-white'}`}>
                    {connectedAccounts.facebook ? '✓ Connected' : 'Connect Facebook'}
                  </button>
                </div>
              </div>
              <div className="bg-white rounded-lg p-6 border">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Linkedin className="w-6 h-6 text-blue-700" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">LinkedIn</h3>
                      <p className="text-sm text-gray-600">Connect your LinkedIn profile to share updates</p>
                    </div>
                  </div>
                  <button onClick={() => connectAccount('linkedin')} className={`px-6 py-2 rounded-lg font-medium ${connectedAccounts.linkedin ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-blue-700 text-white'}`}>
                    {connectedAccounts.linkedin ? '✓ Connected' : 'Connect LinkedIn'}
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-8 bg-white rounded-lg p-6 border">
              <h3 className="font-semibold mb-3">How OAuth Works</h3>
              <ol className="space-y-2 text-sm text-gray-600">
                <li>1. Click "Connect" on the platform you want to add</li>
                <li>2. You'll be redirected to the platform's login page</li>
                <li>3. Grant permission for the app to post on your behalf</li>
                <li>4. You'll be redirected back and can start scheduling posts</li>
              </ol>
            </div>
          </div>
        )}

        {currentPage === 'settings' && (
          <div className="max-w-3xl">
            <h1 className="text-3xl font-bold mb-2">Settings</h1>
            <p className="text-gray-600 mb-8">Manage your account preferences</p>
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6 border">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Profile</h3>
                    <p className="text-sm text-gray-600">Your account information</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input type="email" value={currentUser?.email} disabled className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-gray-600" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Display Name</label>
                    <input type="text" defaultValue={currentUser?.fullName} placeholder="Enter your name" className="w-full px-4 py-2 border rounded-lg" />
                  </div>
                  <button className="px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600">Save Changes</button>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 border">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Security</h3>
                    <p className="text-sm text-gray-600">Protect your account</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Password</label>
                  <div className="flex gap-3">
                    <input type="password" value="••••••••" disabled className="flex-1 px-4 py-2 border rounded-lg bg-gray-50" />
                    <button className="px-6 py-2 border rounded-lg hover:bg-gray-50">Change</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showComposer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-2xl font-bold">Create New Post</h2>
              <button onClick={() => setShowComposer(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3">Select Platforms</label>
                <div className="flex gap-3">
                  <button onClick={() => setCurrentPost({...currentPost, platforms: {...currentPost.platforms, facebook: !currentPost.platforms.facebook}})} className={`flex items-center gap-2 px-6 py-3 rounded-lg border-2 ${currentPost.platforms.facebook ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`}>
                    <Facebook className="w-5 h-5" />Facebook
                  </button>
                  <button onClick={() => setCurrentPost({...currentPost, platforms: {...currentPost.platforms, linkedin: !currentPost.platforms.linkedin}})} className={`flex items-center gap-2 px-6 py-3 rounded-lg border-2 ${currentPost.platforms.linkedin ? 'border-blue-700 bg-blue-50' : 'border-gray-200'}`}>
                    <Linkedin className="w-5 h-5" />LinkedIn
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-3">Post Content</label>
                <textarea value={currentPost.caption} onChange={(e) => setCurrentPost({...currentPost, caption: e.target.value})} placeholder="What's on your mind?" className="w-full border rounded-lg p-4 h-32 resize-none" />
                <div className="text-xs text-gray-500 mt-1">{currentPost.caption.length} characters</div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-3">Media</label>
                <label className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50">
                  <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-gray-500">Add media</span>
                  <input type="file" accept="image/*,video/*" onChange={handleMediaUpload} className="hidden" />
                </label>
                {currentPost.media && <img src={currentPost.media} alt="Preview" className="mt-4 max-w-full h-48 object-cover rounded-lg" />}
              </div>
              <div>
                <label className="block text-sm font-medium mb-3">Schedule</label>
                <div className="grid grid-cols-2 gap-4">
                  <input type="date" value={currentPost.scheduleDate} onChange={(e) => setCurrentPost({...currentPost, scheduleDate: e.target.value})} className="border rounded-lg p-3" />
                  <input type="time" value={currentPost.scheduleTime} onChange={(e) => setCurrentPost({...currentPost, scheduleTime: e.target.value})} className="border rounded-lg p-3" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowComposer(false)} className="flex-1 py-3 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button className="flex-1 py-3 border rounded-lg hover:bg-gray-50">Save Draft</button>
                <button onClick={handlePostNow} disabled={loading} className="flex-1 bg-teal-500 text-white py-3 rounded-lg hover:bg-teal-600 flex items-center justify-center gap-2">
                  <Send className="w-5 h-5" />{loading ? 'Posting...' : 'Post Now'}
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