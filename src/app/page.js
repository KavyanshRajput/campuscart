"use client";

import { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, doc, getDoc, where } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';
import { 
  ShoppingBag, 
  Search, 
  Compass, 
  Sparkles, 
  ArrowRight,
  Book, 
  Laptop, 
  Shirt, 
  Home as HomeIcon, 
  Trophy, 
  Heart,
  ChevronRight,
  Zap,
  Users,
  CheckCircle2,
  Clock,
  GraduationCap,
  Download
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import styles from './page.module.css';

const CATEGORIES = [
  { name: 'Books', icon: <Book size={20} />, color: '#6366f1', id: 'books' },
  { name: 'Electronics', icon: <Laptop size={20} />, color: '#10b981', id: 'electronics' },
  { name: 'Fashion', icon: <Shirt size={20} />, color: '#f59e0b', id: 'fashion' },
  { name: 'Home', icon: <HomeIcon size={20} />, color: '#ec4899', id: 'home' },
  { name: 'Sports', icon: <Trophy size={20} />, color: '#8b5cf6', id: 'sports' },
  { name: 'Other', icon: <Heart size={20} />, color: '#64748b', id: 'other' },
];





export default function Home() {
  const { user, loginWithGoogle } = useAuth();
  const router = useRouter();
  
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);

  // PWA Install prompt capture
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstall(true);
    };
    const installedHandler = () => setShowInstall(false);

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installedHandler);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setShowInstall(false);
    setInstallPrompt(null);
  };
  
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/explore?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const [activities, setActivities] = useState([]);
  const [activeListingsCount, setActiveListingsCount] = useState(null);
  const [savedItems, setSavedItems] = useState([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const seenIds = useRef(new Set());

  // Live Activity feed — real Firestore data
  useEffect(() => {
    const activityQuery = query(
      collection(db, 'listings'),
      orderBy('createdAt', 'desc'),
      limit(8)
    );

    const unsub = onSnapshot(activityQuery, (snapshot) => {
      const newItems = [];
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const d = change.doc.data();
          if (!seenIds.current.has(change.doc.id)) {
            seenIds.current.add(change.doc.id);
            const action = d.status === 'sold' ? 'sold' : 'listed';
            const price = d.price ? ` for ₹${d.price}` : '';
            const cat = d.category ? ` [${d.category}]` : '';
            newItems.push(`${d.sellerName || 'A student'} ${action} "${d.title}"${price}${cat}`);
          }
        }
      });

      if (newItems.length > 0) {
        setActivities(prev => [...newItems, ...prev].slice(0, 6));
      } else if (seenIds.current.size === 0) {
        // First load — populate from full snapshot
        const all = snapshot.docs.map(doc => {
          const d = doc.data();
          const action = d.status === 'sold' ? 'sold' : 'listed';
          const price = d.price ? ` for ₹${d.price}` : '';
          const cat = d.category ? ` [${d.category}]` : '';
          seenIds.current.add(doc.id);
          return `${d.sellerName || 'A student'} ${action} "${d.title}"${price}${cat}`;
        });
        setActivities(all);
      }
    });

    return () => unsub();
  }, []);

  // Campus Pulse — real active listing count
  useEffect(() => {
    const activeQuery = query(
      collection(db, 'listings'),
      where('status', '!=', 'sold')
    );
    const unsub = onSnapshot(activeQuery, (snap) => {
      setActiveListingsCount(snap.size);
    });
    return () => unsub();
  }, []);

  // Saved items loader
  useEffect(() => {
    if (!user) {
      setSavedItems([]);
      return;
    }
    
    async function fetchSavedItems() {
      setSavedLoading(true);
      try {
        const favs = JSON.parse(localStorage.getItem('savedItems') || '[]');
        if (favs.length === 0) {
          setSavedItems([]);
          setSavedLoading(false);
          return;
        }
        
        const items = [];
        // Limit to 3 items in the homepage preview
        for (const id of favs.slice(0, 3)) {
          const docRef = doc(db, "listings", id);
          const snap = await getDoc(docRef);
          if (snap.exists() && snap.data().status !== 'sold') {
            items.push({ id: snap.id, ...snap.data() });
          }
        }
        setSavedItems(items);
      } catch (err) {
        console.error("Error loading homepage saved items:", err);
      } finally {
        setSavedLoading(false);
      }
    }

    fetchSavedItems();
    
    // Add local storage change listener to sync in real-time
    const handleStorageSync = () => fetchSavedItems();
    window.addEventListener('storage', handleStorageSync);
    return () => window.removeEventListener('storage', handleStorageSync);
  }, [user]);

  const [blockedUsers, setBlockedUsers] = useState([]);
  useEffect(() => {
    const checkBlocked = () => {
      if (typeof window !== 'undefined') {
        try {
          setBlockedUsers(JSON.parse(localStorage.getItem('blockedUsers') || '[]'));
        } catch (e) {}
      }
    };
    checkBlocked();
    window.addEventListener('settingsChanged', checkBlocked);
    return () => window.removeEventListener('settingsChanged', checkBlocked);
  }, []);

  useEffect(() => {
    // Robust Firestore Query Fetch with Client-side Fallback for Missing Indexes
    const listingsRef = collection(db, "listings");
    // Standard simple query that NEVER requires composite indexes
    const q = query(listingsRef, orderBy("createdAt", "desc"), limit(20));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter out deleted/inactive listings
      const activeListings = data.filter(item => item.status !== 'sold');
      setListings(activeListings);
      setLoading(false);
    }, (err) => {
      console.error("Firestore loading error, falling back:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);


  // Get active listings filtered client-side (more robust than composite indexes)
  const filteredListings = (activeCategory === 'All' 
    ? listings 
    : listings.filter(item => item.category?.toLowerCase() === activeCategory.toLowerCase()))
    .filter(item => !blockedUsers.includes(item.sellerId))
    .slice(0, 8);

  return (
    <div className={styles.page}>
      {/* Top Premium Curved Header Area */}
      <section className={styles.premiumHeader}>
        <div className={styles.heroGridBackground}></div>
        <div className={styles.heroParticleGlow}></div>

        {/* Top bar with install button */}
        {showInstall && (
          <div className={`${styles.installBar} container`}>
            <button onClick={handleInstall} className={styles.installBtn}>
              <Download size={15} />
              <span>Install App</span>
            </button>
          </div>
        )}

        <div className={`${styles.headerContent} container animate-fade-up`}>
          <h1 className={styles.headerTitle}>
            Locate your chosen <span className={styles.headerTitleGrad}>campus deal.</span>
          </h1>
        </div>
      </section>

      {/* Main Overlapping Content Sheet */}
      <main className={`${styles.mainContent} container`}>
        {/* Rounded Search Bar Card */}
        <form onSubmit={handleSearchSubmit} className={`${styles.searchCard} animate-fade-up`}>
          <Search className={styles.searchIcon} size={20} />
          <input 
            type="text" 
            placeholder="Search textbook, calculator, cycles..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className={styles.searchBtn}>Search</button>
        </form>

        <div className={styles.desktopLayoutGrid}>
          {/* Left / Center Main Feed */}
          <div className={styles.mainFeed}>
            {/* Dynamic Personalized Action Banner */}
            <section className={`${styles.actionBanner} animate-fade-up`}>
              {!user ? (
                /* Guest: Sign-in CTA */
                <div className={styles.actionBannerInner}>
                  <div className={styles.actionBannerLeft}>
                    <span className={styles.actionBannerEyebrow}>🎓 Students only</span>
                    <h2 className={styles.actionBannerTitle}>Buy & sell within<br/>your campus</h2>
                    <p className={styles.actionBannerSub}>Sign in with your college Google account to list items, save favourites and chat with sellers.</p>
                    <button onClick={loginWithGoogle} className={styles.actionBannerBtn}>
                      <span>Sign in with Google</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                  <div className={styles.actionBannerIllustration}>
                    <div className={styles.illustrationOrb}></div>
                    <ShoppingBag size={52} className={styles.illustrationIcon} />
                  </div>
                </div>
              ) : (
                /* Logged-in: Quick sell prompt */
                <div className={styles.actionBannerInner}>
                  <div className={styles.actionBannerLeft}>
                    <span className={styles.actionBannerEyebrow}>👋 Hey, {user.displayName?.split(' ')[0] || 'there'}</span>
                    <h2 className={styles.actionBannerTitle}>Got something<br/>to sell?</h2>
                    <p className={styles.actionBannerSub}>List it in under 2 minutes — photo, price, done. Reach every student on campus instantly.</p>
                    <Link href="/sell" className={styles.actionBannerBtn}>
                      <span>Post a listing</span>
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                  <div className={styles.actionBannerIllustration}>
                    <div className={styles.illustrationOrb}></div>
                    <Zap size={52} className={styles.illustrationIcon} />
                  </div>
                </div>
              )}
            </section>


            {/* Horizontal Category Circular Grid */}
            <section className={styles.categoriesSection}>
              <div className={styles.sectionHeader}>
                <h3>Top Categories</h3>
                <Link href="/explore" className={styles.seeAll}>See All</Link>
              </div>
              <div className={styles.categoryCircleGridWrapper}>
                <div className={styles.categoryCircleGrid}>
                  <button 
                    className={`${styles.categoryCircleCard} ${activeCategory === 'All' ? styles.catCircleActive : ''}`}
                    onClick={() => setActiveCategory('All')}
                  >
                    <div className={styles.iconBack} style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                      <Compass size={20} />
                    </div>
                    <span>All Items</span>
                  </button>
                  {CATEGORIES.map((cat) => (
                    <button 
                      key={cat.name} 
                      className={`${styles.categoryCircleCard} ${activeCategory === cat.name ? styles.catCircleActive : ''}`}
                      onClick={() => setActiveCategory(cat.name)}
                    >
                      <div className={styles.iconBack} style={{ backgroundColor: `${cat.color}15`, color: cat.color }}>
                        {cat.icon}
                      </div>
                      <span>{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Interactive Feature Highlight banner */}
            <section className={styles.closestSellerCard}>
              <div className={styles.closestFlex}>
                <div className={styles.closestInfo}>
                  <div className={styles.markerCircle}><Compass size={18} /></div>
                  <div>
                    <h4>Find the closest seller</h4>
                    <p>Connect with sellers on campus for safe and easy handovers.</p>
                  </div>
                </div>
                <Link href="/explore" className={styles.arrowCircle}>
                  <ChevronRight size={18} />
                </Link>
              </div>
            </section>

            {/* Available Near You / Recent listings */}
            <section className={styles.listingsSection}>
              <div className={styles.sectionHeader}>
                <h3>Available Near You</h3>
                <Link href="/explore" className={styles.seeAll}>See All</Link>
              </div>

              {loading ? (
                <div className={styles.loadingGrid}>
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className={styles.skeletonCard}>
                      <div className={styles.skeletonImage}></div>
                      <div className={styles.skeletonText1}></div>
                      <div className={styles.skeletonText2}></div>
                    </div>
                  ))}
                </div>
              ) : filteredListings.length > 0 ? (
                <div className={styles.productGrid}>
                  {filteredListings.map(item => (
                    <ProductCard key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}><ShoppingBag size={32} /></div>
                  <h4>No items listed in {activeCategory}</h4>
                  <p>Be the first to create a listing in this category!</p>
                  {user ? (
                    <Link href="/sell" className={styles.postBtn}>Post Listing</Link>
                  ) : (
                    <button onClick={loginWithGoogle} className={styles.postBtn}>Sign In to Post</button>
                  )}
                </div>
              )}
            </section>
          </div>

          {/* Right Sidebar Area (Desktop only layout) */}
          <aside className={styles.dashboardSidebar}>
            {/* Campus Pulse statistics widget */}
            <div className={`${styles.sidebarCard} glass-effect`}>
              <h4 className={styles.sidebarTitle}>
                <Sparkles size={16} className={styles.sidebarTitleIcon} />
                Campus Pulse
              </h4>
              <div className={styles.statsGrid}>
                <div className={styles.statItem}>
                  <Zap size={18} className={styles.statIcon} />
                  <div className={styles.statText}>
                    <span className={styles.statVal}>{activeListingsCount !== null ? activeListingsCount : '—'}</span>
                    <span className={styles.statLabel}>Active listings</span>
                  </div>
                </div>
                <div className={styles.statItem}>
                  <Users size={18} className={styles.statIcon} />
                  <div className={styles.statText}>
                    <span className={styles.statVal}>{listings.length > 0 ? new Set(listings.map(l => l.sellerId).filter(Boolean)).size : '—'}</span>
                    <span className={styles.statLabel}>Active Sellers</span>
                  </div>
                </div>
                <div className={styles.statItem}>
                  <CheckCircle2 size={18} className={styles.statIcon} />
                  <div className={styles.statText}>
                    <span className={styles.statVal}>{listings.length > 0 ? listings.length : '—'}</span>
                    <span className={styles.statLabel}>Listings Today</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Campus Activity ticker */}
            <div className={styles.sidebarCard}>
              <h4 className={styles.sidebarTitle}>
                <Clock size={16} className={styles.sidebarTitleIcon} />
                Live activity
              </h4>
              <div className={styles.activityList}>
                {activities.map((act, index) => (
                  <div key={index} className={`${styles.activityItem} ${index === 0 ? styles.newActivityAnim : ''}`}>
                    <div className={styles.activityDot}></div>
                    <p className={styles.activityText}>{act}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* User Quick Wishlist preview card */}
            <div className={styles.sidebarCard}>
              <h4 className={styles.sidebarTitle}>
                <Heart size={16} className={styles.sidebarTitleIcon} />
                Saved Items Preview
              </h4>
              
              {!user ? (
                <div className={styles.sidebarPromoContent}>
                  <p className={styles.promoText}>Sign in to bookmark listings and see them here for instant updates.</p>
                  <button onClick={loginWithGoogle} className={styles.sidebarActionBtn}>
                    Sign In
                  </button>
                </div>
              ) : savedLoading ? (
                <div className={styles.sidebarLoader}>Syncing wishlist...</div>
              ) : savedItems.length === 0 ? (
                <div className={styles.sidebarPromoContent}>
                  <p className={styles.promoText}>No saved items yet. Tap the ❤️ on any listing to bookmark it here!</p>
                  <Link href="/explore" className={styles.sidebarActionBtn}>
                    Explore Items
                  </Link>
                </div>
              ) : (
                <div className={styles.wishlistList}>
                  {savedItems.map(item => (
                    <Link key={item.id} href={`/listing?id=${item.id}`} className={styles.wishlistItem}>
                      <div className={styles.wishlistImgWrapper}>
                        <img src={item.images?.[0] || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=150&auto=format&fit=crop'} alt={item.title} className={styles.wishlistImg} />
                      </div>
                      <div className={styles.wishlistInfo}>
                        <h5 className={styles.wishlistTitle}>{item.title}</h5>
                        <div className={styles.wishlistMeta}>
                          <span className={styles.wishlistPrice}>₹{item.price}</span>
                          <span className={styles.wishlistAge}>&bull; {item.age || '1 semester'} old</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                  <Link href="/profile?tab=saved" className={styles.viewAllWishlist}>
                    View full saved list <ArrowRight size={12} />
                  </Link>
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
