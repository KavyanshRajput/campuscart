"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut 
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const allowedDomain = '@acropolis.in';

  useEffect(() => {
    // Localhost mock bypass for local development/testing
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      const mockUser = {
        uid: 'mock_student_123',
        email: 'testuser@acropolis.in',
        displayName: 'KAVYANSH RAJPUT',
        photoURL: null
      };
      setUser(mockUser);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (user.email.endsWith(allowedDomain)) {
          setUser(user);
          setError(null);
        } else {
          // Force sign out if domain doesn't match
          signOut(auth);
          setUser(null);
          setError(`Access restricted to ${allowedDomain} emails only.`);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      hd: 'acropolis.in' // Suggest the domain in Google login
    });
    
    try {
      setError(null);
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Login Error:", err);
      setError("Failed to sign in. Please try again.");
    }
  };

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, loading, error, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
