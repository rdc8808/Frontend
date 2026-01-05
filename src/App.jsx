import React, { useState, useEffect } from 'react';
import { Calendar, Facebook, Linkedin, Instagram, Image, Video, Clock, Send, Edit2, Trash2, Plus, Settings } from 'lucide-react';

const SocialPlanner = () => {
  const [view, setView] = useState('calendar');
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

  // Load posts from storage
  useEffect(() => {
    loadPosts();
    loadConnectedAccounts();
  }, []);

  const loadPosts = async () => {
    try {
      const result = await window.storage.get('social_posts');
      if (result) {
        setPosts(JSON.parse(result.value));
      }
    } catch (e) {
      setPosts([]);
    }
  };

  const loadConnectedAccounts = async () => {
    try {
      const result = await window.storage.get('connected_accounts');
      if (result) {
        setConnectedAccounts(JSON.parse(result.value));
      }
    } catch (e) {
      console.log('No connected accounts yet');
    }
  };

  const savePosts = async (updatedPosts) => {
    await window.storage.set('social_posts', JSON.stringify(updatedPosts));
    setPosts(updatedPosts);
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

    const newPost = {
      id: Date.now(),
      ...currentPost,
      status: 'scheduled',
      createdAt: new Date().toISOString()
    };

    const updatedPosts = [...posts, newPost];
    await savePosts(updatedPosts);
    
    setShowComposer(false);
    resetComposer();
  };

  const handlePostNow = async () => {
    if (!currentPost.caption) {
      alert('Please add a caption');
      return;
    }

    // In real implementation, this would call your backend API
    alert('Post published! (In production, this would actually post to selected platforms)');
    
    const newPost = {
      id: Date.now(),
      ...currentPost,
      status: 'published',
      createdAt: new Date().toISOString(),
      publishedAt: new Date().toISOString()
    };

    const updatedPosts = [...posts, newPost];
    await savePosts(updatedPosts);
    
    setShowComposer(false);
    resetComposer();
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
    const updatedPosts = posts.filter(p => p.id !== postId);
    await savePosts(updatedPosts);
  };

  const connectAccount = async (platform) => {
    // In production, this would open OAuth flow
    const updated = { ...connectedAccounts, [platform]: true };
    setConnectedAccounts(updated);
    await window.storage.set('connected_accounts', JSON.stringify(updated));
    alert(`${platform} connected! (In production, this would open OAuth)`);
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
    return posts.filter(post => {
      if (!post.scheduleDate) return false;
      return post.scheduleDate === date;
    });
  };

  const CalendarView = () => {
    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(selectedMonth);
    const days = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-gray-50"></div>);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayPosts = getPostsForDate(dateStr);
      
      days.push(
        <div key={day} className="h-24 border border-gray-200 p-2 hover:bg-gray-50">
          <div className="font-semibold text-sm mb-1">{day}</div>
          <div className="space-y-1">
            {dayPosts.map(post => (
              <div key={post.id} className="text-xs bg-blue-100 rounded px-2 py-1 truncate cursor-pointer" onClick={() => {
                setCurrentPost(post);
                setShowComposer(true);
              }}>
                {post.scheduleTime} - {post.caption.slice(0, 20)}...
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex gap-2">
            <button onClick={() => setSelectedMonth(new Date(selectedMonth.setMonth(selectedMonth.getMonth() - 1)))} className="px-4 py-2 border rounded hover:bg-gray-100">Previous</button>
            <button onClick={() => setSelectedMonth(new Date())} className="px-4 py-2 border rounded hover:bg-gray-100">Today</button>
            <button onClick={() => setSelectedMonth(new Date(selectedMonth.setMonth(selectedMonth.getMonth() + 1)))} className="px-4 py-2 border rounded hover:bg-gray-100">Next</button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-0 border-t border-l">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="font-bold text-center py-2 border-r border-b bg-gray-100">{day}</div>
          ))}
          {days}
        </div>
      </div>
    );
  };

  const ListView = () => {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold">All Posts</h2>
        </div>
        <div className="divide-y">
          {posts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No posts yet. Create your first post!</div>
          ) : (
            posts.map(post => (
              <div key={post.id} className="p-6 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {post.platforms.facebook && <Facebook className="w-4 h-4 text-blue-600" />}
                      {post.platforms.linkedin && <Linkedin className="w-4 h-4 text-blue-700" />}
                      {post.platforms.instagram && <Instagram className="w-4 h-4 text-pink-600" />}
                      <span className={`text-xs px-2 py-1 rounded ${post.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {post.status}
                      </span>
                    </div>
                    <p className="text-gray-800 mb-2">{post.caption}</p>
                    {post.media && (
                      <div className="mb-2">
                        {post.mediaType === 'image' ? (
                          <img src={post.media} alt="Post media" className="w-32 h-32 object-cover rounded" />
                        ) : (
                          <video src={post.media} className="w-32 h-32 object-cover rounded" />
                        )}
                      </div>
                    )}
                    <div className="text-sm text-gray-500">
                      {post.scheduleDate && post.scheduleTime && `Scheduled for ${post.scheduleDate} at ${post.scheduleTime}`}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => {
                      setCurrentPost(post);
                      setShowComposer(true);
                    }} className="p-2 hover:bg-gray-200 rounded">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => deletePost(post.id)} className="p-2 hover:bg-red-100 rounded text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Social Media Planner</h1>
            <button onClick={() => setShowComposer(true)} className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-semibold">
              <Plus className="w-5 h-5" />
              New Post
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="mb-6 bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold mb-4">Connected Accounts</h3>
          <div className="flex gap-4">
            <button onClick={() => connectAccount('facebook')} className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 ${connectedAccounts.facebook ? 'border-blue-600 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}>
              <Facebook className="w-5 h-5" />
              Facebook {connectedAccounts.facebook && '✓'}
            </button>
            <button onClick={() => connectAccount('linkedin')} className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 ${connectedAccounts.linkedin ? 'border-blue-700 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}>
              <Linkedin className="w-5 h-5" />
              LinkedIn {connectedAccounts.linkedin && '✓'}
            </button>
            <button onClick={() => connectAccount('instagram')} className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 ${connectedAccounts.instagram ? 'border-pink-600 bg-pink-50' : 'border-gray-300 hover:border-gray-400'}`}>
              <Instagram className="w-5 h-5" />
              Instagram {connectedAccounts.instagram && '✓'}
            </button>
          </div>
        </div>

        <div className="mb-6 flex gap-4">
          <button onClick={() => setView('calendar')} className={`px-6 py-2 rounded-lg font-semibold ${view === 'calendar' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}>
            <Calendar className="w-5 h-5 inline mr-2" />
            Calendar
          </button>
          <button onClick={() => setView('list')} className={`px-6 py-2 rounded-lg font-semibold ${view === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}>
            List View
          </button>
        </div>

        {view === 'calendar' ? <CalendarView /> : <ListView />}
      </div>

      {showComposer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-2xl font-bold">Create Post</h2>
              <button onClick={() => {
                setShowComposer(false);
                resetComposer();
              }} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
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
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={currentPost.platforms.instagram} onChange={(e) => setCurrentPost({...currentPost, platforms: {...currentPost.platforms, instagram: e.target.checked}})} />
                    <Instagram className="w-5 h-5" />
                    Instagram
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-2">Schedule Date</label>
                  <input type="date" value={currentPost.scheduleDate} onChange={(e) => setCurrentPost({...currentPost, scheduleDate: e.target.value})} className="w-full border rounded-lg p-2" />
                </div>
                <div>
                  <label className="block font-semibold mb-2">Schedule Time</label>
                  <input type="time" value={currentPost.scheduleTime} onChange={(e) => setCurrentPost({...currentPost, scheduleTime: e.target.value})} className="w-full border rounded-lg p-2" />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={handlePostNow} className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-semibold flex items-center justify-center gap-2">
                  <Send className="w-5 h-5" />
                  Post Now
                </button>
                <button onClick={handleSchedulePost} className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold flex items-center justify-center gap-2">
                  <Clock className="w-5 h-5" />
                  Schedule Post
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
