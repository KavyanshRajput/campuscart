"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  MapPin, 
  Clock, 
  Tag, 
  Share2, 
  Heart, 
  User, 
  Mail, 
  MessageCircle,
  ShieldCheck,
  Zap,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './listing.module.css';

export default function ListingClient({ id }) {
  const router = useRouter();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    async function fetchListing() {
      if (!id || id === 'view') {
        setLoading(false);
        return;
      }
      try {
        const docRef = doc(db, "listings", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const itemData = { id: docSnap.id, ...docSnap.data() };
          setListing(itemData);
          
          // Check favorite status
          const favs = JSON.parse(localStorage.getItem('savedItems') || '[]');
          setIsFavorite(favs.includes(itemData.id));
        }
      } catch (error) {
        console.error("Error fetching listing:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchListing();

    // Listen to changes from other parts of the app
    const handleFavSync = () => {
      const favs = JSON.parse(localStorage.getItem('savedItems') || '[]');
      if (id) setIsFavorite(favs.includes(id));
    };

    window.addEventListener('favoritesChanged', handleFavSync);
    return () => window.removeEventListener('favoritesChanged', handleFavSync);
  }, [id]);

  const toggleFavorite = () => {
    if (!listing) return;
    const favs = JSON.parse(localStorage.getItem('savedItems') || '[]');
    let updated;
    if (favs.includes(listing.id)) {
      updated = favs.filter(x => x !== listing.id);
      setIsFavorite(false);
    } else {
      updated = [...favs, listing.id];
      setIsFavorite(true);
    }
    localStorage.setItem('savedItems', JSON.stringify(updated));
    window.dispatchEvent(new Event('favoritesChanged'));
  };

  const startChat = () => {
    if (!listing) return;
    router.push(`/profile?tab=chat&startChat=${listing.sellerId}&itemName=${encodeURIComponent(listing.title)}`);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}></div>
        <p>Retrieving campus deal...</p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className={styles.notFound}>
        <div className={styles.notFoundIcon}>
          <Tag size={48} />
        </div>
        <h2>Oops! Listing not found.</h2>
        <p>This item might have been sold or removed by the seller.</p>
        <Link href="/explore" className={styles.backBtn}>
          <ArrowRight size={20} />
          <span>Back to Marketplace</span>
        </Link>
      </div>
    );
  }

  const isSold = listing.status === 'sold';

  return (
    <div className={`${styles.page} container animate-fade-up`}>
      <nav className={styles.breadcrumb}>
        <Link href="/explore" className={styles.backLink}>
          <ChevronLeft size={20} />
          <span>Back to Explore</span>
        </Link>
      </nav>

      <div className={styles.layout}>
        {/* Left Column: Images */}
        <div className={styles.gallerySection}>
          <div className={styles.mainImageWrapper}>
            <Image 
              src={listing.images?.[0] || 'https://via.placeholder.com/800x800?text=CampusCart'} 
              alt={listing.title}
              fill
              className={styles.mainImage}
              priority
            />
            <button 
              className={`${styles.favoriteBtn} ${isFavorite ? styles.isFavorite : ''}`}
              onClick={toggleFavorite}
              title={isFavorite ? "Remove from Saved" : "Save Item"}
            >
              <Heart size={22} fill={isFavorite ? "currentColor" : "none"} />
            </button>
          </div>
          
          {listing.images?.length > 1 && (
            <div className={styles.thumbnails}>
              {listing.images.map((img, idx) => (
                <button 
                  key={idx} 
                  className={`${styles.thumbnail} ${activeImage === idx ? styles.activeThumbnail : ''}`}
                  onClick={() => setActiveImage(idx)}
                >
                  <Image src={img} alt={`Thumbnail ${idx}`} fill className={styles.thumbImg} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Info */}
        <div className={styles.infoSection}>
          <div className={styles.header}>
            <div className={styles.categoryBadge}>{listing.category}</div>
            <h1 className={styles.title}>{listing.title}</h1>
            <div className={styles.priceSection}>
              <span className={styles.price}>₹{listing.price}</span>
              {listing.age && (
                <span className={styles.ageTag}>
                  <Clock size={14} />
                  Used for {listing.age}
                </span>
              )}
            </div>
          </div>

          {/* Sold Alert Banner */}
          {isSold && (
            <div className={styles.soldAlert}>
              <AlertTriangle size={20} />
              <div>
                <strong>This listing has been sold</strong>
                <p>The seller has completed this transaction. Feel free to browse similar items.</p>
              </div>
            </div>
          )}

          <div className={styles.descriptionCard}>
            <h3>Description</h3>
            <p>{listing.description}</p>
          </div>

          <div className={styles.sellerCard}>
            <div className={styles.sellerHeader}>
              <div className={styles.sellerAvatar}>
                {listing.sellerPhoto ? (
                  <Image src={listing.sellerPhoto} alt={listing.sellerName} fill />
                ) : (
                  <User size={24} />
                )}
              </div>
              <div className={styles.sellerInfo}>
                <span className={styles.sellerLabel}>Sold by</span>
                <span className={styles.sellerName}>{listing.sellerName || 'Verified Student'}</span>
              </div>
              <div className={styles.verifiedBadge}>
                <ShieldCheck size={16} />
                <span>Verified</span>
              </div>
            </div>

            <div className={styles.actions}>
              <a 
                href={isSold ? null : `mailto:${listing.sellerEmail}`} 
                className={`${styles.primaryAction} ${isSold ? styles.actionDisabled : ''}`}
                onClick={(e) => isSold && e.preventDefault()}
              >
                <Mail size={18} />
                <span>Email Seller</span>
              </a>
              <button 
                onClick={startChat} 
                disabled={isSold}
                className={`${styles.secondaryAction} ${isSold ? styles.actionDisabled : ''}`}
              >
                <MessageCircle size={18} />
                <span>Chat Now</span>
              </button>
            </div>
            
            <p className={styles.safetyNotice}>
              <Zap size={14} />
              Remember to meet in a safe, public location on campus (e.g. Canteen, Block Foyer).
            </p>
          </div>

          <div className={styles.metaInfo}>
            <div className={styles.metaItem}>
              <MapPin size={18} />
              <span>Available at Main Campus</span>
            </div>
            <div className={styles.metaItem}>
              <Share2 size={18} />
              <span>Share Listing</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
