import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/integrations/firebase/client';

export type AppRole = 'admin' | 'student';

export interface UserProfile {
  userId: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: AppRole;
  departmentId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export async function signUp(
  email: string,
  password: string,
  fullName: string,
  role: AppRole,
  departmentId?: string
) {
  try {
    console.log('Firebase signUp called with:', { email, fullName, role, departmentId });
    
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('User created in Firebase Auth:', user.uid);

    // Create user profile in Firestore
    const userProfile: UserProfile = {
      userId: user.uid,
      email: user.email!,
      fullName,
      avatarUrl: null,
      role,
      departmentId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    await setDoc(doc(db, 'users', user.uid), userProfile);
    console.log('User profile created in Firestore');

    return { user: userCredential.user };
  } catch (error: any) {
    console.error('Firebase signUp error:', error);
    throw error;
  }
}

export async function signIn(email: string, password: string) {
  try {
    console.log('Firebase signIn called with:', { email });
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('User signed in:', userCredential.user.uid);
    return { user: userCredential.user };
  } catch (error: any) {
    console.error('Firebase signIn error:', error);
    throw error;
  }
}

export async function signOut() {
  await firebaseSignOut(auth);
}

export async function getCurrentUser() {
  return auth.currentUser;
}

export async function getUserRole(userId: string): Promise<AppRole | null> {
  const profile = await getUserProfile(userId);
  return profile?.role || null;
}

export async function getUserProfile(userId: string) {
  try {
    console.log('Getting user profile for:', userId);
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('Profile found:', data);
      console.log('sectionPermissions from Firestore:', data.sectionPermissions);
      
      // Check if user is disabled
      if (data.disabled === true) {
        console.warn('User account is disabled:', userId);
        // Sign out disabled user
        await firebaseSignOut(auth);
        throw new Error('Your account has been disabled. Please contact an administrator.');
      }
      
      const profile = {
        id: data.userId,
        user_id: data.userId,
        full_name: data.fullName,
        email: data.email,
        avatar_url: data.avatarUrl,
        role: data.role as AppRole,
        departmentId: data.departmentId,
        sectionPermissions: data.sectionPermissions,
        permissions: data.permissions || null,
      };
      
      console.log('Returning profile with sectionPermissions:', profile.sectionPermissions);
      return profile;
    }
    
    console.warn('Profile not found for user:', userId);
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<Omit<UserProfile, 'userId' | 'createdAt'>>
) {
  const docRef = doc(db, 'users', userId);
  await setDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now()
  }, { merge: true });
}

export async function resetPassword(email: string) {
  await sendPasswordResetEmail(auth, email);
}
