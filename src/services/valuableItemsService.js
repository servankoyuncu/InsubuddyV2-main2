import { supabase } from '../supabase';

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

    const { data, error } = await supabase
      .from('valuable_items')
      .insert([{
        user_id: userId,
        name: itemData.name,
        category: itemData.category,
        value: itemData.value,
        description: itemData.description,
        purchase_date: itemData.purchaseDate || null,
        image_name: imageFile.name,
        image_type: imageFile.type,
        image_size: imageFile.size,
        image_data: base64Image
      }])
      .select()
      .single();

    if (error) throw error;

    // Return in camelCase format for compatibility
    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      category: data.category,
      value: data.value,
      description: data.description,
      purchaseDate: data.purchase_date,
      image: {
        name: data.image_name,
        type: data.image_type,
        size: data.image_size,
        data: data.image_data
      },
      createdAt: data.created_at
    };
  } catch (error) {
    console.error('Fehler beim Hinzufügen des Wertgegenstands:', error);
    throw error;
  }
};

// Alle Wertgegenstände eines Users abrufen
export const getUserValuableItems = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('valuable_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform to camelCase for compatibility
    return (data || []).map(item => ({
      id: item.id,
      userId: item.user_id,
      name: item.name,
      category: item.category,
      value: item.value,
      description: item.description,
      purchaseDate: item.purchase_date,
      image: {
        name: item.image_name,
        type: item.image_type,
        size: item.image_size,
        data: item.image_data
      },
      createdAt: item.created_at
    }));
  } catch (error) {
    console.error('Fehler beim Abrufen der Wertgegenstände:', error);
    return [];
  }
};

// Wertgegenstand löschen
export const deleteValuableItem = async (itemId) => {
  try {
    const { error } = await supabase
      .from('valuable_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;
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
