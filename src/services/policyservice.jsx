import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  where,
  updateDoc 
} from 'firebase/firestore';

// Datei zu Base64 konvertieren
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

// Police hinzufügen
export const addPolicy = async (userId, policyData, file = null) => {
  try {
    let fileData = null;
    
    if (file) {
      const base64 = await fileToBase64(file);
      fileData = {
        name: file.name,
        type: file.type,
        size: file.size,
        data: base64
      };
    }

    const policy = {
      ...policyData,
      userId,
      file: fileData,
      createdAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, 'policies'), policy);
    return { id: docRef.id, ...policy };
  } catch (error) {
    console.error('Fehler beim Hinzufügen der Police:', error);
    throw error;
  }
};

// Alle Policen eines Users abrufen
export const getUserPolicies = async (userId) => {
  try {
    const q = query(collection(db, 'policies'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const policies = [];
    querySnapshot.forEach((doc) => {
      policies.push({ id: doc.id, ...doc.data() });
    });
    
    return policies;
  } catch (error) {
    console.error('Fehler beim Abrufen der Policen:', error);
    throw error;
  }
};

// Police löschen
export const deletePolicy = async (policyId) => {
  try {
    await deleteDoc(doc(db, 'policies', policyId));
  } catch (error) {
    console.error('Fehler beim Löschen der Police:', error);
    throw error;
  }
};

// Police aktualisieren
export const updatePolicy = async (policyId, updates) => {
  try {
    const policyRef = doc(db, 'policies', policyId);
    await updateDoc(policyRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Police:', error);
    throw error;
  }
};