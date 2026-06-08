"use client";

import { useState, useEffect, useRef, Suspense } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, doc, deleteDoc, updateDoc, getDoc, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { 
  User, 
  UserCircle, 
  Package, 
  Clock, 
  ExternalLink, 
  Trash2, 
  Edit, 
  ShoppingBag, 
  Heart, 
  Settings, 
  MessageCircle,
  CheckCircle2, 
  Eye, 
  X, 
  Send,
  HelpCircle,
  ShieldAlert,
  ArrowLeft,
  Moon,
  Sun
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import styles from './profile.module.css';



function ProfileContent() {
  const { user, loading, loginWithGoogle } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const messagesEndRef = useRef(null);

  const tabParam = searchParams.get('tab');
  const startChatId = searchParams.get('startChat');
  const itemNameParam = searchParams.get('itemName');
  const itemIdParam = searchParams.get('itemId');
  const sellerNameParam = searchParams.get('sellerName');
  const sellerPhotoParam = searchParams.get('sellerPhoto');

  const [activeTab, setActiveTab] = useState(() => tabParam || 'listings');
  const [prevTabParam, setPrevTabParam] = useState(tabParam);
  if (tabParam !== prevTabParam) {
    setPrevTabParam(tabParam);
    setActiveTab(tabParam || 'listings');
  }

  const [userListings, setUserListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(true);

  // Favorites state
  const [savedListings, setSavedListings] = useState([]);
  const [savedLoading, setSavedLoading] = useState(false);

  // Edit modal states
  const [editingItem, setEditingItem] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    price: '',
    age: '',
    category: '',
    description: ''
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete confirmation state
  const [deletingId, setDeletingId] = useState(null);

  // Chat states
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [typedMessage, setTypedMessage] = useState("");

  // Dark Mode State
  const [darkMode, setDarkMode] = useState(false);
  useEffect(() => {
    const savedDark = localStorage.getItem('darkMode') === 'true';
    setTimeout(() => {
      setDarkMode(savedDark);
    }, 0);
    if (savedDark) {
      document.body.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    localStorage.setItem('darkMode', String(nextDark));
    document.body.classList.toggle('dark', nextDark);
  };

  // Firestore Settings States
  const [userSettings, setUserSettings] = useState({
    phone: '',
    department: 'CSE',
    semester: '6',
    matchAlerts: true,
    whatsappNotif: true,
    emailNotif: true,
    pushNotif: false,
    blockedUsers: []
  });
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState(null);

  useEffect(() => {
    if (!user) return;
    async function loadSettings() {
      try {
        const docRef = doc(db, 'users', user.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setUserSettings(snap.data());
        }
      } catch (err) {
        console.error('Error loading settings:', err);
      } finally {
        setSettingsLoading(false);
      }
    }
    if (activeTab === 'settings') {
      loadSettings();
    }
  }, [user, activeTab]);

  const saveSettings = async (e) => {
    e.preventDefault();
    if (!user) return;
    setIsSavingSettings(true);
    setSettingsMessage(null);
    try {
      const { setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'users', user.uid), userSettings, { merge: true });
      // Update local storage so listings matching logic can read it instantly
      localStorage.setItem('userDept', userSettings.department);
      localStorage.setItem('matchAlerts', String(userSettings.matchAlerts));
      localStorage.setItem('blockedUsers', JSON.stringify(userSettings.blockedUsers || []));
      window.dispatchEvent(new Event('settingsChanged'));
      setSettingsMessage({ type: 'success', text: 'Settings updated successfully!' });
    } catch (err) {
      console.error('Error saving settings:', err);
      setSettingsMessage({ type: 'error', text: 'Failed to save settings.' });
    } finally {
      setIsSavingSettings(false);
      setTimeout(() => setSettingsMessage(null), 3000);
    }
  };

  // Handle auto-starting a chat from Detail Page trigger (Firestore-backed)
  useEffect(() => {
    if (activeTab !== 'chat' || !startChatId || !user) return;

    async function initChat() {
      try {
        // Check if a chat already exists between these users (merge into single thread like WhatsApp)
        const q = query(
          collection(db, 'chats'),
          where('participants', 'array-contains', user.uid)
        );
        const snapshot = await getDocs(q);

        const decodedItemName = decodeURIComponent(itemNameParam || '');
        let existingChat = null;
        snapshot.docs.forEach(d => {
          const data = d.data();
          if (data.participants.includes(startChatId)) {
            existingChat = { id: d.id, ...data };
          }
        });

        if (existingChat) {
          // If the chat exists but is for a different item, update the active negotiating item
          if (itemNameParam && existingChat.itemName !== decodedItemName) {
            await updateDoc(doc(db, 'chats', existingChat.id), {
              itemId: itemIdParam || '',
              itemName: decodedItemName
            });
          }
          setSelectedChatId(existingChat.id);
        } else {
          // Create new chat document in Firestore
          const newChatRef = await addDoc(collection(db, 'chats'), {
            participants: [user.uid, startChatId],
            participantDetails: {
              [user.uid]: { name: user.displayName || 'Student', photo: user.photoURL || '' },
              [startChatId]: { name: decodeURIComponent(sellerNameParam || 'Seller'), photo: decodeURIComponent(sellerPhotoParam || '') }
            },
            itemId: itemIdParam || '',
            itemName: decodedItemName,
            lastMessage: '',
            lastMessageAt: serverTimestamp(),
            createdAt: serverTimestamp()
          });

          setSelectedChatId(newChatRef.id);
        }
      } catch (err) {
        console.error('Error initializing chat:', err);
      }

      router.replace('/profile?tab=chat');
    }

    initChat();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, startChatId, user]);

  // Load user's chats from Firestore (real-time)
  useEffect(() => {
    if (!user || activeTab !== 'chat') return;

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const chatData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      chatData.sort((a, b) => (b.lastMessageAt?.seconds || 0) - (a.lastMessageAt?.seconds || 0));
      setChats(chatData);
    }, (err) => {
      console.error('Error loading chats:', err);
    });

    return () => unsub();
  }, [user, activeTab]);

  // Load messages for the selected chat (real-time)
  useEffect(() => {
    if (!selectedChatId) {
      setTimeout(() => {
        setChatMessages([]);
      }, 0);
      return;
    }

    const messagesRef = collection(db, 'chats', selectedChatId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsub = onSnapshot(q, (snapshot) => {
      setChatMessages(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.error('Error loading messages:', err);
    });

    return () => unsub();
  }, [selectedChatId]);

  // Load User Listings
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "listings"),
      where("sellerId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUserListings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setListingsLoading(false);
    }, (err) => {
      console.error("Profile Query Error:", err);
      // Fallback: load listings without sorting to bypass missing indexes error
      const qFallback = query(collection(db, "listings"), where("sellerId", "==", user.uid));
      onSnapshot(qFallback, (snap) => {
        const sorted = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setUserListings(sorted);
        setListingsLoading(false);
      });
    });

    return () => unsubscribe();
  }, [user]);

  // Load Saved Items details
  useEffect(() => {
    if (activeTab !== 'saved') return;
    
    async function fetchSavedItems() {
      setSavedLoading(true);
      const favs = JSON.parse(localStorage.getItem('savedItems') || '[]');
      if (favs.length === 0) {
        setSavedListings([]);
        setSavedLoading(false);
        return;
      }

      try {
        const items = [];
        for (const id of favs) {
          const docRef = doc(db, "listings", id);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            items.push({ id: snap.id, ...snap.data() });
          }
        }
        setSavedListings(items);
      } catch (err) {
        console.error("Error fetching saved items:", err);
      } finally {
        setSavedLoading(false);
      }
    }

    fetchSavedItems();
  }, [activeTab]);

  // Scroll chat messages to bottom
  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, selectedChatId, activeTab]);

  const activeChat = chats.find(c => c.id === selectedChatId);

  // De-duplicate chats list in the UI for the sidebar list (show only 1 row per contact)
  const uniqueChats = [];
  const seenParticipants = new Set();
  chats.forEach(chat => {
    const otherId = chat.participants?.find(p => p !== user.uid);
    if (otherId) {
      if (!seenParticipants.has(otherId)) {
        seenParticipants.add(otherId);
        uniqueChats.push(chat);
      }
    } else {
      uniqueChats.push(chat);
    }
  });

  // Helper: get the OTHER participant's info from a chat document
  const getOtherParticipant = (chat) => {
    if (!user || !chat?.participantDetails) return { name: 'Student', photo: '' };
    const otherId = chat.participants?.find(p => p !== user.uid);
    return chat.participantDetails?.[otherId] || { name: 'Student', photo: '' };
  };

  const activeChatOther = activeChat ? getOtherParticipant(activeChat) : { name: 'Student', photo: '' };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!typedMessage.trim() || !selectedChatId || !user) return;

    const text = typedMessage.trim();
    setTypedMessage("");

    try {
      await addDoc(collection(db, 'chats', selectedChatId, 'messages'), {
        senderId: user.uid,
        senderName: user.displayName || 'Student',
        text,
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, 'chats', selectedChatId), {
        lastMessage: text,
        lastMessageAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  // Toggle listing status between Sold and Active
  const handleToggleSold = async (itemId, currentStatus) => {
    try {
      const nextStatus = currentStatus === 'sold' ? 'active' : 'sold';
      const docRef = doc(db, "listings", itemId);
      await updateDoc(docRef, { status: nextStatus });
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  // Delete Listing from database
  const handleDeleteListing = async (itemId) => {
    try {
      await deleteDoc(doc(db, "listings", itemId));
      setDeletingId(null);
    } catch (err) {
      console.error("Error deleting listing:", err);
    }
  };

  // Open Edit Modal with selected item
  const openEditModal = (item) => {
    setEditingItem(item);
    setEditFormData({
      title: item.title,
      price: item.price,
      age: item.age || '',
      category: item.category,
      description: item.description
    });
  };

  // Submit edits to Firestore
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;
    setIsUpdating(true);
    try {
      const docRef = doc(db, "listings", editingItem.id);
      await updateDoc(docRef, {
        ...editFormData,
        price: Number(editFormData.price)
      });
      setEditingItem(null);
    } catch (err) {
      console.error("Error updating listing:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) return <div className={styles.loading}>Accessing student profile...</div>;

  if (!user) {
    return (
      <div className={`${styles.page} container animate-fade-up`}>
        <div className={styles.loginRequired}>
          <UserCircle size={64} color="var(--primary)" />
          <h1>Profile Access <span className="gradient-text">Restricted</span></h1>
          <p>Please sign in with your student account to access the dashboard and live chats.</p>
          <button onClick={loginWithGoogle} className={styles.loginBtn}>Login with Google</button>
        </div>
      </div>
    );
  }

  // Count items marked sold
  const soldCount = userListings.filter(item => item.status === 'sold').length;

  return (
    <div className={`${styles.page} container animate-fade-up`}>
      {/* Top Profile Premium Header */}
      <header className={styles.profileHeader}>
        <div className={styles.profileInfo}>
          <div className={styles.avatarLarge}>
            {user.photoURL ? (
              <Image src={user.photoURL} alt={user.displayName} width={100} height={100} className={styles.avatarImg} />
            ) : (
              <UserCircle size={100} className={styles.avatarPlaceholder} />
            )}
          </div>
          <div className={styles.userText}>
            <h1>{user.displayName}</h1>
            <p className={styles.emailBadge}>{user.email}</p>
            <div className={styles.stats}>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{userListings.length}</span>
                <span className={styles.statLabel}>Listings</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{soldCount}</span>
                <span className={styles.statLabel}>Sold</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs list (My Listings, Saved Items, Chats, Settings) */}
      <nav className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'listings' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('listings')}
        >
          <Package size={16} />
          <span>Listings</span>
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'saved' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('saved')}
        >
          <Heart size={16} />
          <span>Saved</span>
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'chat' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          <MessageCircle size={16} />
          <span>Chats</span>
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'settings' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Settings size={16} />
          <span>Settings</span>
        </button>
      </nav>

      {/* Tab Contents */}
      <div className={styles.tabContent}>
        {activeTab === 'listings' && (
          <div className={styles.listingsList}>
            {listingsLoading ? (
              <p>Fetching your listings...</p>
            ) : userListings.length > 0 ? (
              userListings.map(item => (
                <div key={item.id} className={`${styles.listingItem} ${item.status === 'sold' ? styles.soldItem : ''}`}>
                  <div className={styles.itemImage}>
                    <Image src={item.images?.[0] || 'https://via.placeholder.com/150'} alt={item.title} fill className={styles.img} />
                    {item.status === 'sold' && <div className={styles.soldBanner}>SOLD</div>}
                  </div>
                  
                  <div className={styles.itemDetails}>
                    <div className={styles.priceRow}>
                      <span className={styles.itemPrice}>₹{item.price}</span>
                      <span className={styles.itemCategory}>{item.category}</span>
                    </div>
                    <h3>{item.title}</h3>
                    <p className={styles.itemDate}>
                      Listed on {item.createdAt?.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  
                  <div className={styles.itemActions}>
                    <button 
                      onClick={() => handleToggleSold(item.id, item.status)} 
                      className={`${styles.actionBtn} ${item.status === 'sold' ? styles.soldToggleActive : ''}`}
                      title={item.status === 'sold' ? "Mark as Available" : "Mark as Sold"}
                    >
                      <CheckCircle2 size={16} />
                      <span className={styles.btnLabel}>{item.status === 'sold' ? 'Sold' : 'Mark Sold'}</span>
                    </button>
                    <button 
                      onClick={() => openEditModal(item)}
                      className={styles.actionBtn}
                      title="Edit Item"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => setDeletingId(item.id)} 
                      className={`${styles.actionBtn} ${styles.deleteBtn}`}
                      title="Delete Item"
                    >
                      <Trash2 size={16} />
                    </button>
                    <Link href={`/listing?id=${item.id}`} className={styles.actionBtn} title="View Page">
                      <Eye size={16} />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyContainer}>
                <ShoppingBag size={44} />
                <h3>No active listings</h3>
                <p>Declutter your locker or dorm room by listing textbooks, notebooks, calculators, or other items.</p>
                <Link href="/sell" className={styles.sellBtn}>List an Item</Link>
              </div>
            )}
          </div>
        )}

        {/* Saved Items Tab (Fetches LocalStorage Favorites dynamically) */}
        {activeTab === 'saved' && (
          <div>
            {savedLoading ? (
              <p>Syncing saved favorites...</p>
            ) : savedListings.length > 0 ? (
              <div className={styles.productGrid}>
                {savedListings.map(item => (
                  <ProductCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className={styles.emptyContainer}>
                <Heart size={44} />
                <h3>Your wishlist is empty</h3>
                <p>Click the heart icon on cards or detail pages to save campus finds here.</p>
                <Link href="/explore" className={styles.sellBtn}>Explore Items</Link>
              </div>
            )}
          </div>
        )}

        {/* Live Chats Tab (Interactive Chat Window Pane!) */}
        {activeTab === 'chat' && (
          <div className={`${styles.chatDashboard} glass-effect`}>
            {/* Chats List Sidebar */}
            <div className={`${styles.chatSidebar} ${selectedChatId ? styles.mobileHidden : ''}`}>
              <div className={styles.sidebarHeader}>
                <h4>Conversations</h4>
              </div>
              <div className={styles.chatsList}>
                {uniqueChats.length === 0 ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <MessageCircle size={28} style={{ marginBottom: '8px', opacity: 0.5 }} />
                    <p>No conversations yet.</p>
                    <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>Visit a listing and tap Chat Now to start.</p>
                  </div>
                ) : uniqueChats.map(chat => {
                  const other = getOtherParticipant(chat);
                  return (
                    <button 
                      key={chat.id} 
                      className={`${styles.chatRow} ${selectedChatId === chat.id ? styles.chatRowActive : ''}`}
                      onClick={() => setSelectedChatId(chat.id)}
                    >
                      <div className={styles.chatAvatar}>
                        {other.photo ? (
                          <Image src={other.photo} alt={other.name} fill className={styles.avatarImg} />
                        ) : (
                          <User size={18} />
                        )}
                      </div>
                      <div className={styles.chatRowInfo}>
                        <span className={styles.chatName}>{other.name}</span>
                        <span className={styles.chatItemName}>{chat.itemName}</span>
                        <p className={styles.lastText}>
                          {chat.lastMessage || "No messages yet."}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Chat Conversation pane */}
            <div className={`${styles.chatPane} ${!selectedChatId ? styles.mobileHidden : ''}`}>
              {activeChat ? (
                <>
                  <div className={styles.paneHeader}>
                    {/* Back Button for mobile */}
                    <button 
                      onClick={() => setSelectedChatId(null)} 
                      className={styles.backBtn}
                      type="button"
                    >
                      <ArrowLeft size={18} />
                    </button>
                    <div className={styles.chatAvatar}>
                      {activeChatOther.photo ? (
                        <Image src={activeChatOther.photo} alt={activeChatOther.name} fill className={styles.avatarImg} />
                      ) : (
                        <User size={18} />
                      )}
                    </div>
                    <div className={styles.paneHeaderInfo}>
                      <h5>{activeChatOther.name}</h5>
                      <span className={styles.itemTag}>Negotiating: {activeChat.itemName}</span>
                    </div>
                  </div>

                  <div className={styles.messagesWindow}>
                    {chatMessages.map((msg, idx) => (
                      <div key={msg.id || idx} className={`${styles.messageBubble} ${msg.senderId === user?.uid ? styles.msgMe : styles.msgThem}`}>
                        <p>{msg.text}</p>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  <form onSubmit={sendMessage} className={styles.chatInputBar}>
                    <input 
                      type="text" 
                      placeholder="Type a message..." 
                      value={typedMessage}
                      onChange={(e) => setTypedMessage(e.target.value)}
                    />
                    <button type="submit"><Send size={16} /></button>
                  </form>
                </>
              ) : (
                <div className={styles.noChatSelected}>
                  <MessageCircle size={44} />
                  <h4>Select a conversation</h4>
                  <p>Choose a student buyer/seller from the left sidebar to coordinate campus meeting points.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className={styles.settingsContainer}>
            <form onSubmit={saveSettings} className={styles.settingsForm}>
              
              {/* Profile Card Section */}
              <div className={`${styles.settingsCard} glass-effect animate-fade-in`}>
                <div className={styles.cardHeader}>
                  <UserCircle size={20} color="var(--primary)" />
                  <h3>Personal Information</h3>
                </div>
                <div className={styles.cardContent}>
                  <div className={styles.formGroup}>
                    <label>WhatsApp / Phone Number</label>
                    <input 
                      type="tel" 
                      placeholder="e.g. +91 98765 43210" 
                      value={userSettings.phone || ''}
                      onChange={(e) => setUserSettings({...userSettings, phone: e.target.value})}
                    />
                    <small className={styles.helpText}>Buyers will use this to contact you for meetups.</small>
                  </div>
                  
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Department / Branch</label>
                      <select 
                        value={userSettings.department || 'CSE'}
                        onChange={(e) => setUserSettings({...userSettings, department: e.target.value})}
                      >
                        <option value="CSE">Computer Science & Eng. (CSE)</option>
                        <option value="IT">Information Technology (IT)</option>
                        <option value="EC">Electronics & Comm. (EC)</option>
                        <option value="ME">Mechanical Engineering (ME)</option>
                        <option value="Civil">Civil Engineering</option>
                        <option value="MBA">MBA</option>
                        <option value="MCA">MCA</option>
                        <option value="Other">Other Department</option>
                      </select>
                    </div>
                    
                    <div className={styles.formGroup}>
                      <label>Current Semester</label>
                      <select 
                        value={userSettings.semester || '6'}
                        onChange={(e) => setUserSettings({...userSettings, semester: e.target.value})}
                      >
                        <option value="1">1st Semester</option>
                        <option value="2">2nd Semester</option>
                        <option value="3">3rd Semester</option>
                        <option value="4">4th Semester</option>
                        <option value="5">5th Semester</option>
                        <option value="6">6th Semester</option>
                        <option value="7">7th Semester</option>
                        <option value="8">8th Semester</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preference / Matching Filters */}
              <div className={`${styles.settingsCard} glass-effect animate-fade-in`}>
                <div className={styles.cardHeader}>
                  <Heart size={20} color="var(--primary)" />
                  <h3>Campus Matching & Filters</h3>
                </div>
                <div className={styles.cardContent}>
                  <div className={styles.toggleRow}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleLabel}>Department Match Highlight</span>
                      <p className={styles.toggleDesc}>Automatically highlight and flag listings posted by students in your department.</p>
                    </div>
                    <label className={styles.switch}>
                      <input 
                        type="checkbox" 
                        checked={userSettings.matchAlerts ?? true}
                        onChange={(e) => setUserSettings({...userSettings, matchAlerts: e.target.checked})}
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>

                  <div className={styles.toggleRow}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleLabel}>Dark Mode Theme</span>
                      <p className={styles.toggleDesc}>Switch between clean light mode and premium space navy dark theme.</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={toggleDarkMode} 
                      className={`${styles.themeToggleBtn} ${darkMode ? styles.darkActive : ''}`}
                    >
                      {darkMode ? <Sun size={16} /> : <Moon size={16} />}
                      <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Phone Notification Settings */}
              <div className={`${styles.settingsCard} glass-effect animate-fade-in`}>
                <div className={styles.cardHeader}>
                  <MessageCircle size={20} color="var(--primary)" />
                  <h3>Notifications on Phone</h3>
                </div>
                <div className={styles.cardContent}>
                  <div className={styles.toggleRow}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleLabel}>WhatsApp Alerts Hook</span>
                      <p className={styles.toggleDesc}>Send a notification to your WhatsApp number when someone messages you about a listing.</p>
                    </div>
                    <label className={styles.switch}>
                      <input 
                        type="checkbox" 
                        checked={userSettings.whatsappNotif ?? true}
                        onChange={(e) => setUserSettings({...userSettings, whatsappNotif: e.target.checked})}
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>

                  <div className={styles.toggleRow}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleLabel}>Email Notifications</span>
                      <p className={styles.toggleDesc}>Receive email digests for price drops on wishlisted items.</p>
                    </div>
                    <label className={styles.switch}>
                      <input 
                        type="checkbox" 
                        checked={userSettings.emailNotif ?? true}
                        onChange={(e) => setUserSettings({...userSettings, emailNotif: e.target.checked})}
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>

                  <div className={styles.toggleRow}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleLabel}>Push Alerts on Mobile</span>
                      <p className={styles.toggleDesc}>Enable native web push notifications on your phone.</p>
                    </div>
                    <label className={styles.switch}>
                      <input 
                        type="checkbox" 
                        checked={userSettings.pushNotif ?? false}
                        onChange={(e) => setUserSettings({...userSettings, pushNotif: e.target.checked})}
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Blocked Users Section */}
              <div className={`${styles.settingsCard} glass-effect animate-fade-in`}>
                <div className={styles.cardHeader}>
                  <ShieldAlert size={20} color="var(--danger)" />
                  <h3>Mute & Block Settings</h3>
                </div>
                <div className={styles.cardContent}>
                  <p className={styles.toggleDesc} style={{ marginBottom: '12px' }}>
                    Blocking a student hides all their listings and disables messaging between you.
                  </p>
                  
                  {userSettings.blockedUsers?.length > 0 ? (
                    <div className={styles.blockedList}>
                      {userSettings.blockedUsers.map((uid, index) => (
                        <div key={uid} className={styles.blockedUserRow}>
                          <span>Student ID: {uid.substring(0, 10)}...</span>
                          <button 
                            type="button" 
                            className={styles.unblockBtn}
                            onClick={() => {
                              const list = [...userSettings.blockedUsers];
                              list.splice(index, 1);
                              setUserSettings({...userSettings, blockedUsers: list});
                            }}
                          >
                            Unblock
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.noBlocked}>
                      <CheckCircle2 size={16} color="var(--emerald)" />
                      <span>No students blocked. Nice!</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Row */}
              <div className={styles.settingsActions}>
                {settingsMessage && (
                  <span className={`${styles.toast} ${settingsMessage.type === 'success' ? styles.toastSuccess : styles.toastError}`}>
                    {settingsMessage.text}
                  </span>
                )}
                <button type="submit" disabled={isSavingSettings} className={styles.saveSettingsBtn}>
                  {isSavingSettings ? "Saving Settings..." : "Save Preferences"}
                </button>
              </div>

            </form>
          </div>
        )}
      </div>

      {/* 1. Edit Modal Overlay */}
      {editingItem && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalCard} glass-effect animate-fade-in`}>
            <div className={styles.modalHeader}>
              <h3>Edit Listing</h3>
              <button onClick={() => setEditingItem(null)} className={styles.closeBtn}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleUpdateSubmit} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Item Title</label>
                <input 
                  type="text" 
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                  required
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Price (₹)</label>
                  <input 
                    type="number" 
                    value={editFormData.price}
                    onChange={(e) => setEditFormData({...editFormData, price: e.target.value})}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Age / Condition</label>
                  <input 
                    type="text" 
                    value={editFormData.age}
                    onChange={(e) => setEditFormData({...editFormData, age: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Category</label>
                <select 
                  value={editFormData.category}
                  onChange={(e) => setEditFormData({...editFormData, category: e.target.value})}
                  required
                >
                  <option value="books">Books</option>
                  <option value="electronics">Electronics</option>
                  <option value="fashion">Fashion</option>
                  <option value="home">Home</option>
                  <option value="sports">Sports</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea 
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                  required
                  rows={4}
                />
              </div>

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setEditingItem(null)} className={styles.cancelBtn}>Cancel</button>
                <button type="submit" disabled={isUpdating} className={styles.confirmBtn}>
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Delete Confirmation Overlay */}
      {deletingId && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.confirmCard} glass-effect animate-fade-in`}>
            <ShieldAlert size={44} color="var(--danger)" style={{ marginBottom: '12px' }} />
            <h3>Delete Listing?</h3>
            <p>Are you sure you want to permanently remove this listing from AcroCart? This action cannot be undone.</p>
            <div className={styles.confirmActions}>
              <button onClick={() => setDeletingId(null)} className={styles.cancelBtn}>Cancel</button>
              <button onClick={() => handleDeleteListing(deletingId)} className={styles.deleteConfirmBtn}>Delete Permanently</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className={styles.loading}>Loading student profile...</div>}>
      <ProfileContent />
    </Suspense>
  );
}
