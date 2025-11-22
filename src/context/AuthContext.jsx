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

  // Registrierung MIT DEBUG-LOGS
  async function signup(email, password) {
    console.log('🔵🔵🔵 SIGNUP GESTARTET FÜR:', email);
    
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      console.log('✅✅✅ USER ERSTELLT:', result.user.uid);
      console.log('📧 EMAIL:', result.user.email);
      console.log('🔍 VERIFIZIERT?', result.user.emailVerified);
      
      console.log('📤📤📤 SENDE VERIFIZIERUNGS-EMAIL...');
      await sendEmailVerification(result.user);
      console.log('✅✅✅ EMAIL WURDE GESENDET!');
      
      return result;
    } catch (error) {
      console.error('❌❌❌ FEHLER BEIM SIGNUP:', error);
      console.error('❌ ERROR CODE:', error.code);
      console.error('❌ ERROR MESSAGE:', error.message);
      throw error;
    }
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