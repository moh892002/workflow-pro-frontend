import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { DB } from '../services/db';
import { AIService } from '../services/ai';
import { User, Message, Role, Attachment } from '../types';
import { Send, Search, Check, CheckCheck, Bot, Paperclip, File as FileIcon, Image as ImageIcon, X, Download, Eye, ZoomIn, ZoomOut, Maximize, FileText } from 'lucide-react';

export const Chat = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [contacts, setContacts] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({}); 
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  
  // Media Viewer State
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Contacts
  useEffect(() => {
    if (!user) return;
    const allUsers = DB.users.getAll();
    let filtered: User[] = [];

    const aiBot = allUsers.find(u => u.isBot);
    // ALLOW ALL: Everyone sees everyone
    filtered = allUsers.filter(u => u.id !== user.id && u.isActive && !u.isBot);
    
    if (aiBot) filtered = [aiBot, ...filtered];

    setContacts(filtered);
  }, [user]);

  // Real-time Polling
  useEffect(() => {
    if (!user) return;
    const pollData = () => {
        if (selectedUser) {
            const msgs = DB.messages.getConversation(user.id, selectedUser.id);
            setMessages(msgs);
            DB.messages.markRead(selectedUser.id, user.id);
        }
        const counts: Record<string, number> = {};
        contacts.forEach(contact => {
            counts[contact.id] = DB.messages.getUnreadCountFromSender(user.id, contact.id);
        });
        setUnreadCounts(counts);
    };
    pollData();
    const interval = setInterval(pollData, 1500);
    return () => clearInterval(interval);
  }, [selectedUser, user, contacts]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiTyping]);

  // Key Listeners for Viewer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && previewAttachment) closeViewer();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewAttachment]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validation
      if (file.size > 2 * 1024 * 1024) { // 2MB Limit for LocalStorage safety
          alert(t('file_too_large'));
          return;
      }
      
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      // Note: MIME type checking can be tricky on some browsers, strict check only for images/pdfs usually
      
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target?.result) {
          const isImage = file.type.startsWith('image/');
          setAttachment({
            type: isImage ? 'image' : 'file',
            name: file.name,
            data: event.target.result as string,
            size: file.size,
            mimeType: file.type
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !attachment) || !user || !selectedUser) return;

    const content = input.trim();
    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: user.id,
      receiverId: selectedUser.id,
      content: content,
      attachment: attachment ? { ...attachment } : undefined,
      timestamp: new Date().toISOString(),
      isRead: false
    };

    DB.messages.send(newMessage);
    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setAttachment(null);

    // AI Logic
    if (selectedUser.isBot) {
        setIsAiTyping(true);
        const history = messages.slice(-5).map(m => ({
            role: m.senderId === user.id ? 'user' as const : 'model' as const,
            text: m.content
        }));

        try {
            const aiResponseText = await AIService.chat(history, content || (attachment ? `[Sent an attachment: ${attachment.name}]` : ''));
            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                senderId: selectedUser.id,
                receiverId: user.id,
                content: aiResponseText,
                timestamp: new Date().toISOString(),
                isRead: false
            };
            DB.messages.send(aiMessage);
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error(error);
        } finally {
            setIsAiTyping(false);
        }
    }
  };

  // Viewer Logic
  const openViewer = (att: Attachment) => {
      setPreviewAttachment(att);
      setZoomLevel(1);
      setPanPosition({ x: 0, y: 0 });
  };

  const closeViewer = () => {
      setPreviewAttachment(null);
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.5, 3));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.5, 0.5));

  const handleMouseDown = (e: React.MouseEvent) => {
      if (zoomLevel > 1) {
          setIsDragging(true);
          setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
      }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (isDragging) {
          setPanPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
      }
  };

  const handleMouseUp = () => setIsDragging(false);

  const formatFileSize = (bytes?: number) => {
      if (!bytes) return '';
      if (bytes < 1024) return bytes + ' B';
      else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
      else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const filteredContacts = useMemo(() =>
    contacts.filter(c => c.fullName.toLowerCase().includes(searchTerm.toLowerCase())),
    [contacts, searchTerm]
  );

  return (
    <div className="h-[calc(100vh-8rem)] flex rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      
      {/* Sidebar List */}
      <div className="w-1/3 border-r border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col">
        {/* ... Sidebar Header ... */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">Messages</h2>
            <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Search people..." 
                    className="w-full pl-10 pr-4 py-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:outline-none focus:border-accent text-slate-800 dark:text-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
        <div className="flex-1 overflow-y-auto">
            {filteredContacts.map(contact => (
                <div 
                    key={contact.id}
                    onClick={() => setSelectedUser(contact)}
                    className={`flex items-center gap-3 p-4 cursor-pointer transition-colors relative ${
                        selectedUser?.id === contact.id 
                            ? 'bg-white dark:bg-slate-700 border-l-4 border-accent shadow-sm' 
                            : 'hover:bg-slate-100 dark:hover:bg-slate-700/50 border-l-4 border-transparent'
                    }`}
                >
                    <div className="relative">
                        {contact.isBot ? (
                            <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                                <Bot size={24} />
                            </div>
                        ) : (
                            <img src={contact.profileImage} alt="" className="w-12 h-12 rounded-full object-cover" />
                        )}
                        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 bg-green-500`}></span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                            <p className="font-semibold text-slate-800 dark:text-white truncate">
                                {contact.isBot ? t('ai_assistant') : contact.fullName}
                            </p>
                            {unreadCounts[contact.id] > 0 && (
                                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                                    {unreadCounts[contact.id]}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate w-32">{contact.department || contact.jobTitle || contact.role}</p>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-800 relative">
        {selectedUser ? (
            <>
                {/* Header */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3 shadow-sm z-10">
                    {selectedUser.isBot ? (
                        <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                            <Bot size={20} />
                        </div>
                    ) : (
                        <img src={selectedUser.profileImage} alt="" className="w-10 h-10 rounded-full" />
                    )}
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-white">
                            {selectedUser.isBot ? t('ai_assistant') : selectedUser.fullName}
                        </h3>
                        <p className="text-xs text-green-500 flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full"></span> Active now</p>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50">
                    {messages.map(msg => {
                        const isMe = msg.senderId === user?.id;
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[70%] rounded-2xl p-3 shadow-sm border ${
                                    isMe 
                                        ? 'bg-accent text-white rounded-br-none border-accent' 
                                        : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-bl-none border-slate-200 dark:border-slate-600'
                                }`}>
                                    {msg.attachment && (
                                        <div className="mb-2">
                                            {msg.attachment.type === 'image' ? (
                                                <div 
                                                    className="relative group cursor-pointer overflow-hidden rounded-lg"
                                                    onClick={() => openViewer(msg.attachment!)}
                                                >
                                                    <img src={msg.attachment.data} alt="attachment" className="max-h-60 w-full object-cover border border-black/10 transition-transform duration-300 group-hover:scale-105" />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                        <Maximize className="text-white opacity-0 group-hover:opacity-100 drop-shadow-md" size={24} />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className={`flex items-center gap-3 p-3 rounded-lg ${isMe ? 'bg-white/10' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                                    <div className="p-2 bg-white dark:bg-slate-700 rounded-lg text-red-500 shadow-sm">
                                                        {msg.attachment.mimeType === 'application/pdf' ? <FileText size={20} /> : <FileIcon size={20} />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-sm font-medium truncate ${isMe ? 'text-white' : 'text-slate-800 dark:text-white'}`}>{msg.attachment.name}</p>
                                                        <p className={`text-xs ${isMe ? 'text-white/70' : 'text-slate-500 dark:text-slate-400'}`}>{formatFileSize(msg.attachment.size)}</p>
                                                    </div>
                                                    
                                                    {msg.attachment.mimeType === 'application/pdf' && (
                                                        <button 
                                                            onClick={() => openViewer(msg.attachment!)}
                                                            className={`p-1.5 rounded-lg transition ${isMe ? 'hover:bg-white/20 text-white' : 'hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300'}`}
                                                            title={t('preview')}
                                                        >
                                                            <Eye size={16} />
                                                        </button>
                                                    )}
                                                    
                                                    <a 
                                                        href={msg.attachment.data} 
                                                        download={msg.attachment.name} 
                                                        className={`p-1.5 rounded-lg transition ${isMe ? 'hover:bg-white/20 text-white' : 'hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300'}`}
                                                        title={t('download')}
                                                    >
                                                        <Download size={16} />
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {msg.content && <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>}
                                    <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${isMe ? 'text-white/70' : 'text-slate-400'}`}>
                                        {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        {isMe && user?.role === Role.ADMIN && (
                                            msg.isRead ? <CheckCheck size={12} /> : <Check size={12} />
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {/* ... Typing ... */}
                    {isAiTyping && (
                        <div className="flex justify-start">
                             <div className="bg-white dark:bg-slate-700 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm border border-slate-100 dark:border-slate-600">
                                <div className="flex gap-1">
                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
                                </div>
                             </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 z-10">
                    {attachment && (
                        <div className="mb-3 flex items-center gap-3 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl w-full border border-slate-100 dark:border-slate-600">
                            <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-300">
                                {attachment.type === 'image' ? <ImageIcon size={20} /> : <FileIcon size={20} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{attachment.name}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{formatFileSize(attachment.size)}</p>
                            </div>
                            <button onClick={() => setAttachment(null)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full text-slate-500 transition">
                                <X size={16} />
                            </button>
                        </div>
                    )}
                    <form onSubmit={handleSend} className="flex gap-2">
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            onChange={handleFileSelect} 
                            accept="image/*,.pdf,.doc,.docx,.txt" 
                        />
                        <button 
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 p-3 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition"
                            title="Attach file"
                        >
                            <Paperclip size={20} />
                        </button>
                        <input 
                            type="text" 
                            className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white border-0 rounded-full px-4 py-3 focus:ring-2 focus:ring-accent focus:outline-none placeholder-slate-400"
                            placeholder={t('type_message')}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                        />
                        <button 
                            type="submit" 
                            className="bg-accent hover:bg-accent-hover text-white p-3 rounded-full shadow-lg transition transform hover:scale-105"
                            disabled={!input.trim() && !attachment}
                        >
                            <Send size={20} />
                        </button>
                    </form>
                </div>
            </>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600">
                <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <Send size={40} className="text-slate-300 dark:text-slate-500" />
                </div>
                <p className="text-lg font-medium">Select a conversation to start chatting</p>
            </div>
        )}

        {/* --- FULL SCREEN PREVIEW MODAL --- */}
        {previewAttachment && (
            <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex flex-col animate-fade-in">
                {/* Modal Header */}
                <div className="h-16 flex items-center justify-between px-6 text-white bg-black/20">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-white/10 rounded-lg">
                            {previewAttachment.type === 'image' ? <ImageIcon size={20} /> : <FileText size={20} />}
                        </div>
                        <div>
                            <p className="font-medium text-sm">{previewAttachment.name}</p>
                            <p className="text-xs text-white/60">{formatFileSize(previewAttachment.size)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                         <a 
                             href={previewAttachment.data} 
                             download={previewAttachment.name}
                             className="p-2 hover:bg-white/10 rounded-full transition text-white/80 hover:text-white"
                             title={t('download')}
                         >
                             <Download size={20} />
                         </a>
                         <button 
                             onClick={closeViewer}
                             className="p-2 hover:bg-red-500/80 rounded-full transition text-white/80 hover:text-white"
                             title={t('close')}
                         >
                             <X size={24} />
                         </button>
                    </div>
                </div>

                {/* Modal Content */}
                <div className="flex-1 flex items-center justify-center overflow-hidden relative p-4">
                    {previewAttachment.type === 'image' ? (
                        <div 
                            className="relative w-full h-full flex items-center justify-center"
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                        >
                            <img 
                                src={previewAttachment.data} 
                                alt="preview" 
                                style={{
                                    transform: `scale(${zoomLevel}) translate(${panPosition.x}px, ${panPosition.y}px)`,
                                    cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
                                }}
                                className="max-w-full max-h-full object-contain transition-transform duration-75 select-none"
                                draggable={false}
                            />
                            
                            {/* Zoom Controls */}
                            <div className="absolute bottom-8 flex items-center gap-4 bg-black/50 backdrop-blur-md px-6 py-3 rounded-full text-white border border-white/10">
                                <button onClick={handleZoomOut} className="hover:text-accent transition"><ZoomOut size={20} /></button>
                                <span className="font-mono text-sm w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
                                <button onClick={handleZoomIn} className="hover:text-accent transition"><ZoomIn size={20} /></button>
                                <div className="w-px h-4 bg-white/20 mx-2"></div>
                                <button onClick={() => { setZoomLevel(1); setPanPosition({x:0, y:0}) }} className="text-xs font-medium hover:text-accent transition">Reset</button>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full h-full max-w-5xl bg-white rounded-lg shadow-2xl overflow-hidden">
                             {/* PDF Viewer using object/iframe */}
                             {previewAttachment.mimeType === 'application/pdf' ? (
                                 <iframe 
                                     src={previewAttachment.data} 
                                     className="w-full h-full" 
                                     title="PDF Viewer"
                                 />
                             ) : (
                                 <div className="flex flex-col items-center justify-center h-full text-slate-500">
                                     <FileText size={64} className="mb-4 text-slate-300" />
                                     <p>Preview not available for this file type.</p>
                                 </div>
                             )}
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
export default Chat;