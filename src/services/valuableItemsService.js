import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  where 
} from 'firebase/firestore';

// Bild zu Base64 konvertieren
const imageToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

// Wertgegenstand hinzufügen
export const addValuableItem = async (userId, itemData, imageFile) => {
  try {
    if (!imageFile) {
      throw new Error('Bild ist erforderlich');
    }

    const base64Image = await imageToBase64(imageFile);
    
    const item = {
      ...itemData,
      userId,
      image: {
        name: imageFile.name,
        type: imageFile.type,
        size: imageFile.size,
        data: base64Image
      },
      createdAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, 'valuableItems'), item);
    return { id: docRef.id, ...item };
  } catch (error) {
    console.error('Fehler beim Hinzufügen des Wertgegenstands:', error);
    throw error;
  }
};

// Alle Wertgegenstände eines Users abrufen
export const getUserValuableItems = async (userId) => {
  try {
    const q = query(collection(db, 'valuableItems'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const items = [];
    querySnapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() });
    });
    
    return items;
  } catch (error) {
    console.error('Fehler beim Abrufen der Wertgegenstände:', error);
    throw error;
  }
};

// Wertgegenstand löschen
export const deleteValuableItem = async (itemId) => {
  try {
    await deleteDoc(doc(db, 'valuableItems', itemId));
  } catch (error) {
    console.error('Fehler beim Löschen des Wertgegenstands:', error);
    throw error;
  }
};

// Gesamtwert berechnen
export const calculateTotalValue = (items) => {
  return items.reduce((total, item) => {
    const value = parseFloat(item.value) || 0;
    return total + value;
  }, 0);
};