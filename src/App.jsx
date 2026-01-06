import React, { useState, useEffect } from 'react';
import { Calendar, Facebook, Linkedin, Instagram, Send, Edit2, Trash2, Plus, Settings, LogOut, User, BarChart3, Clock } from 'lucide-react';

const API_URL = 'https://social-planner-api.onrender.com';
const USER_ID = 'default_user';

const SocialPlanner = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [posts, setPosts] = useState([]);
  const [connectedAccounts, setConnectedAccounts] = useState({
    facebook: false,
    linkedin: false,
    instagram: false
  });
  const [showComposer, setShowComposer] = useState(false);
  const [currentPost, setCurrentPost] = useState({
    caption: '',
    media: null,
    mediaType: null,
    platforms: { facebook: true, linkedin: false, instagram: false },
    scheduleDate: '',
    scheduleTime: ''
  });
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkConnections();
    loadPosts();
    const urlParams = new URLSearchParams(window.location.search);
    const connected = urlParams.get('connected');
    const error = urlParams.get('error');
    
    if (connected) {
      alert(`${connected} connected successfully!`);
      checkConnections();
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    if (error) {
      alert(`Connection failed: ${error}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const checkConnections = async () => {
    try {
      const response = await fetch(`${API_URL}/api/connections?userId=${USER_ID}`);
      const data = await response.json();
      setConnectedAccounts(data);
    } catch (error) {
      console.error('Error checking connections:', error);
    }
  };

  const loadPosts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/posts?userId=${USER_ID}`);
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error('Error loading posts:', error);
      const savedPosts = localStorage.getItem('social_posts');
      if (savedPosts) {
        setPosts(JSON.parse(savedPosts));
      }
    }
  };

  const handleMediaUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentPost({
          ...currentPost,
          media: reader.result,
          mediaType: file.type.startsWith('image/') ? 'image' : 'video'
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSchedulePost = async () => {
    if (!currentPost.caption || !currentPost.scheduleDate || !currentPost.scheduleTime) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: USER_ID, postData: currentPost })
      });

      if (response.ok) {
        alert('Post scheduled successfully!');
        await loadPosts();
        setShowComposer(false);
        resetComposer();
      }
    } catch (error) {
      alert('Error scheduling post');
    } finally {
      setLoading(false);
    }
  };

  const handlePostNow = async () => {
    if (!currentPost.caption) {
      alert('Please add a caption');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/post-now`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: USER_ID, postData: currentPost })
      });

      if (response.ok) {
        alert('Post published successfully!');
        await loadPosts();
        setShowComposer(false);
        resetComposer();
      }
    } catch (error) {
      alert('Error posting');
    } finally {
      setLoading(false);
    }
  };

  const resetComposer = () => {
    setCurrentPost({
      caption: '',
      media: null,
      mediaType: null,
      platforms: { facebook: true, linkedin: false, instagram: false },
      scheduleDate: '',
      scheduleTime: ''
    });
  };

  const deletePost = async (postId) => {
    try {
      await fetch(`${API_URL}/api/posts/${postId}`, { method: 'DELETE' });
      await loadPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const connectAccount = (platform) => {
    window.location.href = `${API_URL}/auth/${platform}?userId=${USER_ID}`;
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

  const getPostsForDate = (date) => {
    return posts.filter(post => post.scheduleDate === date);
  };

  const stats = {
    total: posts.length,
    scheduled: posts.filter(p => p.status === 'scheduled').length,
    published: posts.filter(p => p.status === 'published').length,
    drafts: 0
  };

  const CalendarView = () => {
    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(selectedMonth);
    const days = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-gray-50 border border-gray-200"></div>);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayPosts = getPostsForDate(dateStr);
      const isToday = dateStr === new Date().toISOString().split('T')[0];
      
      days.push(
        <div key={day} className={`h-24 border border-gray-200 p-2 hover:bg-gray-50 ${isToday ? 'bg-teal-50' : ''}`}>
          <div className={`font-semibold text-sm mb-1 ${isToday ? 'text-teal-600' : ''}`}>{day}</div>
          <div className="space-y-1">
            {dayPosts.map(post => (
              <div 
                key={post.id} 
                className="text-xs bg-teal-500 text-white rounded px-2 py-1 truncate cursor-pointer" 
                onClick={() => {
                  setCurrentPost(post);
                  setShowComposer(true);
                }}
              >
                {post.scheduleTime}
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    return (
      <div className="bg-white rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
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
        <div className="grid grid-cols-7 gap-0 border-t border-l rounded-lg overflow-hidden">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="font-semibold text-center text-sm py-3 border-r border-b bg-gray-50">{day}</div>
          ))}
          {days}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-64 bg-white border-r flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-bold text-gray-900">SocialScheduler</div>
              <div className="text-xs text-gray-500">Rubicon Core</div>
            </div>
          </div>
        </div>

        <div className="p-4">
          <button onClick={() => setShowComposer(true)} className="w-full bg-teal-500 text-white px-4 py-3 rounded-lg hover:bg-teal-600 flex items-center justify-center gap-2 font-medium">
            <Plus className="w-5 h-5" />
            Create Post
          </button>
        </div>

        <nav className="flex-1 px-3">
          <button onClick={() => setCurrentPage('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 ${currentPage === 'dashboard' ? 'bg-teal-50 text-teal-600' : 'text-gray-600 hover:bg-gray-50'}`}>
            <BarChart3 className="w-5 h-5" />
            Dashboard
          </button>
          <button onClick={() => setCurrentPage('calendar')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 ${currentPage === 'calendar' ? 'bg-teal-50 text-teal-600' : 'text-gray-600 hover:bg-gray-50'}`}>
            <Calendar className="w-5 h-5" />
            Calendar
          </button>
          <button onClick={() => setCurrentPage('connections')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 ${currentPage === 'connections' ? 'bg-teal-50 text-teal-600' : 'text-gray-600 hover:bg-gray-50'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Connections
          </button>
          <button onClick={() => setCurrentPage('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 ${currentPage === 'settings' ? 'bg-teal-50 text-teal-600' : 'text-gray-600 hover:bg-gray-50'}`}>
            <Settings className="w-5 h-5" />
            Settings
          </button>
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-teal-600">T</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-700 truncate">test2@test.com</div>
            </div>
            <button className="text-gray-400 hover:text-gray-600">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {currentPage === 'dashboard' && (
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
              <p className="text-gray-600">Welcome back! Here's an overview of your scheduled content.</p>
            </div>

            <div className="grid grid-cols-4 gap-6 mb-8">
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
              <div className="bg-white rounded-lg p-6 border">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Edit2 className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Drafts</div>
                    <div className="text-2xl font-bold">{stats.drafts}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-8 text-center">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No scheduled posts yet</h3>
              <p className="text-gray-600 mb-4">Create your first post to get started</p>
              <button onClick={() => setShowComposer(true)} className="px-6 py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 inline-flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Create Post
              </button>
            </div>
          </div>
        )}

        {currentPage === 'calendar' && (
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Calendar</h1>
              <p className="text-gray-600">View and manage your scheduled posts</p>
            </div>
            <CalendarView />
          </div>
        )}

        {currentPage === 'connections' && (
          <div className="p-8 max-w-4xl">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Connections</h1>
              <p className="text-gray-600">Connect your social media accounts to start scheduling posts</p>
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
                  <button onClick={() => connectAccount('facebook')} className={`px-6 py-2 rounded-lg font-medium ${connectedAccounts.facebook ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                    {connectedAccounts.facebook ? '✓ Connected' : 'Connect'}
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
                  <button onClick={() => connectAccount('linkedin')} className={`px-6 py-2 rounded-lg font-medium ${connectedAccounts.linkedin ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-blue-700 text-white hover:bg-blue-800'}`}>
                    {connectedAccounts.linkedin ? '✓ Connected' : 'Connect'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentPage === 'settings' && (
          <div className="p-8 max-w-3xl">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Settings</h1>
              <p className="text-gray-600">Manage your account preferences</p>
            </div>

            <div className="bg-white rounded-lg p-6 border">
              <h3 className="font-semibold mb-4">Profile</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input type="email" value="test2@test.com" disabled className="w-full px-4 py-2 border rounded-lg bg-gray-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Display Name</label>
                  <input type="text" placeholder="Enter your name" className="w-full px-4 py-2 border rounded-lg" />
                </div>
                <button className="px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600">Save Changes</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showComposer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-2xl font-bold">Create Post</h2>
              <button onClick={() => { setShowComposer(false); resetComposer(); }} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block font-semibold mb-2">Post Caption</label>
                <textarea value={currentPost.caption} onChange={(e) => setCurrentPost({...currentPost, caption: e.target.value})} placeholder="Write your post here..." className="w-full border rounded-lg p-3 h-32 resize-none" />
              </div>

              <div>
                <label className="block font-semibold mb-2">Media (Optional)</label>
                <input type="file" accept="image/*,video/*" onChange={handleMediaUpload} className="w-full border rounded-lg p-2" />
                {currentPost.media && (
                  <div className="mt-4">
                    {currentPost.mediaType === 'image' ? (
                      <img src={currentPost.media} alt="Preview" className="max-w-full h-48 object-cover rounded" />
                    ) : (
                      <video src={currentPost.media} controls className="max-w-full h-48 rounded" />
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold mb-2">Post To</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={currentPost.platforms.facebook} onChange={(e) => setCurrentPost({...currentPost, platforms: {...currentPost.platforms, facebook: e.target.checked}})} />
                    <Facebook className="w-5 h-5" />
                    Facebook
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={currentPost.platforms.linkedin} onChange={(e) => setCurrentPost({...currentPost, platforms: {...currentPost.platforms, linkedin: e.target.checked}})} />
                    <Linkedin className="w-5 h-5" />
                    LinkedIn
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-2">Date</label>
                  <input type="date" value={currentPost.scheduleDate} onChange={(e) => setCurrentPost({...currentPost, scheduleDate: e.target.value})} className="w-full border rounded-lg p-2" />
                </div>
                <div>
                  <label className="block font-semibold mb-2">Time</label>
                  <input type="time" value={currentPost.scheduleTime} onChange={(e) => setCurrentPost({...currentPost, scheduleTime: e.target.value})} className="w-full border rounded-lg p-2" />
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={handlePostNow} disabled={loading} className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2">
                  <Send className="w-5 h-5" />
                  {loading ? 'Posting...' : 'Post Now'}
                </button>
                <button onClick={handleSchedulePost} disabled={loading} className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
                  <Clock className="w-5 h-5" />
                  {loading ? 'Scheduling...' : 'Schedule'}
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