# 📱 iOS App Store Resubmission Guide

## ✅ Was wurde gefixt?

### 1. Account Deletion Feature (Guideline 5.1.1v) ✅
- **AccountSettings.jsx** erstellt - Vollständige Kontolöschungsfunktion
- **AccountDeleted.jsx** erstellt - Bestätigungsseite nach Löschung
- **Route hinzugefügt**: `/account-settings` und `/account-deleted`
- **Dashboard Link**: "Konto-Einstellungen" Button im Profile Tab

**Was passiert bei Account-Löschung:**
1. User geht zu Dashboard → Profile → Konto-Einstellungen
2. Klickt "Konto löschen"
3. Muss "DELETE" tippen zur Bestätigung
4. System löscht: Alle Policies, Items, Settings, Budgets, Financial Snapshots
5. Supabase Auth Account wird gelöscht
6. Redirect zu Account Deleted Bestätigungsseite
7. User ist ausgeloggt

### 2. Google OAuth entfernt (Guideline 4.8 & 4.0) ✅
- **Login.jsx** updated - Kein Google OAuth mehr
- **Nur Email/Password** Login verfügbar
- Kein Browser-Redirect mehr
- In-App Login nur

### 3. Version erhöht ✅
- **package.json**: 1.0.1
- **Nächster Schritt**: Xcode Version/Build erhöhen

---

## 🚀 Deployment Steps

### Schritt 1: Build erstellen

```bash
cd "c:\Users\Servan Koyuncu\Documents\InsuBuddyV3\InsubuddyV2-main2"

# Production Build erstellen
npm run build

# Zu iOS syncen
npx cap sync ios
```

### Schritt 2: Xcode öffnen

```bash
npx cap open ios
```

### Schritt 3: Version in Xcode erhöhen

1. Öffne Xcode
2. Klicke auf das **InsuBuddy** Projekt (blau) in der linken Sidebar
3. Unter **General** Tab:
   - **Version**: `1.0.1` (oder höher wenn schon 1.0.1 existiert)
   - **Build**: `2` (erhöhe um 1)

### Schritt 4: Archive erstellen

1. In Xcode: **Product → Archive**
2. Warte bis Build fertig ist (~3-5 Min)
3. Organizer öffnet sich automatisch

### Schritt 5: Upload zu App Store Connect

1. Im Organizer: **Distribute App**
2. Wähle **App Store Connect**
3. Wähle **Upload**
4. Folge dem Wizard (Standard-Optionen)
5. Warte bis Upload fertig (~5-10 Min)

---

## 📝 App Store Connect Updates

### Schritt 6: Privacy Labels korrigieren

