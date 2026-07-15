"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cmsLoginAction, cmsLogoutAction, isAdminSession, getCmsStats, getCmsPosts, getCmsUsers, cmsDeletePost, cmsToggleUserSuspend, cmsChangeUserRole, getCmsVanGoghPosts, cmsDeleteVanGoghPost, getCmsConfessions, cmsDeleteConfession } from "@/app/actions/cmsActions";
import CreatePostModal from "@/components/CreatePostModal";

export default function CmsPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [activeTab, setActiveTab] = useState<'dashboard' | 'posts' | 'vangogh' | 'confessions' | 'users'>('dashboard');
  const [stats, setStats] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [vanGoghPosts, setVanGoghPosts] = useState<any[]>([]);
  const [confessions, setConfessions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const admin = await isAdminSession();
    setIsAdmin(admin);
    setIsLoading(false);
    if (admin) {
      loadDashboard();
    }
  };

  const loadDashboard = async () => {
    const res = await getCmsStats();
    if (res.success) setStats(res.stats);
  };

  const loadPosts = async () => {
    const res = await getCmsPosts();
    if (res.success && res.posts) setPosts(res.posts);
  };

  const loadVanGoghPosts = async () => {
    const res = await getCmsVanGoghPosts();
    if (res.success && res.posts) setVanGoghPosts(res.posts);
  };

  const loadConfessions = async () => {
    const res = await getCmsConfessions();
    if (res.success && res.confessions) setConfessions(res.confessions);
  };

  const loadUsers = async () => {
    const res = await getCmsUsers();
    if (res.success && res.users) setUsers(res.users);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    const formData = new FormData();
    formData.set("email", email);
    formData.set("password", password);
    const result = await cmsLoginAction(formData);
    if (result.success) {
      localStorage.setItem("miyu_user", result.username || "admin");
      window.dispatchEvent(new Event("storage"));
      setIsAdmin(true);
      loadDashboard();
    } else {
      setLoginError(result.error || "Login failed");
    }
  };

  const handleLogout = async () => {
    await cmsLogoutAction();
    localStorage.removeItem("miyu_user");
    window.dispatchEvent(new Event("storage"));
    setIsAdmin(false);
    router.push("/");
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    const res = await cmsDeletePost(postId);
    if (res.success) {
      setPosts(prev => prev.filter(p => p.id !== postId));
    } else {
      alert("Failed to delete post");
    }
  };

  const handleDeleteVanGoghPost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this Van Gogh post?")) return;
    const res = await cmsDeleteVanGoghPost(postId);
    if (res.success) {
      setVanGoghPosts(prev => prev.filter(p => p.id !== postId));
    } else {
      alert("Failed to delete Van Gogh post");
    }
  };

  const handleDeleteConfession = async (confessionId: string) => {
    if (!confirm("Are you sure you want to delete this confession?")) return;
    const res = await cmsDeleteConfession(confessionId);
    if (res.success) {
      setConfessions(prev => prev.filter(c => c.id !== confessionId));
    } else {
      alert("Failed to delete confession");
    }
  };

  const handleToggleSuspend = async (userId: string, currentStatus: boolean) => {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'unsuspend' : 'suspend'} this user?`)) return;
    const res = await cmsToggleUserSuspend(userId, !currentStatus);
    if (res.success) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, suspended: !currentStatus } : u));
    } else {
      alert("Failed to update user status");
    }
  };

  const handleChangeRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!confirm(`Are you sure you want to make this user an ${newRole}?`)) return;
    const res = await cmsChangeUserRole(userId, newRole);
    if (res.success) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } else {
      alert("Failed to update user role");
    }
  };

  const handleTabChange = (tab: 'dashboard' | 'posts' | 'vangogh' | 'confessions' | 'users') => {
    setActiveTab(tab);
    if (tab === 'posts') loadPosts();
    if (tab === 'vangogh') loadVanGoghPosts();
    if (tab === 'confessions') loadConfessions();
    if (tab === 'users') loadUsers();
    if (tab === 'dashboard') loadDashboard();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="font-handwriting text-xl text-electric-navy animate-pulse">Loading...</p>
      </div>
    );
  }

  // Login Screen
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-electric-navy to-sky-blue p-4">
        <div className="bg-white border-2 border-electric-navy p-8 sticky-note max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="font-handwriting text-headline-lg text-electric-navy mb-2">MIYU CMS</h1>
            <p className="font-label-bold text-xs text-sky-blue uppercase tracking-widest">Admin Panel</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="font-label-bold text-electric-navy text-xs block mb-1">EMAIL</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter admin email"
                className="w-full p-3 border-2 border-electric-navy focus:outline-none focus:ring-2 focus:ring-sunny-yellow font-handwriting text-lg"
              />
            </div>
            <div>
              <label className="font-label-bold text-electric-navy text-xs block mb-1">PASSWORD</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full p-3 border-2 border-electric-navy focus:outline-none focus:ring-2 focus:ring-sunny-yellow font-handwriting text-lg"
              />
            </div>

            {loginError && (
              <p className="text-racing-red font-label-bold text-xs">{loginError}</p>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-electric-navy text-white font-label-bold border-2 border-electric-navy hover:bg-sky-blue transition-colors"
            >
              LOGIN AS ADMIN
            </button>
          </form>

          <button
            onClick={() => router.push("/")}
            className="w-full mt-4 text-electric-navy font-label-bold text-sm hover:underline"
          >
            ← BACK TO SITE
          </button>
        </div>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <header className="bg-electric-navy text-white p-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <h1 className="font-handwriting text-2xl">MIYU CMS</h1>
          <span className="bg-racing-red text-white text-[10px] px-2 py-0.5 font-label-bold uppercase">Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="text-white/70 hover:text-white font-label-bold text-xs"
          >
            VIEW SITE →
          </button>
          <button
            onClick={handleLogout}
            className="bg-racing-red text-white px-4 py-1 font-label-bold text-xs border border-white/20 hover:bg-white hover:text-racing-red transition-colors"
          >
            LOGOUT
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b-2 border-electric-navy/20 pb-2 overflow-x-auto no-scrollbar">
          {(['dashboard', 'posts', 'vangogh', 'confessions', 'users'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`px-6 py-2 font-label-bold text-sm uppercase transition-colors whitespace-nowrap ${activeTab === tab ? 'bg-electric-navy text-white' : 'bg-white text-electric-navy border-2 border-electric-navy hover:bg-sunny-yellow'}`}
            >
              {tab.replace('vangogh', 'van gogh')}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && stats && (
          <div>
            <h2 className="font-handwriting text-headline-md text-electric-navy mb-6">Dashboard Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: 'Users', value: stats.userCount, icon: 'group', color: 'bg-sky-blue' },
                { label: 'Feed Posts', value: stats.postCount, icon: 'photo_library', color: 'bg-sunny-yellow' },
                { label: 'Van Gogh', value: stats.vanGoghCount, icon: 'brush', color: 'bg-racing-red' },
                { label: 'Confessions', value: stats.confessionCount, icon: 'forum', color: 'bg-electric-navy' },
                { label: 'Polls', value: stats.pollCount, icon: 'poll', color: 'bg-sky-blue' },
              ].map(item => (
                <div key={item.label} className="bg-white border-2 border-electric-navy p-4 sticky-note">
                  <div className={`${item.color} w-10 h-10 flex items-center justify-center text-white border-2 border-electric-navy mb-3`}>
                    <span className="material-symbols-outlined">{item.icon}</span>
                  </div>
                  <p className="font-handwriting text-3xl text-electric-navy">{item.value}</p>
                  <p className="font-label-bold text-[10px] text-sky-blue uppercase tracking-widest">{item.label}</p>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="mt-8">
              <h3 className="font-handwriting text-xl text-electric-navy mb-4">Quick Actions</h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-sunny-yellow text-electric-navy px-6 py-3 font-label-bold border-2 border-electric-navy sticky-note hover:-translate-y-1 transition-transform flex items-center gap-2"
                >
                  <span className="material-symbols-outlined">add_photo_alternate</span>
                  CREATE NEW POST
                </button>
                <button
                  onClick={() => handleTabChange('posts')}
                  className="bg-white text-electric-navy px-6 py-3 font-label-bold border-2 border-electric-navy sticky-note hover:-translate-y-1 transition-transform flex items-center gap-2"
                >
                  <span className="material-symbols-outlined">edit</span>
                  MANAGE POSTS
                </button>
                <button
                  onClick={() => handleTabChange('users')}
                  className="bg-white text-electric-navy px-6 py-3 font-label-bold border-2 border-electric-navy sticky-note hover:-translate-y-1 transition-transform flex items-center gap-2"
                >
                  <span className="material-symbols-outlined">manage_accounts</span>
                  MANAGE USERS
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Posts Tab */}
        {activeTab === 'posts' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-handwriting text-headline-md text-electric-navy">Feed Posts</h2>
              <button
                onClick={() => setShowModal(true)}
                className="bg-sunny-yellow text-electric-navy px-4 py-2 font-label-bold text-sm border-2 border-electric-navy hover:bg-electric-navy hover:text-white transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                NEW POST
              </button>
            </div>

            {posts.length === 0 ? (
              <p className="text-center text-electric-navy/50 font-handwriting text-lg py-12">No posts yet.</p>
            ) : (
              <div className="space-y-3">
                {posts.map(post => (
                  <div key={post.id} className="bg-white border-2 border-electric-navy p-4 flex items-center gap-4">
                    <div className="w-16 h-16 border-2 border-electric-navy bg-gray-100 shrink-0 overflow-hidden">
                      <img src={post.imageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-handwriting text-electric-navy truncate">{post.caption}</p>
                      <div className="flex gap-4 text-[10px] font-label-bold text-sky-blue uppercase">
                        <span>By: @{post.author?.username || 'unknown'}</span>
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                        <span>{post.likes} likes</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="shrink-0 bg-racing-red text-white px-3 py-1 font-label-bold text-xs border-2 border-electric-navy hover:bg-electric-navy transition-colors"
                    >
                      DELETE
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Van Gogh Tab */}
        {activeTab === 'vangogh' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-handwriting text-headline-md text-electric-navy">Van Gogh Posts</h2>
            </div>

            {vanGoghPosts.length === 0 ? (
              <p className="text-center text-electric-navy/50 font-handwriting text-lg py-12">No Van Gogh posts yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {vanGoghPosts.map(post => (
                  <div key={post.id} className="bg-white border-2 border-electric-navy p-4 flex flex-col gap-2">
                    <div className="w-full h-40 border-2 border-electric-navy bg-[url('/images/grid.png')] overflow-hidden flex items-center justify-center">
                      <img src={post.imageUrl} alt="" className="max-w-full max-h-full object-contain" />
                    </div>
                    <div className="flex-1">
                      <p className="font-handwriting text-electric-navy text-sm line-clamp-2">{post.caption || "No caption"}</p>
                      <div className="flex justify-between text-[10px] font-label-bold text-sky-blue uppercase mt-2">
                        <span>@{post.author?.username || 'unknown'}</span>
                        <span>{post.likes} likes</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteVanGoghPost(post.id)}
                      className="w-full mt-2 bg-racing-red text-white px-3 py-2 font-label-bold text-xs border-2 border-electric-navy hover:bg-electric-navy transition-colors"
                    >
                      DELETE ARTWORK
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Confessions Tab */}
        {activeTab === 'confessions' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-handwriting text-headline-md text-electric-navy">Confessions</h2>
            </div>

            {confessions.length === 0 ? (
              <p className="text-center text-electric-navy/50 font-handwriting text-lg py-12">No confessions yet.</p>
            ) : (
              <div className="space-y-3">
                {confessions.map(confession => (
                  <div key={confession.id} className="bg-white border-2 border-electric-navy p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-handwriting text-electric-navy">{confession.text}</p>
                      <div className="flex gap-4 text-[10px] font-label-bold text-sky-blue uppercase mt-2">
                        <span>By: @{confession.author?.username || 'unknown'}</span>
                        <span>{new Date(confession.createdAt).toLocaleDateString()}</span>
                        <span>{confession.likes} likes</span>
                        <span>{confession.supports} supports</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteConfession(confession.id)}
                      className="shrink-0 bg-racing-red text-white px-3 py-1 font-label-bold text-xs border-2 border-electric-navy hover:bg-electric-navy transition-colors"
                    >
                      DELETE
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <h2 className="font-handwriting text-headline-md text-electric-navy mb-6">Users</h2>

            {users.length === 0 ? (
              <p className="text-center text-electric-navy/50 font-handwriting text-lg py-12">No users yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-2 border-electric-navy">
                  <thead>
                    <tr className="bg-electric-navy text-white">
                      <th className="p-3 text-left font-label-bold text-xs uppercase">User</th>
                      <th className="p-3 text-center font-label-bold text-xs uppercase">Stats</th>
                      <th className="p-3 text-center font-label-bold text-xs uppercase">Role</th>
                      <th className="p-3 text-center font-label-bold text-xs uppercase">Status</th>
                      <th className="p-3 text-right font-label-bold text-xs uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id} className={`border-b border-electric-navy/20 hover:bg-sunny-yellow/10 ${user.suspended ? 'opacity-50 bg-gray-100' : ''}`}>
                        <td className="p-3">
                          <div className="font-handwriting text-electric-navy text-lg">@{user.username}</div>
                          <div className="font-label-bold text-[10px] text-sky-blue">{user.email}</div>
                          <div className="font-label-bold text-[10px] text-electric-navy/50">Joined: {new Date(user.createdAt).toLocaleDateString()}</div>
                        </td>
                        <td className="p-3 text-center font-label-bold text-[10px] text-electric-navy leading-tight">
                          <div>{user._count.posts} Feed</div>
                          <div>{user._count.vanGoghPosts} Art</div>
                          <div>{user._count.confessions} Conf</div>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-1 text-[10px] font-label-bold uppercase border-2 ${user.role === 'admin' ? 'bg-racing-red text-white border-racing-red' : 'bg-white text-electric-navy border-electric-navy'}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {user.suspended ? (
                            <span className="text-racing-red font-label-bold text-xs">SUSPENDED</span>
                          ) : (
                            <span className="text-emerald-500 font-label-bold text-xs">ACTIVE</span>
                          )}
                        </td>
                        <td className="p-3">
                           <div className="flex justify-end gap-2">
                             <button
                               onClick={() => handleChangeRole(user.id, user.role)}
                               className="px-2 py-1 bg-white text-electric-navy text-[10px] font-label-bold border-2 border-electric-navy hover:bg-electric-navy hover:text-white transition-colors"
                             >
                               {user.role === 'admin' ? 'DEMOTE' : 'MAKE ADMIN'}
                             </button>
                             <button
                               onClick={() => handleToggleSuspend(user.id, user.suspended)}
                               className={`px-2 py-1 text-white text-[10px] font-label-bold border-2 border-electric-navy transition-colors ${user.suspended ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-racing-red hover:bg-red-700'}`}
                             >
                               {user.suspended ? 'UNSUSPEND' : 'SUSPEND'}
                             </button>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && <CreatePostModal onClose={() => { setShowModal(false); if (activeTab === 'posts') loadPosts(); }} />}
    </div>
  );
}
