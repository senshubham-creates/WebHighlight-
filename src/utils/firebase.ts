import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  getDocFromServer,
  writeBatch,
} from 'firebase/firestore';
import { Bookmark, Highlight } from '../types.ts';
import firebaseConfigData from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfigData) : getApps()[0];

// Specify firestoreDatabaseId if configured in the project
export const db = firebaseConfigData.firestoreDatabaseId
  ? getFirestore(app, firebaseConfigData.firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map(provider => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot per Firebase skill guidelines
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or network reconnecting.');
    }
  }
}
testConnection();

export function onAuthUserChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function loginWithEmail(email: string, pass: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email.trim(), pass);
  return credential.user;
}

export async function registerWithEmail(email: string, pass: string, name?: string): Promise<User> {
  const credential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  if (name?.trim() && credential.user) {
    try {
      await updateProfile(credential.user, { displayName: name.trim() });
    } catch (e) {
      console.warn('Could not update display name', e);
    }
  }
  return credential.user;
}

export async function loginWithGoogle(): Promise<User> {
  const credential = await signInWithPopup(auth, googleProvider);
  return credential.user;
}

export function logoutUser(): Promise<void> {
  saveStoredLocalUser(null);
  return signOut(auth);
}

const LOCAL_USER_STORAGE_KEY = 'markwise_current_profile_v1';

export function getStoredLocalUser(): { uid: string; email: string | null; displayName: string | null } | null {
  try {
    const raw = localStorage.getItem(LOCAL_USER_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load local user profile', e);
  }
  return null;
}

export function saveStoredLocalUser(user: { uid: string; email: string | null; displayName: string | null } | null) {
  try {
    if (user) {
      localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(LOCAL_USER_STORAGE_KEY);
    }
  } catch (e) {
    console.warn('Failed to save local user profile', e);
  }
}

// Cloud Synchronization: Save user bookmarks and highlights to Firestore
export async function syncUserDataToFirestore(
  userId: string,
  bookmarks: Bookmark[],
  highlights: Highlight[]
): Promise<void> {
  const userPath = `users/${userId}`;
  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(
      userDocRef,
      {
        lastSyncedAt: new Date().toISOString(),
        email: auth.currentUser?.email || '',
        displayName: auth.currentUser?.displayName || '',
      },
      { merge: true }
    );

    // Batch or iterate write bookmarks
    for (const bm of bookmarks) {
      await setDoc(doc(db, 'users', userId, 'bookmarks', bm.id), bm, { merge: true });
    }

    // Write highlights
    for (const hl of highlights) {
      await setDoc(doc(db, 'users', userId, 'highlights', hl.id), hl, { merge: true });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, userPath);
  }
}

// Save single bookmark
export async function saveBookmarkToFirestore(userId: string, bookmark: Bookmark): Promise<void> {
  const path = `users/${userId}/bookmarks/${bookmark.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'bookmarks', bookmark.id), bookmark, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Delete single bookmark and its highlights
export async function deleteBookmarkFromFirestore(userId: string, bookmarkId: string, highlightIds: string[]): Promise<void> {
  const path = `users/${userId}/bookmarks/${bookmarkId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'bookmarks', bookmarkId));
    for (const hid of highlightIds) {
      await deleteDoc(doc(db, 'users', userId, 'highlights', hid));
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// Save single highlight
export async function saveHighlightToFirestore(userId: string, highlight: Highlight): Promise<void> {
  const path = `users/${userId}/highlights/${highlight.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'highlights', highlight.id), highlight, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Delete single highlight
export async function deleteHighlightFromFirestore(userId: string, highlightId: string): Promise<void> {
  const path = `users/${userId}/highlights/${highlightId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'highlights', highlightId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// Fetch user data from Firestore on sign-in
export async function fetchUserDataFromFirestore(
  userId: string
): Promise<{ bookmarks: Bookmark[]; highlights: Highlight[] }> {
  const path = `users/${userId}`;
  try {
    const bmsSnap = await getDocs(collection(db, 'users', userId, 'bookmarks'));
    const loadedBookmarks: Bookmark[] = [];
    bmsSnap.forEach(d => {
      loadedBookmarks.push(d.data() as Bookmark);
    });

    const hlsSnap = await getDocs(collection(db, 'users', userId, 'highlights'));
    const loadedHighlights: Highlight[] = [];
    hlsSnap.forEach(d => {
      loadedHighlights.push(d.data() as Highlight);
    });

    return {
      bookmarks: loadedBookmarks,
      highlights: loadedHighlights,
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return { bookmarks: [], highlights: [] };
  }
}
