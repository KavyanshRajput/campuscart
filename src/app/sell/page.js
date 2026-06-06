"use client";

import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { UploadCloud, ShoppingBag, Tag, Info, AlertCircle, CheckCircle, Sparkles, IndianRupee } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import styles from './sell.module.css';

const CATEGORIES = [
  { id: 'books', name: 'Books', image: '/assets/books.png' },
  { id: 'electronics', name: 'Electronics', image: '/assets/electronics.png' },
  { id: 'fashion', name: 'Fashion', image: '/assets/fashion.png' },
  { id: 'home', name: 'Home', image: '/assets/home.png' },
  { id: 'sports', name: 'Sports', image: '/assets/sports.png' },
  { id: 'other', name: 'Other', image: 'https://images.unsplash.com/photo-1516533075015-a3838414c3ca?q=80&w=1000&auto=format&fit=crop' }
];

export default function SellPage() {
  const { user, loading, loginWithGoogle } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'books',
    age: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    // Auto-select a premium image based on category
    const selectedCategory = CATEGORIES.find(c => c.id === formData.category) || CATEGORIES[0];
    const images = [selectedCategory.image];
    
    try {
      const userDept = typeof window !== 'undefined' ? localStorage.getItem('userDept') || 'CSE' : 'CSE';
      await addDoc(collection(db, "listings"), {
        ...formData,
        price: Number(formData.price),
        images,
        sellerId: user.uid,
        sellerName: user.displayName,
        sellerEmail: user.email,
        sellerPhoto: user.photoURL,
        sellerDept: userDept,
        createdAt: serverTimestamp(),
        status: 'active'
      });
      
      setSuccess(true);
      setTimeout(() => router.push('/'), 2000);
    } catch (err) {
      console.error("Error adding listing: ", err);
      setError('Failed to create listing. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className={styles.loading}>Loading your workspace...</div>;

  if (!user) {
    return (
      <div className={`${styles.page} container`}>
        <div className={styles.formCard} style={{ textAlign: 'center' }}>
          <UploadCloud size={48} style={{ color: 'var(--primary)', marginBottom: '24px' }} />
          <h1 style={{ fontSize: '2rem' }}>Join the <span className="gradient-text">Community</span></h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Sign in with your campus email to start listing items.</p>
          <button onClick={loginWithGoogle} className={styles.submitBtn} style={{ marginTop: '32px' }}>
            Login with Google
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className={`${styles.page} container`}>
        <div className={styles.formCard} style={{ textAlign: 'center' }}>
          <CheckCircle size={64} color="var(--accent)" style={{ marginBottom: '24px' }} />
          <h1 style={{ fontSize: '2rem' }}>Listing <span className="gradient-text">Confirmed!</span></h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Your item is now visible to everyone on campus.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.page} container`}>
      <header className={styles.header}>
        <h1>List an <span className="gradient-text">Item</span></h1>
        <p>Your unused items could be exactly what someone else needs.</p>
      </header>

      <form onSubmit={handleSubmit} className={styles.formCard}>
        <div className={styles.formGroup}>
          <label>Item Name</label>
          <div className={styles.inputWrapper}>
            <ShoppingBag className={styles.inputIcon} size={20} />
            <input 
              type="text" 
              placeholder="e.g. Scientific Calculator FX-991EX"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
            />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.formGroup}>
            <label>Price (₹)</label>
            <div className={styles.inputWrapper}>
              <IndianRupee className={styles.inputIcon} size={20} />
              <input 
                type="number" 
                placeholder="0"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                required
              />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Category</label>
            <div className={styles.inputWrapper}>
              <Tag className={styles.inputIcon} size={20} />
              <select 
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                required
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>Condition / Age</label>
          <div className={styles.inputWrapper}>
            <Info className={styles.inputIcon} size={20} />
            <input 
              type="text" 
              placeholder="e.g. 1 semester old, Like new"
              value={formData.age}
              onChange={(e) => setFormData({...formData, age: e.target.value})}
              required
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>Description</label>
          <textarea 
            placeholder="Tell us more about the item (specs, condition, reasons for selling)..."
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            required
            rows={4}
          />
        </div>

        <div className={styles.imageNote}>
          <Sparkles size={24} style={{ color: 'var(--primary)', marginBottom: '8px' }} />
          <h3>Smart Image Enabled</h3>
          <p>We&apos;ll automatically assign a high-quality, accurate photo based on your chosen category to make your listing stand out.</p>
        </div>

        {error && <div style={{ color: '#ef4444', marginBottom: '20px', textAlign: 'center', fontSize: '0.9rem', fontWeight: '500' }}>{error}</div>}

        <button type="submit" disabled={isSubmitting} className={styles.submitBtn}>
          {isSubmitting ? 'Posting...' : 'Post Listing Now'}
        </button>
      </form>
    </div>
  );
}