1. Gehe zu [App Store Connect](https://appstoreconnect.apple.com)
2. Wähle **InsuBuddy**
3. Gehe zu **App Privacy**
4. Korrigiere folgende Labels:

**Data Collected:**

#### Contact Information
- ✅ **Email Address**
  - Purpose: **App Functionality**
  - Linked to User: **Yes**
  - Used for Tracking: **NO** ⚠️

#### Financial Info
- ✅ **Purchase History** (Insurance Policies)
  - Purpose: **App Functionality**
  - Linked to User: **Yes**
  - Used for Tracking: **NO** ⚠️

#### Other Data
- ✅ **Other User Content** (Policy Documents, Photos)
  - Purpose: **App Functionality**
  - Linked to User: **Yes**
  - Used for Tracking: **NO** ⚠️

**WICHTIG:** Bei allen Punkten "Used for Tracking" = **NO**!

### Schritt 7: Review Notes hinzufügen

1. Gehe zu **App Review Information**
2. Füge folgende **Notes** hinzu:

```
iOS App Store Review Notes - January 2026

ACCOUNT DELETION FEATURE (Guideline 5.1.1v):
- Users can delete their account via: Dashboard → Profile Tab → "Konto-Einstellungen" button
- Delete button prominently displayed with clear warnings
- User must type "DELETE" to confirm
- All user data is permanently deleted (policies, items, financial data, settings, and auth account)
- After deletion, user is logged out and redirected to confirmation page

LOGIN METHODS (Guideline 4.8 & 4.0):
- Google OAuth has been completely removed
- App now uses Email/Password authentication only
- No browser redirects - all authentication happens in-app
- Users can register via standard email/password flow

PRIVACY (Guideline 5.1.2):
- App does NOT track users
- All data collection is for app functionality only
- Data is linked to user identity for account features
- Privacy labels have been corrected (no tracking purposes)

TEST ACCOUNT:
Email: test@insubuddy.com
Password: TestUser2026!

Feel free to create a new account during testing - account deletion feature is fully functional.
```

### Schritt 8: Neue Version einreichen

1. Warte bis Build in **App Store Connect** erscheint (kann 10-30 Min dauern)
2. Gehe zu **InsuBuddy → iOS App → +**
3. Wähle den neuen Build (Version 1.0.1 Build 2)
4. Überprüfe alle Infos
5. Klicke **Submit for Review**

---

## 🧪 Testing Checklist (vor Submit)

Teste auf einem **echten iPhone** (nicht Simulator):

- [ ] App startet ohne Crash
- [ ] Login mit Email/Password funktioniert
- [ ] Kein Google OAuth Button sichtbar
- [ ] Account erstellen funktioniert
- [ ] Dashboard lädt korrekt
- [ ] Policies hinzufügen funktioniert
- [ ] **Profile Tab → "Konto-Einstellungen" Button sichtbar**
- [ ] **Konto-Einstellungen Seite öffnet**
- [ ] **"Konto löschen" funktioniert komplett**
- [ ] **Nach Löschung: User ausgeloggt, Bestätigungsseite angezeigt**
- [ ] App läuft stabil ohne Abstürze

---

## 📧 Support URLs (für App Store)

Falls noch nicht vorhanden, diese URLs in App Store Connect hinzufügen:

- **Privacy Policy URL**: https://insubuddy.com/privacy
- **Terms of Service URL**: https://insubuddy.com/terms
- **Support URL**: https://insubuddy.com/support
- **Marketing URL**: https://insubuddy.com

*Falls diese Seiten noch nicht existieren, erstelle einfache statische Seiten mit:*
- Datenschutzerklärung (DSGVO-konform)
- Nutzungsbedingungen
- Support-Kontakt (Email: support@insubuddy.com)

---

## ⏱️ Erwartete Timeline

- **Build & Upload**: 30-60 Min
- **Processing in App Store Connect**: 10-30 Min
- **Submit for Review**: 5 Min
- **Apple Review**: 2-5 Tage (meist 2-3 Tage)

---

## ✅ Zusammenfassung der Fixes

| Rejection Grund | Fix | Status |
|-----------------|-----|--------|
| **5.1.1(v) - Account Deletion fehlt** | AccountSettings.jsx + AccountDeleted.jsx erstellt, Route hinzugefügt, Dashboard Link hinzugefügt | ✅ FIXED |
| **4.8 - Google OAuth ohne Alternative** | Google OAuth komplett entfernt, nur Email/Password Login | ✅ FIXED |
| **4.0 - Browser Redirect** | Google OAuth entfernt, kein Browser-Redirect mehr | ✅ FIXED |
| **5.1.2 - Privacy Labels falsch** | Privacy Labels in App Store Connect korrigieren (siehe Schritt 6) | ⏳ TODO |

---

## 🆘 Troubleshooting

### Problem: Build schlägt fehl in Xcode
**Lösung:**
```bash
# Clean build
rm -rf ios/App/build
npx cap sync ios
```

### Problem: Account Deletion funktioniert nicht
**Lösung:** Überprüfe Supabase RLS Policies - CASCADE DELETE muss aktiviert sein

### Problem: "Missing compliance" bei Upload
**Lösung:** Wähle "No" bei Export Compliance (App hat keine Verschlüsselung außer standard HTTPS)

---

## 📞 Next Steps nach Approval

1. ✅ App ist live im App Store
2. Monitor Crash Reports in Xcode Organizer
3. Monitor User Feedback
4. Plan nächstes Update mit neuen Features

---

**Viel Erfolg! 🚀**

Die App ist jetzt Apple-compliant und sollte approved werden.
