import { useState, useEffect, useRef } from "react";
import { FileText, Plus, Zap, LogOut, Trash2, Sparkles, Clock, ListChecks } from "lucide-react";
import { summarizeTasks } from "./aiAgent.js";
import { saveTasks, loadTasks, auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "./firebase.js";
import { v4 as uuidv4 } from "uuid";

function App() {
  const [user, setUser] = useState(null);
  const [taskLists, setTaskLists] = useState([]);
  const [currentListId, setCurrentListId] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [saveStatus, setSaveStatus] = useState("saved");
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) loadTasks(currentUser.uid).then(data => {
        // Convert old format to new format if needed
        if (Array.isArray(data) && data.length > 0 && !data[0].tasks) {
          setTaskLists([]);
        } else {
          setTaskLists(data || []);
        }
      });
    });
  }, []);

  // Debounced save function
  const debouncedSave = (updatedLists) => {
    setSaveStatus("saving");
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Set new timeout for 5 seconds
    saveTimeoutRef.current = setTimeout(() => {
      saveTasks(user.uid, updatedLists);
      setSaveStatus("saved");
    }, 5000);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleLogin = async () => {
    try {
      if (isRegister) await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setTaskLists([]);
    setCurrentListId(null);
  };

  const addTaskList = () => {
    const newList = { 
      id: uuidv4(), 
      title: "NEW TASK LIST", 
      tasks: [],
      summary: "",
      createdAt: new Date().toISOString() 
    };
    setTaskLists([newList, ...taskLists]);
    setCurrentListId(newList.id);
  };

  const updateListTitle = (title) => {
    const updatedLists = taskLists.map(list => 
      list.id === currentListId ? { ...list, title } : list
    );
    setTaskLists(updatedLists);
    debouncedSave(updatedLists);
  };

  const addTask = () => {
    if (!currentListId) return;
    const updatedLists = taskLists.map(list => 
      list.id === currentListId 
        ? { ...list, tasks: [...list.tasks, { id: uuidv4(), text: "", completed: false }] }
        : list
    );
    setTaskLists(updatedLists);
    debouncedSave(updatedLists);
  };

  const updateTask = (taskId, text) => {
    const updatedLists = taskLists.map(list => 
      list.id === currentListId 
        ? { 
            ...list, 
            tasks: list.tasks.map(t => t.id === taskId ? { ...t, text } : t)
          }
        : list
    );
    setTaskLists(updatedLists);
    debouncedSave(updatedLists);
  };

  const toggleTask = (taskId) => {
    const updatedLists = taskLists.map(list => 
      list.id === currentListId 
        ? { 
            ...list, 
            tasks: list.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)
          }
        : list
    );
    setTaskLists(updatedLists);
    saveTasks(user.uid, updatedLists); // Save immediately for checkbox
  };

  const deleteTask = (taskId) => {
    const updatedLists = taskLists.map(list => 
      list.id === currentListId 
        ? { ...list, tasks: list.tasks.filter(t => t.id !== taskId) }
        : list
    );
    setTaskLists(updatedLists);
    saveTasks(user.uid, updatedLists); // Save immediately for delete
  };

  const requestDeleteList = (id) => setConfirmDelete(id);

  const confirmDeleteList = () => {
    if (!confirmDelete) return;
    setTaskLists(taskLists.filter(list => list.id !== confirmDelete));
    if (currentListId === confirmDelete) setCurrentListId(null);
    saveTasks(user.uid, taskLists.filter(list => list.id !== confirmDelete));
    setConfirmDelete(null);
  };

  const handleGenerate = async () => {
    const currentList = taskLists.find(list => list.id === currentListId);
    if (!currentList || currentList.tasks.length === 0) {
      alert("Please add some tasks first!");
      return;
    }
    
    const taskTexts = currentList.tasks.map(t => t.text).filter(Boolean);
    if (taskTexts.length === 0) {
      alert("Please add some task descriptions!");
      return;
    }

    setGenerating(true);
    const result = await summarizeTasks(taskTexts);
    
    setTaskLists(taskLists.map(list => 
      list.id === currentListId ? { ...list, summary: result } : list
    ));
    
    await saveTasks(user.uid, taskLists.map(list => 
      list.id === currentListId ? { ...list, summary: result } : list
    ));
    
    setGenerating(false);
  };

  const currentList = taskLists.find(list => list.id === currentListId);

  // === AUTH UI ===
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
        {/* Subtle animated background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-screen filter blur-3xl animate-blob"></div>
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500 rounded-full mix-blend-screen filter blur-3xl animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl animate-blob animation-delay-4000"></div>
          </div>
        </div>

        <div className="relative z-10 w-full max-w-md px-6">
          {/* Logo/Icon */}
          <div className="text-center mb-8">
            <div className="inline-block relative mb-6">
              <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-30"></div>
              <div className="relative p-4">
                <ListChecks size={64} className="text-blue-400" />
              </div>
            </div>
            
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-amber-400 to-blue-400 bg-clip-text text-transparent" style={{
              fontFamily: 'Georgia, serif'
            }}>
              Task Manager
            </h1>
            
            <p className="text-gray-400 text-sm tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>
              {isRegister ? "Create your account" : "Welcome back"}
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8 shadow-2xl">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                  Email
                </label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full p-3 bg-black/50 text-white border border-zinc-700 placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all rounded-lg"
                  style={{ fontFamily: 'Georgia, serif' }}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full p-3 bg-black/50 text-white border border-zinc-700 placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all rounded-lg"
                  style={{ fontFamily: 'Georgia, serif' }}
                />
              </div>
            </div>

            <button
              onClick={handleLogin}
              className="w-full mt-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-blue-500/50 transition-all duration-300"
              style={{ fontFamily: 'Georgia, serif', letterSpacing: '0.5px' }}
            >
              {isRegister ? "Create Account" : "Sign In"}
            </button>
            
            <div className="mt-4 text-center">
              <button
                onClick={() => setIsRegister(!isRegister)}
                className="text-gray-400 hover:text-blue-400 transition-colors text-sm"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                {isRegister ? "Already have an account? Sign in" : "Need an account? Sign up"}
              </button>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes blob {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
          }
          .animate-blob {
            animation: blob 7s infinite;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          .animation-delay-4000 {
            animation-delay: 4s;
          }
        `}</style>
      </div>
    );
  }

  // === TASK MANAGER UI ===
  return (
    <div className="flex h-screen bg-black overflow-hidden relative">
      {/* Decorative corner elements */}
      <div className="absolute top-0 left-0 w-32 h-32 border-t-2 border-l-2 border-blue-500/20"></div>
      <div className="absolute top-0 right-0 w-32 h-32 border-t-2 border-r-2 border-blue-500/20"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 border-b-2 border-l-2 border-blue-500/20"></div>
      <div className="absolute bottom-0 right-0 w-32 h-32 border-b-2 border-r-2 border-blue-500/20"></div>

      {/* Sidebar */}
      <div className="w-80 bg-zinc-900/50 backdrop-blur-xl border-r border-zinc-800 flex flex-col relative z-10">
        <div className="p-6 border-b border-zinc-800">
          <div className="text-blue-400 text-xs mb-4 flex items-center gap-2 font-semibold" style={{ fontFamily: 'Georgia, serif' }}>
            <Zap size={14} className="text-amber-400" /> 
            <span className="bg-gradient-to-r from-blue-400 to-amber-400 bg-clip-text text-transparent">
              TASK MANAGER
            </span>
          </div>
          
          <button
            onClick={addTaskList}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold transition-all duration-300 shadow-lg hover:shadow-blue-500/50 group relative overflow-hidden rounded-lg"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" /> 
            New List
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
          {taskLists.map((list, index) => (
            <div key={list.id} className="mb-2 group" style={{
              animation: `slideIn 0.3s ease-out ${index * 0.05}s backwards`
            }}>
              <div className="flex items-center relative">
                <button
                  onClick={() => setCurrentListId(list.id)}
                  className={`flex-1 text-left px-4 py-3 transition-all duration-300 border-l-2 rounded-r ${
                    currentListId === list.id
                      ? 'bg-blue-950/50 border-blue-500 text-blue-100'
                      : 'border-transparent text-gray-400 hover:bg-zinc-800/50 hover:border-blue-600 hover:text-gray-300'
                  }`}
                  style={{ fontFamily: 'Georgia, serif' }}
                >
                  <div className="relative z-10">
                    <div className="font-semibold truncate flex items-center gap-2 text-sm">
                      <ListChecks size={14} />
                      {list.title || 'Untitled List'}
                    </div>
                    <div className="text-xs opacity-70 truncate mt-1 flex items-center gap-1">
                      <span>{list.tasks.length} tasks</span>
                      {list.summary && <span className="text-emerald-400">• AI ✓</span>}
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => requestDeleteList(list.id)}
                  className="text-red-500 hover:text-red-400 px-3 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-zinc-800 space-y-3">
          <button
            onClick={handleLogout}
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-gray-300 font-semibold py-2 shadow-lg transition-all duration-300 flex items-center justify-center gap-2 rounded-lg"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      {/* Main Editor */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* Header */}
        <div className="bg-zinc-900/50 backdrop-blur-xl border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
          <div className="flex-1 flex items-center gap-4">
            {currentList && (
              <>
                <input
                  type="text"
                  value={currentList.title}
                  onChange={(e) => updateListTitle(e.target.value)}
                  className="text-2xl font-bold bg-transparent bg-gradient-to-r from-blue-400 to-amber-400 bg-clip-text text-transparent outline-none border-none flex-1"
                  placeholder="List Name"
                  style={{ fontFamily: 'Georgia, serif' }}
                />
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-300 ${
                  saveStatus === 'saving' 
                    ? 'bg-blue-950/50 text-blue-300' 
                    : 'bg-emerald-950/50 text-emerald-300'
                }`} style={{ fontFamily: 'Georgia, serif' }}>
                  <Clock size={12} />
                  {saveStatus === 'saving' ? 'Saving...' : 'Saved'}
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="text-gray-400 text-sm px-4 py-2 rounded-full border border-zinc-700 bg-zinc-900/50" style={{ fontFamily: 'Georgia, serif' }}>
              {user?.email}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex">
          {/* Task List Editor */}
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
            {currentList ? (
              <div className="h-full animate-fadeIn">
                <div className="max-w-3xl mx-auto">
                  {/* Add Task Button */}
                  <button
                    onClick={addTask}
                    className="mb-4 flex items-center gap-2 px-4 py-2 bg-blue-950/30 hover:bg-blue-950/50 text-blue-300 hover:text-blue-200 font-semibold transition-all duration-300 border border-blue-800/50 hover:border-blue-700 rounded-lg"
                    style={{ fontFamily: 'Georgia, serif' }}
                  >
                    <Plus size={16} /> Add Task
                  </button>

                  {/* Tasks */}
                  <div className="space-y-3">
                    {currentList.tasks.map((task, index) => (
                      <div
                        key={task.id}
                        className="flex items-start gap-3 p-4 bg-zinc-900/30 border border-zinc-800 rounded-lg hover:border-zinc-700 hover:bg-zinc-900/50 transition-all group"
                        style={{ animation: `slideIn 0.3s ease-out ${index * 0.05}s backwards` }}
                      >
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => toggleTask(task.id)}
                          className="mt-1 w-5 h-5 accent-blue-500 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={task.text}
                          onChange={(e) => updateTask(task.id, e.target.value)}
                          placeholder="Task description..."
                          className={`flex-1 bg-transparent text-gray-200 outline-none ${
                            task.completed ? 'line-through opacity-50' : ''
                          }`}
                          style={{ fontFamily: 'Georgia, serif', fontSize: '15px' }}
                        />
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Generate Summary Button */}
                  {currentList.tasks.length > 0 && (
                    <button
                      onClick={handleGenerate}
                      disabled={generating}
                      className="mt-6 w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:from-gray-700 disabled:to-gray-800 text-white font-semibold py-3 shadow-lg transition-all duration-300 hover:shadow-blue-500/50 disabled:shadow-none relative overflow-hidden group rounded-lg"
                      style={{ fontFamily: 'Georgia, serif' }}
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {generating ? (
                          <>
                            <Sparkles size={16} className="animate-spin" />
                            Generating Summary...
                          </>
                        ) : (
                          <>
                            <Sparkles size={16} />
                            Generate AI Summary
                          </>
                        )}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 animate-fadeIn">
                <div className="relative mb-8">
                  <div className="relative border-2 border-zinc-700 p-10 bg-zinc-900/30 rounded-2xl">
                    <ListChecks size={80} className="opacity-40 text-blue-400" />
                  </div>
                </div>
                <p className="text-3xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-amber-400 bg-clip-text text-transparent" style={{ fontFamily: 'Georgia, serif' }}>
                  No List Selected
                </p>
                <p className="text-sm text-gray-600" style={{ fontFamily: 'Georgia, serif' }}>
                  Create a new task list or select an existing one to begin
                </p>
              </div>
            )}
          </div>

          {/* Summary Panel */}
          {currentList?.summary && (
            <div className="w-96 border-l border-zinc-800 bg-zinc-900/50 backdrop-blur-xl p-6 overflow-y-auto custom-scrollbar animate-slideInRight">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <Sparkles size={24} className="text-blue-400" />
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-amber-400 bg-clip-text text-transparent" style={{ 
                    fontFamily: 'Georgia, serif'
                  }}>
                    AI Summary
                  </h2>
                </div>
                <div className="h-1 w-32 bg-gradient-to-r from-blue-500 to-transparent rounded-full"></div>
              </div>
              
              <div className="bg-black/30 border border-zinc-700 rounded-lg p-5">
                <pre className="relative text-gray-300 whitespace-pre-wrap leading-relaxed" style={{ 
                  fontFamily: 'Georgia, serif',
                  fontSize: '15px'
                }}>
                  {currentList.summary}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {confirmDelete && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 animate-fadeIn">
            <div className="relative">
              <div className="relative bg-zinc-900 border-2 border-zinc-700 p-8 shadow-2xl w-96 rounded-xl">
                <div className="text-center mb-6">
                  <Trash2 size={48} className="mx-auto mb-4 text-red-400" />
                  <p className="text-gray-200 text-xl font-bold mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                    Confirm Deletion
                  </p>
                  <p className="text-gray-400 text-sm" style={{ fontFamily: 'Georgia, serif' }}>
                    This action cannot be undone
                  </p>
                </div>
                
                <div className="flex justify-center gap-4">
                  <button
                    onClick={confirmDeleteList}
                    className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-semibold transition-all duration-300 rounded-lg"
                    style={{ fontFamily: 'Georgia, serif' }}
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 text-gray-200 font-semibold transition-all duration-300 rounded-lg"
                    style={{ fontFamily: 'Georgia, serif' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideInRight {
          animation: slideInRight 0.3s ease-out;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3b82f6, #2563eb);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #60a5fa, #3b82f6);
        }
      `}</style>
    </div>
  );
}

export default App;