import { createContext, useContext, useEffect, useState } from 'react';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification
} from 'firebase/auth';
import { auth } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Registrierung
  async function signup(email, password) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    // Verifizierungs-E-Mail senden
    await sendEmailVerification(result.user);
    return result;
  }

  // Login
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Google Login
  async function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  }

  // Logout
  function logout() {
    return signOut(auth);
  }

  // Verifizierungs-E-Mail erneut senden
  function resendVerificationEmail() {
    if (currentUser && !currentUser.emailVerified) {
      return sendEmailVerification(currentUser);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    loginWithGoogle,
    logout,
    resendVerificationEmail
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

async function signup(email, password) {
  console.log('🔵 Signup gestartet für:', email);
  
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    console.log('✅ User erstellt:', result.user.uid);
    console.log('📧 User Email:', result.user.email);
    console.log('🔍 Email verifiziert?', result.user.emailVerified);
    
    console.log('📤 Sende Verifizierungs-E-Mail...');
    await sendEmailVerification(result.user);
    console.log('✅ Verifizierungs-E-Mail wurde gesendet!');
    
    return result;
  } catch (error) {
    console.error('❌ Fehler beim Signup:', error);
    console.error('❌ Error Code:', error.code);
    console.error('❌ Error Message:', error.message);
    throw error;
  }
}