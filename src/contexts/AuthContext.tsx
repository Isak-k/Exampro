import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/integrations/firebase/client";
import { getUserRole, getUserProfile, AppRole } from "@/lib/auth";
import { UserPermissions } from "@/types/permissions";

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  role?: AppRole;
  departmentId?: string;
  sectionPermissions?: any; // Add section permissions
  permissions?: UserPermissions | null;
}

interface AuthContextType {
  user: User | null;
  session: { user: User } | null;
  profile: Profile | null;
  role: AppRole | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

// Global flag to track if auth has been initialized across component remounts
let globalAuthInitialized = false;

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  role: null,
  loading: true,
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<{ user: User } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  // Initialize loading to false if we've already initialized once (prevents flickering on re-mounts)
  const [loading, setLoading] = useState(!globalAuthInitialized);
  const loadingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const refreshProfile = async () => {
    if (!user) return;
    
    const [userProfile, userRole] = await Promise.all([
      getUserProfile(user.uid),
      getUserRole(user.uid),
    ]);
    
    setProfile(userProfile);
    setRole(userRole);
  };

  useEffect(() => {
    // Set global flag to true immediately to prevent other instances from initializing loading state
    if (loading) {
      // Only set timeout if we are actually loading
      loadingTimeoutRef.current = setTimeout(() => {
        console.warn('Auth loading timeout - forcing loading to false');
        setLoading(false);
        globalAuthInitialized = true;
      }, 3000);
    }

    // Firebase auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log('Auth state changed:', currentUser ? currentUser.uid : 'No user');
      
      // Clear timeout
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      
      setUser(currentUser);
      setSession(currentUser ? { user: currentUser } : null);

      if (currentUser) {
        try {
          const [userProfile, userRole] = await Promise.all([
            getUserProfile(currentUser.uid),
            getUserRole(currentUser.uid),
          ]);
          
          console.log('Profile loaded:', userProfile);
          console.log('Role loaded:', userRole);
          setProfile(userProfile);
          setRole(userRole);
        } catch (error) {
          console.error('Error loading profile:', error);
          setProfile(null);
          setRole(null);
        }
      } else {
        setProfile(null);
        setRole(null);
      }
      
      setLoading(false);
      globalAuthInitialized = true;
    });

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      unsubscribe();
    };
  }, []); // Empty dependency array - only run once

  return (
    <AuthContext.Provider value={{ user, session, profile, role, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
