"use client";

import { useState, useEffect, useRef, Suspense } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, doc, deleteDoc, updateDoc, getDoc } from 'firebase/firestore';
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
  ShieldAlert
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import styles from './profile.module.css';

// Mock chat profiles
const MOCK_CHATS = [
  {
    id: "seller1",
    name: "Aman Sharma",
    photo: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=150&auto=format&fit=crop",
    item: "Scientific Calculator FX-991EX",
    messages: [
      { sender: 'them', text: "Hey! Yes, the scientific calculator is still available." },
      { sender: 'me', text: "Awesome, would you be open to meeting at Block B canteen tomorrow?" },
      { sender: 'them', text: "Sure, I have a class there at 2:00 PM. Meet you at the entrance?" }
    ]
  },
  {
    id: "seller2",
    name: "Ritu Patel",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop",
    item: "HC Verma Physics Vol 1",
    messages: [
      { sender: 'them', text: "Hi, I can give you the book for ₹250. It's in brand new condition." },
      { sender: 'me', text: "Can we do ₹200? I can pick it up today itself." },
      { sender: 'them', text: "Alright, deal! I am currently in the Central Library." }
    ]
  }
];

function ProfileContent() {
  const { user, loading, loginWithGoogle } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const messagesEndRef = useRef(null);

  const tabParam = searchParams.get('tab');
  const startChatId = searchParams.get('startChat');
  const itemNameParam = searchParams.get('itemName');

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
  const [chats, setChats] = useState(MOCK_CHATS);
  const [selectedChatId, setSelectedChatId] = useState("seller1");
  const [typedMessage, setTypedMessage] = useState("");

  // Handle auto-starting a chat from Detail Page trigger
  useEffect(() => {
    if (activeTab === 'chat' && startChatId && itemNameParam) {
      // Check if chat exists
      const existingIdx = chats.findIndex(c => c.id === startChatId);
      if (existingIdx !== -1) {
        setTimeout(() => {
          setSelectedChatId(startChatId);
        }, 0);
      } else {
        // Create new mock chat
        const newChat = {
          id: startChatId,
          name: "Seller / Student",
          photo: "",
          item: decodeURIComponent(itemNameParam),
          messages: [
            { sender: 'me', text: `Hi! Is the item "${decodeURIComponent(itemNameParam)}" still available for trade?` }
          ]
        };
        setTimeout(() => {
          setChats(prev => [newChat, ...prev.filter(c => c.id !== startChatId)]);
          setSelectedChatId(startChatId);
        }, 0);
      }
      
      // Clean query params to prevent duplication on reload
      router.replace('/profile?tab=chat');
    }
  }, [activeTab, startChatId, itemNameParam, chats, router]);

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
  }, [chats, selectedChatId, activeTab]);

  const activeChat = chats.find(c => c.id === selectedChatId);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!typedMessage.trim() || !selectedChatId) return;

    setChats(chats.map(chat => {
      if (chat.id === selectedChatId) {
        return {
          ...chat,
          messages: [...chat.messages, { sender: 'me', text: typedMessage }]
        };
      }
      return chat;
    }));
    setTypedMessage("");

    // Simulate reply after 1.5 seconds
    setTimeout(() => {
      setChats(prevChats => prevChats.map(chat => {
        if (chat.id === selectedChatId) {
          return {
            ...chat,
            messages: [...chat.messages, { sender: 'them', text: "Awesome! Let me know where on campus works best for you." }]
          };
        }
        return chat;
      }));
    }, 1500);
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
            <div className={styles.chatSidebar}>
              <div className={styles.sidebarHeader}>
                <h4>Conversations</h4>
              </div>
              <div className={styles.chatsList}>
                {chats.map(chat => (
                  <button 
                    key={chat.id} 
                    className={`${styles.chatRow} ${selectedChatId === chat.id ? styles.chatRowActive : ''}`}
                    onClick={() => setSelectedChatId(chat.id)}
                  >
                    <div className={styles.chatAvatar}>
                      {chat.photo ? (
                        <Image src={chat.photo} alt={chat.name} fill className={styles.avatarImg} />
                      ) : (
                        <User size={18} />
                      )}
                    </div>
                    <div className={styles.chatRowInfo}>
                      <span className={styles.chatName}>{chat.name}</span>
                      <span className={styles.chatItemName}>{chat.item}</span>
                      <p className={styles.lastText}>
                        {chat.messages?.[chat.messages.length - 1]?.text || "No messages yet."}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Conversation pane */}
            <div className={styles.chatPane}>
              {activeChat ? (
                <>
                  <div className={styles.paneHeader}>
                    <div className={styles.chatAvatar}>
                      {activeChat.photo ? (
                        <Image src={activeChat.photo} alt={activeChat.name} fill className={styles.avatarImg} />
                      ) : (
                        <User size={18} />
                      )}
                    </div>
                    <div className={styles.paneHeaderInfo}>
                      <h5>{activeChat.name}</h5>
                      <span className={styles.itemTag}>Negotiating: {activeChat.item}</span>
                    </div>
                  </div>

                  <div className={styles.messagesWindow}>
                    {activeChat.messages.map((msg, idx) => (
                      <div key={idx} className={`${styles.messageBubble} ${msg.sender === 'me' ? styles.msgMe : styles.msgThem}`}>
                        <p>{msg.text}</p>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  <form onSubmit={sendMessage} className={styles.chatInputBar}>
                    <input 
                      type="text" 
                      placeholder="Type a message (e.g. Can we meet at block C canteen?)..." 
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
          <div className={styles.emptyContainer}>
            <Settings size={44} />
            <h3>Account Settings</h3>
            <p>Profile personalization, block matching filters, and WhatsApp notification hooks are currently in development.</p>
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
