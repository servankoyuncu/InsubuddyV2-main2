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

// Bild zu Base64 konvertieren und komprimieren
const imageToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Canvas erstellen für Kompression
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Max Breite/Höhe auf 1200px begrenzen
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        
        let width = img.width;
        let height = img.height;
        
        // Größe anpassen wenn zu groß
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Bild auf Canvas zeichnen
        ctx.drawImage(img, 0, 0, width, height);
        
        // Als komprimiertes JPEG zurückgeben (0.7 = 70% Qualität)
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        resolve(compressedBase64);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
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