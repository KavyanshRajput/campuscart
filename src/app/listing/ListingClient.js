"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
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
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './listing.module.css';

export default function ListingClient({ id }) {
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
          setListing({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.error("Error fetching listing:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchListing();
  }, [id]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}></div>
        <p>Loading the best deals for you...</p>
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

  return (
    <div className={`${styles.page} container animate-fade`}>
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
              onClick={() => setIsFavorite(!isFavorite)}
            >
              <Heart size={24} fill={isFavorite ? "currentColor" : "none"} />
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
              <a href={`mailto:${listing.sellerEmail}`} className={styles.primaryAction}>
                <Mail size={20} />
                <span>Email Seller</span>
              </a>
              <button className={styles.secondaryAction}>
                <MessageCircle size={20} />
                <span>Chat Now</span>
              </button>
            </div>
            <p className={styles.safetyNotice}>
              <Zap size={14} />
              Remember to meet in a safe, public location on campus.
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
