"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { User, UserCircle, Package, Clock, ExternalLink, Trash2, Edit, ShoppingBag, Heart, Settings } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './profile.module.css';

export default function ProfilePage() {
  const { user, loading, loginWithGoogle } = useAuth();
  const [activeTab, setActiveTab] = useState('listings');
  const [userListings, setUserListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(true);

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
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) return <div className={styles.loading}>Accessing your profile...</div>;

  if (!user) {
    return (
      <div className={`${styles.page} container`}>
        <div className={styles.loginRequired}>
          <UserCircle size={64} color="var(--primary)" />
          <h1>Profile Access <span className="gradient-text">Restricted</span></h1>
          <p>Please sign in with your student account to view your dashboard.</p>
          <button onClick={loginWithGoogle} className={styles.loginBtn}>Login with Google</button>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'listings':
        return (
          <div className={styles.listingsList}>
            {listingsLoading ? (
              <p>Fetching your listings...</p>
            ) : userListings.length > 0 ? (
              userListings.map(item => (
                <div key={item.id} className={styles.listingItem}>
                  <div className={styles.itemImage}>
                    <Image src={item.images?.[0] || 'https://via.placeholder.com/150'} alt={item.title} fill className={styles.img} />
                  </div>
                  <div className={styles.itemDetails}>
                    <div className={styles.itemMeta}>₹{item.price}</div>
                    <h3>{item.title}</h3>
                    <div className={styles.itemDate}>
                      Listed on {item.createdAt?.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <div className={styles.itemActions}>
                    <Link href={`/listing?id=${item.id}`} className={styles.actionBtn}><ExternalLink size={18} /></Link>
                    <button className={styles.actionBtn}><Edit size={18} /></button>
                    <button className={`${styles.actionBtn} ${styles.deleteBtn}`}><Trash2 size={18} /></button>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyListings}>
                <ShoppingBag size={48} color="var(--text-light)" />
                <h3>No items listed yet</h3>
                <p>Ready to declutter? Your first listing is just a few clicks away.</p>
                <Link href="/sell" className={styles.sellBtn}>List an Item</Link>
              </div>
            )}
          </div>
        );
      case 'saved':
        return (
          <div className={styles.emptyListings}>
            <Heart size={48} color="var(--primary)" />
            <h3>Your Wishlist is Empty</h3>
            <p>Save items you're interested in to keep track of them here.</p>
            <Link href="/explore" className={styles.sellBtn}>Browse Items</Link>
          </div>
        );
      case 'settings':
        return (
          <div className={styles.emptyListings}>
            <Settings size={48} color="var(--text-light)" />
            <h3>Account Settings</h3>
            <p>Profile customization and notification preferences are coming soon.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`${styles.page} container`}>
      <header className={styles.profileHeader}>
        <div className={styles.profileInfo}>
          <div className={styles.avatarLarge}>
            <Image src={user.photoURL} alt={user.displayName} width={110} height={110} className={styles.avatarImg} />
          </div>
          <div className={styles.userText}>
            <h1>{user.displayName}</h1>
            <p>{user.email}</p>
            <div className={styles.stats}>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{userListings.length}</span>
                <span className={styles.statLabel}>Listings</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>0</span>
                <span className={styles.statLabel}>Sold</span>
              </div>
            </div>
          </div>
        </div>
        <button className={styles.editProfileBtn}>Account Details</button>
      </header>

      <nav className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'listings' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('listings')}
        >
          My Listings
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'saved' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('saved')}
        >
          Saved Items
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'settings' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </nav>

      <div className={styles.tabContent}>
        {renderTabContent()}
      </div>
    </div>
  );
}
