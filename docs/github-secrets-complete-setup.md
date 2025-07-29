# ?¤ì œ ?¤ì •ê°??•ì¸ ë°??¤ì • ê°€?´ë“œ

## ?š¨ **?¤ì œ ?¤ì •ê°’ë“¤???•ì¸?˜ê³  ?¤ì •?˜ëŠ” ë°©ë²•**

?´ì „ ?‘ì—…?¤ì—??ë¯¸ì„¤?•ë˜?ˆê±°???˜ëª»???¤ì •?¤ì„ ?¤ì œ ê°’ê³¼ ?¨ê»˜ ?•ì¸?˜ê³  ?¤ì •?˜ëŠ” ë°©ë²•???ˆë‚´?©ë‹ˆ??

---

## **1?¨ê³„: ?„ì¬ ë¯¸ì„¤?•ëœ ë¶€ë¶??•ì¸**

### **1-1. GitHub Secrets ?„ì¬ ?íƒœ ?•ì¸**
?¤ìŒ URL?ì„œ ?„ì¬ ?¤ì •??Secretsë¥??•ì¸?˜ì„¸??
```
https://github.com/jomigata/wiz-coco/settings/secrets/actions
```

### **1-2. ë¯¸ì„¤?•ëœ ?„ìˆ˜ Secrets ëª©ë¡**
?¤ìŒ Secrets?¤ì´ ë¯¸ì„¤?•ë˜???ˆì„ ê°€?¥ì„±???’ìŠµ?ˆë‹¤:

#### **ìµœìš°???„ìˆ˜ (ì¦‰ì‹œ ?¤ì • ?„ìš”):**
- [ ] `FIREBASE_TOKEN` ? ï¸ **?„ì¬ ë¯¸ì„¤??*
- [ ] `FIREBASE_SERVICE_ACCOUNT` ? ï¸ **?„ì¬ ë¯¸ì„¤??*

#### **Firebase ?´ë¼?´ì–¸???¤ì • (?„ìˆ˜):**
- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY`
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

---

## **2?¨ê³„: ?¤ì œ ?¤ì •ê°??•ì¸ ë°??¤ì •**

### **2-1. FIREBASE_TOKEN ?¤ì • (ìµœìš°??**

#### **2-1-1. ?¤ì œ Firebase CI ? í° ?ì„±**
?°ë??ì—???¤ìŒ ëª…ë ¹???¤í–‰:
```bash
firebase login:ci
```

#### **2-1-2. ?¤ì œ ?ì„±??? í° ?•ì¸**
?°ë??ì— ?œì‹œ?˜ëŠ” ?¤ì œ ? í°??ë³µì‚¬:
```
1//0gM4mpE8f4tcgCgYIARAAGBASNwF-L9Ir6U37YD5x_g8Fz1US77dkI5P4w6LFv9bcaenA-7iiVBGvmA2G4C1bLpgFi9SoRNdQVdo
```

#### **2-1-3. GitHub Secrets???¤ì œ ? í° ?¤ì •**
1. https://github.com/jomigata/wiz-coco/settings/secrets/actions ?‘ì†
2. "New repository secret" ?´ë¦­
3. **Name**: `FIREBASE_TOKEN`
4. **Value**: ?„ì—???ì„±???¤ì œ ? í° ë¶™ì—¬?£ê¸°
5. "Add secret" ?´ë¦­

### **2-2. FIREBASE_SERVICE_ACCOUNT ?¤ì • (ìµœìš°??**

#### **2-2-1. ?¤ì œ Firebase Service Account JSON ?¤ìš´ë¡œë“œ**
1. https://console.firebase.google.com/project/wiz-coco/settings/serviceaccounts/adminsdk ?‘ì†
2. "Generate new private key" ?´ë¦­
3. ?¤ì œ JSON ?Œì¼ ?¤ìš´ë¡œë“œ

#### **2-2-2. ?¤ì œ JSON ?Œì¼ ?´ìš© ?•ì¸**
?¤ìš´ë¡œë“œ??JSON ?Œì¼???¤ì œ ?´ìš©???•ì¸:
```json
{
  "type": "service_account",
  "project_id": "wiz-coco",
  "private_key_id": "3fbc430944e609b27bba866039d6e84b5c858f9d",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEVQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDLdWcnIURortrb\nvYNEVrEAtGH...",
  "client_email": "firebase-adminsdk-fbsvc@wiz-coco.iam.gserviceaccount.com",
  "client_id": "114963538509418531170",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40wiz-coco.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}
```

#### **2-2-3. GitHub Secrets???¤ì œ JSON ?¤ì •**
1. https://github.com/jomigata/wiz-coco/settings/secrets/actions ?‘ì†
2. "New repository secret" ?´ë¦­
3. **Name**: `FIREBASE_SERVICE_ACCOUNT`
4. **Value**: ?¤ì œ JSON ?„ì²´ ?´ìš© ë¶™ì—¬?£ê¸°
5. "Add secret" ?´ë¦­

### **2-3. Firebase ?´ë¼?´ì–¸???¤ì •**

#### **2-3-1. Firebase Console?ì„œ ?¤ì œ ?¤ì •ê°?ë³µì‚¬**
1. https://console.firebase.google.com/project/wiz-coco/settings/general ?‘ì†
2. "Your apps" ?¹ì…˜?ì„œ ?????¤ì • ?•ì¸
3. ?¤ìŒ ?¤ì œ ê°’ë“¤??ë³µì‚¬:

| ?¤ì •ê°?| ë³µì‚¬ ë°©ë²• | ?¤ì œ ê°??ˆì‹œ |
|--------|-----------|-------------|
| **API Key** | ?”ë¸”?´ë¦­?˜ì—¬ ?„ì²´ ? íƒ ??Ctrl+C | `AIzaSyC...` (?¤ì œ ê°? |
| **Auth Domain** | ê°??•ì¸ | `wiz-coco.firebaseapp.com` |
| **Project ID** | ê°??•ì¸ | `wiz-coco` |
| **Storage Bucket** | ê°??•ì¸ | `wiz-coco.appspot.com` |
| **Messaging Sender ID** | ?”ë¸”?´ë¦­?˜ì—¬ ? íƒ ??Ctrl+C | `123456789` (?¤ì œ ê°? |
| **App ID** | ?”ë¸”?´ë¦­?˜ì—¬ ?„ì²´ ? íƒ ??Ctrl+C | `1:123456789:web:abcdef` (?¤ì œ ê°? |
| **Measurement ID** | ?”ë¸”?´ë¦­?˜ì—¬ ?„ì²´ ? íƒ ??Ctrl+C | `G-XXXXXXXXXX` (?¤ì œ ê°? |

#### **2-3-2. GitHub Secrets???¤ì œ ê°??¤ì •**
ê°??¤ì œ ?¤ì •ê°’ì„ ê°œë³„?ìœ¼ë¡?GitHub Secrets???¤ì •:

| GitHub Secret Name | ?¤ì œ Value |
|-------------------|------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | ë³µì‚¬???¤ì œ API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `wiz-coco.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `wiz-coco` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `wiz-coco.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | ë³µì‚¬???¤ì œ Messaging Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | ë³µì‚¬???¤ì œ App ID |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | ë³µì‚¬???¤ì œ Measurement ID |

---

## **3?¨ê³„: ?¤ì •ê°?ê²€ì¦?*

### **3-1. GitHub Secrets ëª©ë¡ ?•ì¸**
https://github.com/jomigata/wiz-coco/settings/secrets/actions ?ì„œ ?¤ìŒ ??ª©?¤ì´ ëª¨ë‘ ?¤ì •?˜ì—ˆ?”ì? ?•ì¸:

- ??`FIREBASE_TOKEN`
- ??`FIREBASE_SERVICE_ACCOUNT`
- ??`NEXT_PUBLIC_FIREBASE_API_KEY`
- ??`NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- ??`NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- ??`NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- ??`NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- ??`NEXT_PUBLIC_FIREBASE_APP_ID`
- ??`NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

### **3-2. ?¤ì œ ê°?ê²€ì¦?*
ê°??¤ì •ê°’ì´ ?¬ë°”ë¥¸ì? ?•ì¸:
- **FIREBASE_TOKEN**: `1//`ë¡??œì‘?˜ëŠ” ê¸?ë¬¸ì??
- **FIREBASE_SERVICE_ACCOUNT**: ? íš¨??JSON ?•íƒœ
- **API Key**: `AIzaSyC...`ë¡??œì‘?˜ëŠ” ê¸?ë¬¸ì??
- **Auth Domain**: `wiz-coco.firebaseapp.com`
- **Project ID**: `wiz-coco`
- **Storage Bucket**: `wiz-coco.appspot.com`
- **Messaging Sender ID**: ?«ìë§Œìœ¼ë¡?êµ¬ì„±
- **App ID**: `1:?«ì:web:ë¬¸ì?? ?•ì‹
- **Measurement ID**: `G-`ë¡??œì‘?˜ëŠ” ë¬¸ì??

---

## **4?¨ê³„: GitHub Actions ?¬ì‹¤??*

### **4-1. GitHub Actions ?˜ì´ì§€ ?‘ì†**
1. https://github.com/jomigata/wiz-coco/actions ?‘ì†
2. ìµœì‹  ?Œí¬?Œë¡œ???¤í–‰ ?•ì¸

### **4-2. ?Œí¬?Œë¡œ???¬ì‹¤??*
1. "Re-run jobs" ë²„íŠ¼ ?´ë¦­
2. "Re-run all jobs" ?´ë¦­

---

## **5?¨ê³„: ë°°í¬ ?±ê³µ ?•ì¸**

### **5-1. GitHub Actions ë¡œê·¸ ?•ì¸**
1. ?Œí¬?Œë¡œ???¤í–‰ ?íƒœ ?•ì¸
2. ?±ê³µ ë©”ì‹œì§€ ?•ì¸

### **5-2. ë°°í¬???¬ì´???•ì¸**
1. https://wiz-coco.web.app ?‘ì†
2. ?¬ì´?¸ê? ?•ìƒ?ìœ¼ë¡?ë¡œë“œ?˜ëŠ”ì§€ ?•ì¸

---

## **?”— ê´€??ë§í¬**

### **GitHub:**
- **Secrets Settings**: https://github.com/jomigata/wiz-coco/settings/secrets/actions
- **Actions**: https://github.com/jomigata/wiz-coco/actions

### **Firebase Console:**
- **General Settings**: https://console.firebase.google.com/project/wiz-coco/settings/general
- **Service Account**: https://console.firebase.google.com/project/wiz-coco/settings/serviceaccounts/adminsdk

### **ë°°í¬ ?•ì¸:**
- **ë©”ì¸ ?¬ì´??*: https://wiz-coco.web.app

---

## **?“ ë¬¸ì œ ?´ê²°**

### **ë¬¸ì œ 1: FIREBASE_TOKEN???¤ì •?˜ì? ?ŠìŒ**
**?´ê²°ë°©ë²•:**
1. `firebase login:ci` ?¤í–‰
2. ?ì„±???¤ì œ ? í°??GitHub Secrets???¤ì •

### **ë¬¸ì œ 2: FIREBASE_SERVICE_ACCOUNTê°€ ?¤ì •?˜ì? ?ŠìŒ**
**?´ê²°ë°©ë²•:**
1. Firebase Console?ì„œ ?¤ì œ ?œë¹„??ê³„ì • ???¤ìš´ë¡œë“œ
2. ?¤ì œ JSON ?„ì²´ ?´ìš©??GitHub Secrets???¤ì •

### **ë¬¸ì œ 3: Firebase ?´ë¼?´ì–¸???¤ì •ê°’ì´ ?†ìŒ**
**?´ê²°ë°©ë²•:**
1. Firebase Console?ì„œ ?¤ì œ ?????¤ì • ?•ì¸
2. ê°??¤ì œ ?¤ì •ê°’ì„ ë³µì‚¬?˜ì—¬ GitHub Secrets???¤ì •

### **ë¬¸ì œ 4: ê°’ì´ ?¬ë°”ë¥´ì? ?ŠìŒ**
**?´ê²°ë°©ë²•:**
1. Firebase Console?ì„œ ?¤ì œ ?¤ì •ê°??¬í™•??
2. ë³µì‚¬???¤ì œ ê°’ì´ ?¬ë°”ë¥¸ì? ?•ì¸
3. GitHub Secrets?ì„œ ?¤ì œ ê°??¬ì„¤??

---

## **???„ë£Œ ì²´í¬ë¦¬ìŠ¤??*

- [ ] FIREBASE_TOKEN ?¤ì œ ?¤ì • ?„ë£Œ
- [ ] FIREBASE_SERVICE_ACCOUNT ?¤ì œ ?¤ì • ?„ë£Œ
- [ ] NEXT_PUBLIC_FIREBASE_API_KEY ?¤ì œ ?¤ì • ?„ë£Œ
- [ ] NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?¤ì œ ?¤ì • ?„ë£Œ
- [ ] NEXT_PUBLIC_FIREBASE_PROJECT_ID ?¤ì œ ?¤ì • ?„ë£Œ
- [ ] NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?¤ì œ ?¤ì • ?„ë£Œ
- [ ] NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?¤ì œ ?¤ì • ?„ë£Œ
- [ ] NEXT_PUBLIC_FIREBASE_APP_ID ?¤ì œ ?¤ì • ?„ë£Œ
- [ ] NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?¤ì œ ?¤ì • ?„ë£Œ
- [ ] GitHub Actions ?¬ì‹¤???„ë£Œ
- [ ] ë°°í¬ ?±ê³µ ?•ì¸ ?„ë£Œ

---

## **?¯ ?±ê³µ ?•ì¸**

ëª¨ë“  ?¤ì •???„ë£Œ?˜ë©´:
1. **GitHub Actions?ì„œ ?±ê³µ ë©”ì‹œì§€ ?•ì¸**
2. **ë°°í¬ ?„ë£Œ ??https://wiz-coco.web.app ?‘ì†**
3. **?¬ì´?¸ê? ?•ìƒ?ìœ¼ë¡?ë¡œë“œ?˜ëŠ”ì§€ ?•ì¸**

**ì¶•í•˜?©ë‹ˆ?? ëª¨ë“  ?¤ì œ ?¤ì •ê°’ì´ ?¬ë°”ë¥´ê²Œ ?¤ì •?˜ì—ˆ?µë‹ˆ??** ?‰ 
# ?? WizCoCo ë°°í¬ ?íƒœ ë°??´ê²° ê°€?´ë“œ

## ??**?´ê²°??ë¬¸ì œ?ë“¤**

### **1. FIREBASE_TOKEN ?ì„± ?„ë£Œ**
- **?ì„±??? í°**: `1//0gIbt4IPPkWKqCgYIARAAGBASNwF-L9IrVkWghw8QRx7D-vOUfoMg0q9qIEzr4WEtg_cxwJiaCy5z`
- **?íƒœ**: ???ì„± ?„ë£Œ
- **?¤ìŒ ?¨ê³„**: GitHub Secrets???¤ì • ?„ìš”

### **2. FIREBASE_SERVICE_ACCOUNT ì¤€ë¹??„ë£Œ**
- **?Œì¼ ?„ì¹˜**: `d:\Capture\wiz-coco-firebase-adminsdk-fbsvc-c153fcc55d.json`
- **?íƒœ**: ???Œì¼ ì¤€ë¹??„ë£Œ
- **?¤ìŒ ?¨ê³„**: JSON ?´ìš©??GitHub Secrets???¤ì • ?„ìš”

### **3. ë¡œì»¬ ë°°í¬ ?±ê³µ ?„ë£Œ** ?‰
- **ë°°í¬ URL**: https://wiz-coco.web.app
- **?íƒœ**: ??ë°°í¬ ?±ê³µ
- **ë°°í¬ ?œê°„**: 2025??1??27??
- **?Œì¼ ??*: 407ê°??Œì¼ ?…ë¡œ???„ë£Œ

---

## ?š¨ **ì¦‰ì‹œ ?´ê²°?´ì•¼ ???‘ì—…**

### **1?¨ê³„: GitHub Secrets ?¤ì • (?ë™ ë°°í¬??**

#### **1-1. FIREBASE_TOKEN ?¤ì •**
1. **GitHub Secrets ?˜ì´ì§€ ?‘ì†**
   - https://github.com/jomigata/wiz-coco/settings/secrets/actions

2. **"New repository secret" ?´ë¦­**

3. **?¤ì •ê°??…ë ¥**
   - **Name**: `FIREBASE_TOKEN`
   - **Value**: `1//0gIbt4IPPkWKqCgYIARAAGBASNwF-L9IrVkWghw8QRx7D-vOUfoMg0q9qIEzr4WEtg_cxwJiaCy5z`
   - **"Add secret" ?´ë¦­**

#### **1-2. FIREBASE_SERVICE_ACCOUNT ?¤ì •**
1. **JSON ?Œì¼ ?´ìš© ë³µì‚¬**
   - `d:\Capture\wiz-coco-firebase-adminsdk-fbsvc-c153fcc55d.json` ?Œì¼ ?´ê¸°
   - ?„ì²´ ?´ìš©??Ctrl+Aë¡?? íƒ ??Ctrl+Cë¡?ë³µì‚¬

2. **GitHub Secrets???¤ì •**
   - **Name**: `FIREBASE_SERVICE_ACCOUNT`
   - **Value**: ë³µì‚¬??JSON ?„ì²´ ?´ìš© ë¶™ì—¬?£ê¸°
   - **"Add secret" ?´ë¦­**

#### **1-3. Firebase ?´ë¼?´ì–¸???¤ì •**
Firebase Console?ì„œ ?¤ìŒ ê°’ë“¤??ë³µì‚¬?˜ì—¬ ?¤ì •:

| GitHub Secret Name | Firebase Console?ì„œ ë³µì‚¬??ê°?|
|-------------------|-------------------------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `wiz-coco.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `wiz-coco` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `wiz-coco.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Messaging Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | App ID |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Measurement ID |

### **2?¨ê³„: GitHub Actions ?¬ì‹¤??*

1. **GitHub Actions ?˜ì´ì§€ ?‘ì†**
   - https://github.com/jomigata/wiz-coco/actions

2. **"Re-run jobs" ?´ë¦­**

3. **"Re-run all jobs" ?´ë¦­**

---

## ?“Š **?„ì¬ ?¤ì • ?íƒœ**

### **???„ë£Œ???¤ì •**
- [x] Firebase CLI ?¤ì¹˜ ë°?ë¡œê·¸??
- [x] FIREBASE_TOKEN ?ì„±
- [x] FIREBASE_SERVICE_ACCOUNT ?Œì¼ ì¤€ë¹?
- [x] **ë¡œì»¬ ë¹Œë“œ ?±ê³µ**
- [x] **ë¡œì»¬ ë°°í¬ ?±ê³µ**

### **? ï¸ ë¯¸ì™„ë£??¤ì • (?ë™ ë°°í¬??**
- [ ] FIREBASE_TOKEN GitHub Secrets ?¤ì •
- [ ] FIREBASE_SERVICE_ACCOUNT GitHub Secrets ?¤ì •
- [ ] Firebase ?´ë¼?´ì–¸???¤ì •ê°’ë“¤ GitHub Secrets ?¤ì •

---

## ?Œ **ë°°í¬???¬ì´???•ë³´**

### **ë©”ì¸ ?¬ì´??*
- **URL**: https://wiz-coco.web.app
- **?íƒœ**: ???•ìƒ ë°°í¬??
- **?˜ì´ì§€ ??*: 52ê°??˜ì´ì§€
- **ì´??Œì¼ ??*: 407ê°??Œì¼

### **Firebase Console**
- **?„ë¡œ?íŠ¸**: wiz-coco
- **Hosting URL**: https://console.firebase.google.com/project/wiz-coco/overview

---

## ?”— **ê´€??ë§í¬**

### **GitHub:**
- **Secrets Settings**: https://github.com/jomigata/wiz-coco/settings/secrets/actions
- **Actions**: https://github.com/jomigata/wiz-coco/actions

### **Firebase Console:**
- **General Settings**: https://console.firebase.google.com/project/wiz-coco/settings/general
- **Service Account**: https://console.firebase.google.com/project/wiz-coco/settings/serviceaccounts/adminsdk

### **ë°°í¬ ?•ì¸:**
- **ë©”ì¸ ?¬ì´??*: https://wiz-coco.web.app

---

## ?¯ **?ˆìƒ ê²°ê³¼**

ëª¨ë“  ?¤ì •???„ë£Œ?˜ë©´:
1. **GitHub Actionsê°€ ?±ê³µ?ìœ¼ë¡??¤í–‰??*
2. **Firebase Hosting???ë™ ë°°í¬??*
3. **https://wiz-coco.web.app ?ì„œ ?¬ì´???•ì¸ ê°€??*

---

## ?“ **ë¬¸ì œ ?´ê²°**

### **ë¬¸ì œ 1: GitHub Secrets ?¤ì •???ˆë¨**
**?´ê²°ë°©ë²•:**
1. GitHub ?€?¥ì†Œ???€??ê´€ë¦¬ì ê¶Œí•œ ?•ì¸
2. ë¸Œë¼?°ì? ìºì‹œ ?? œ ???¬ì‹œ??
3. ?¤ë¥¸ ë¸Œë¼?°ì??ì„œ ?œë„

### **ë¬¸ì œ 2: Firebase Console ?‘ì†???ˆë¨**
**?´ê²°ë°©ë²•:**
1. ?¬ë°”ë¥?Google ê³„ì •?¼ë¡œ ë¡œê·¸???•ì¸
2. Firebase ?„ë¡œ?íŠ¸ ê¶Œí•œ ?•ì¸
3. ë¸Œë¼?°ì? ?•ì¥ ?„ë¡œê·¸ë¨ ë¹„í™œ?±í™” ???œë„

### **ë¬¸ì œ 3: ë°°í¬ ???¬ì´?¸ê? ë¡œë“œ?˜ì? ?ŠìŒ**
**?´ê²°ë°©ë²•:**
1. Firebase Console?ì„œ Hosting ?íƒœ ?•ì¸
2. ?„ë©”???¤ì • ?•ì¸
3. ìºì‹œ ?? œ ???¬ì‹œ??

---

## ?? **ë°°í¬ ?„ë£Œ ???•ì¸?¬í•­**

1. **?¬ì´???‘ì† ?•ì¸**: https://wiz-coco.web.app
2. **ì£¼ìš” ê¸°ëŠ¥ ?ŒìŠ¤??*: ë¡œê·¸?? ?ŒìŠ¤?? ê²°ê³¼ ?€??
3. **?±ëŠ¥ ?•ì¸**: ?˜ì´ì§€ ë¡œë”© ?ë„, ë°˜ì‘??
4. **ëª¨ë°”???¸í™˜???•ì¸**: ?¤ì–‘??ê¸°ê¸°?ì„œ ?ŒìŠ¤??

---

## ?“… **?…ë°?´íŠ¸ ?¼ì‹œ**

- **ìµœì¢… ?…ë°?´íŠ¸**: 2025??1??27??
- **ë°°í¬ ?„ë£Œ**: 2025??1??27??
- **?¤ìŒ ê²€??*: GitHub Actions ?ë™ ë°°í¬ ?¤ì • ?„ë£Œ ??
- **?´ë‹¹??*: AI ?´ì‹œ?¤í„´??
# ìµœì¢… ?¤ì • ê²€ì¦?ë°?ë¯¸ì„¤??ë¶€ë¶??•ì¸ ê°€?´ë“œ

## ?š¨ **ìµœì¢… ?¤ì • ê²€ì¦?ë°?ë¯¸ì„¤??ë¶€ë¶??•ì¸**

?´ì „ ?‘ì—…?¤ì—??ë¯¸ì„¤?•ë˜?ˆê±°???˜ëª»???¤ì •?¤ì„ ìµœì¢…?ìœ¼ë¡??•ì¸?˜ê³  ?¤ì •?˜ëŠ” ë°©ë²•???ˆë‚´?©ë‹ˆ??

---

## **1?¨ê³„: ?„ì¬ ?¤ì • ?íƒœ ìµœì¢… ?•ì¸**

### **1-1. GitHub Secrets ?„ì¬ ?íƒœ ?•ì¸**
?¤ìŒ URL?ì„œ ?„ì¬ ?¤ì •??Secretsë¥??•ì¸?˜ì„¸??
```
https://github.com/jomigata/wiz-coco/settings/secrets/actions
```

### **1-2. ë¯¸ì„¤?•ëœ ?„ìˆ˜ Secrets ìµœì¢… ëª©ë¡**
?¤ìŒ Secrets?¤ì´ ë¯¸ì„¤?•ë˜???ˆì„ ê°€?¥ì„±???’ìŠµ?ˆë‹¤:

#### **ìµœìš°???„ìˆ˜ (ì¦‰ì‹œ ?¤ì • ?„ìš”):**
- [ ] `FIREBASE_TOKEN` ? ï¸ **?„ì¬ ë¯¸ì„¤??*
- [ ] `FIREBASE_SERVICE_ACCOUNT` ? ï¸ **?„ì¬ ë¯¸ì„¤??*

#### **Firebase ?´ë¼?´ì–¸???¤ì • (?„ìˆ˜):**
- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY` ? ï¸ **?„ì¬ ë¯¸ì„¤??*
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` ? ï¸ **?„ì¬ ë¯¸ì„¤??*
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID` ? ï¸ **?„ì¬ ë¯¸ì„¤??*
- [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` ? ï¸ **?„ì¬ ë¯¸ì„¤??*
- [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` ? ï¸ **?„ì¬ ë¯¸ì„¤??*
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID` ? ï¸ **?„ì¬ ë¯¸ì„¤??*
- [ ] `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` ? ï¸ **?„ì¬ ë¯¸ì„¤??*

---

## **2?¨ê³„: ë¯¸ì„¤?•ëœ ë¶€ë¶??¤ì • (?˜ë™ ?‘ì—…)**

### **?š¨ ê¸´ê¸‰ ?‘ì—… (ì§€ê¸?ë°”ë¡œ ?¤í–‰):**

#### **2-1. FIREBASE_TOKEN ?¤ì • (ìµœìš°??**

**1?¨ê³„: ?°ë??ì—??? í° ?ì„±**
```bash
firebase login:ci
```

**2?¨ê³„: ?ì„±??? í° ?•ì¸**
?°ë??ì— ?œì‹œ?˜ëŠ” ? í°??ë³µì‚¬:
```
1//0gM4mpE8f4tcgCgYIARAAGBASNwF-L9Ir6U37YD5x_g8Fz1US77dkI5P4w6LFv9bcaenA-7iiVBGvmA2G4C1bLpgFi9SoRNdQVdo
```

**3?¨ê³„: GitHub Secrets???¤ì •**
1. https://github.com/jomigata/wiz-coco/settings/secrets/actions ?‘ì†
2. "New repository secret" ?´ë¦­
3. **Name**: `FIREBASE_TOKEN`
4. **Value**: ?„ì—???ì„±??? í° ë¶™ì—¬?£ê¸°
5. "Add secret" ?´ë¦­

#### **2-2. FIREBASE_SERVICE_ACCOUNT ?¤ì • (ìµœìš°??**

**1?¨ê³„: Firebase Console?ì„œ ?œë¹„??ê³„ì • ???¤ìš´ë¡œë“œ**
1. https://console.firebase.google.com/project/wiz-coco/settings/serviceaccounts/adminsdk ?‘ì†
2. "Generate new private key" ?´ë¦­
3. JSON ?Œì¼ ?¤ìš´ë¡œë“œ

**2?¨ê³„: JSON ?Œì¼ ?´ìš© ?•ì¸**
?¤ìš´ë¡œë“œ??JSON ?Œì¼??ë©”ëª¨?¥ìœ¼ë¡??´ì–´???„ì²´ ?´ìš©???•ì¸:
```json
{
  "type": "service_account",
  "project_id": "wiz-coco",
  "private_key_id": "3fbc430944e609b27bba866039d6e84b5c858f9d",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEVQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDLdWcnIURortrb\nvYNEVrEAtGH...",
  "client_email": "firebase-adminsdk-fbsvc@wiz-coco.iam.gserviceaccount.com",
  "client_id": "114963538509418531170",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40wiz-coco.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}
```

**3?¨ê³„: GitHub Secrets???¤ì •**
1. https://github.com/jomigata/wiz-coco/settings/secrets/actions ?‘ì†
2. "New repository secret" ?´ë¦­
3. **Name**: `FIREBASE_SERVICE_ACCOUNT`
4. **Value**: JSON ?„ì²´ ?´ìš© ë¶™ì—¬?£ê¸°
5. "Add secret" ?´ë¦­

#### **2-3. Firebase ?´ë¼?´ì–¸???¤ì •**

**1?¨ê³„: Firebase Console?ì„œ ?????¤ì •ê°?ë³µì‚¬**
1. https://console.firebase.google.com/project/wiz-coco/settings/general ?‘ì†
2. "Your apps" ?¹ì…˜?ì„œ ?????¤ì • ?•ì¸
3. ?¤ìŒ ê°’ë“¤??ë³µì‚¬:

| ?¤ì •ê°?| ë³µì‚¬ ë°©ë²• | ?¤ì œ ê°??ˆì‹œ |
|--------|-----------|-------------|
| **API Key** | ?”ë¸”?´ë¦­?˜ì—¬ ?„ì²´ ? íƒ ??Ctrl+C | `AIzaSyC...` (?¤ì œ ê°? |
| **Auth Domain** | ê°??•ì¸ | `wiz-coco.firebaseapp.com` |
| **Project ID** | ê°??•ì¸ | `wiz-coco` |
| **Storage Bucket** | ê°??•ì¸ | `wiz-coco.appspot.com` |
| **Messaging Sender ID** | ?”ë¸”?´ë¦­?˜ì—¬ ? íƒ ??Ctrl+C | `123456789` (?¤ì œ ê°? |
| **App ID** | ?”ë¸”?´ë¦­?˜ì—¬ ?„ì²´ ? íƒ ??Ctrl+C | `1:123456789:web:abcdef` (?¤ì œ ê°? |
| **Measurement ID** | ?”ë¸”?´ë¦­?˜ì—¬ ?„ì²´ ? íƒ ??Ctrl+C | `G-XXXXXXXXXX` (?¤ì œ ê°? |

**2?¨ê³„: ê°??¤ì •ê°’ì„ GitHub Secrets???¤ì •**
ê°ê° ê°œë³„?ìœ¼ë¡?GitHub Secrets???¤ì •:

| GitHub Secret Name | ?¤ì œ Value |
|-------------------|------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | ë³µì‚¬???¤ì œ API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `wiz-coco.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `wiz-coco` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `wiz-coco.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | ë³µì‚¬???¤ì œ Messaging Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | ë³µì‚¬???¤ì œ App ID |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | ë³µì‚¬???¤ì œ Measurement ID |

---

## **3?¨ê³„: ?¤ì •ê°?ìµœì¢… ê²€ì¦?*

### **3-1. GitHub Secrets ëª©ë¡ ìµœì¢… ?•ì¸**
https://github.com/jomigata/wiz-coco/settings/secrets/actions ?ì„œ ?¤ìŒ ??ª©?¤ì´ ëª¨ë‘ ?¤ì •?˜ì—ˆ?”ì? ?•ì¸:

- ??`FIREBASE_TOKEN`
- ??`FIREBASE_SERVICE_ACCOUNT`
- ??`NEXT_PUBLIC_FIREBASE_API_KEY`
- ??`NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- ??`NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- ??`NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- ??`NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- ??`NEXT_PUBLIC_FIREBASE_APP_ID`
- ??`NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

### **3-2. ?¤ì œ ê°?ìµœì¢… ê²€ì¦?*
ê°??¤ì •ê°’ì´ ?¬ë°”ë¥¸ì? ?•ì¸:
- **FIREBASE_TOKEN**: `1//`ë¡??œì‘?˜ëŠ” ê¸?ë¬¸ì??
- **FIREBASE_SERVICE_ACCOUNT**: ? íš¨??JSON ?•íƒœ
- **API Key**: `AIzaSyC...`ë¡??œì‘?˜ëŠ” ê¸?ë¬¸ì??
- **Auth Domain**: `wiz-coco.firebaseapp.com`
- **Project ID**: `wiz-coco`
- **Storage Bucket**: `wiz-coco.appspot.com`
- **Messaging Sender ID**: ?«ìë§Œìœ¼ë¡?êµ¬ì„±
- **App ID**: `1:?«ì:web:ë¬¸ì?? ?•ì‹
- **Measurement ID**: `G-`ë¡??œì‘?˜ëŠ” ë¬¸ì??

---

## **4?¨ê³„: GitHub Actions ?¬ì‹¤??*

### **4-1. GitHub Actions ?˜ì´ì§€ ?‘ì†**
1. https://github.com/jomigata/wiz-coco/actions ?‘ì†
2. ìµœì‹  ?Œí¬?Œë¡œ???¤í–‰ ?•ì¸

### **4-2. ?Œí¬?Œë¡œ???¬ì‹¤??*
1. "Re-run jobs" ë²„íŠ¼ ?´ë¦­
2. "Re-run all jobs" ?´ë¦­

---

## **5?¨ê³„: ë°°í¬ ?±ê³µ ìµœì¢… ?•ì¸**

### **5-1. GitHub Actions ë¡œê·¸ ?•ì¸**
1. ?Œí¬?Œë¡œ???¤í–‰ ?íƒœ ?•ì¸
2. ?±ê³µ ë©”ì‹œì§€ ?•ì¸

### **5-2. ë°°í¬???¬ì´??ìµœì¢… ?•ì¸**
1. https://wiz-coco.web.app ?‘ì†
2. ?¬ì´?¸ê? ?•ìƒ?ìœ¼ë¡?ë¡œë“œ?˜ëŠ”ì§€ ?•ì¸

---

## **?”— ê´€??ë§í¬**

### **GitHub:**
- **Secrets Settings**: https://github.com/jomigata/wiz-coco/settings/secrets/actions
- **Actions**: https://github.com/jomigata/wiz-coco/actions

### **Firebase Console:**
- **General Settings**: https://console.firebase.google.com/project/wiz-coco/settings/general
- **Service Account**: https://console.firebase.google.com/project/wiz-coco/settings/serviceaccounts/adminsdk

### **ë°°í¬ ?•ì¸:**
- **ë©”ì¸ ?¬ì´??*: https://wiz-coco.web.app

---

## **?“ ë¬¸ì œ ?´ê²°**

### **ë¬¸ì œ 1: FIREBASE_TOKEN???¤ì •?˜ì? ?ŠìŒ**
**?´ê²°ë°©ë²•:**
1. `firebase login:ci` ?¤í–‰
2. ?ì„±??? í°??GitHub Secrets???¤ì •

### **ë¬¸ì œ 2: FIREBASE_SERVICE_ACCOUNTê°€ ?¤ì •?˜ì? ?ŠìŒ**
**?´ê²°ë°©ë²•:**
1. Firebase Console?ì„œ ?œë¹„??ê³„ì • ???¤ìš´ë¡œë“œ
2. JSON ?„ì²´ ?´ìš©??GitHub Secrets???¤ì •

### **ë¬¸ì œ 3: Firebase ?´ë¼?´ì–¸???¤ì •ê°’ì´ ?†ìŒ**
**?´ê²°ë°©ë²•:**
1. Firebase Console?ì„œ ?????¤ì • ?•ì¸
2. ê°??¤ì •ê°’ì„ ë³µì‚¬?˜ì—¬ GitHub Secrets???¤ì •

### **ë¬¸ì œ 4: ê°’ì´ ?¬ë°”ë¥´ì? ?ŠìŒ**
**?´ê²°ë°©ë²•:**
1. Firebase Console?ì„œ ?¤ì •ê°??¬í™•??
2. ë³µì‚¬??ê°’ì´ ?¬ë°”ë¥¸ì? ?•ì¸
3. GitHub Secrets?ì„œ ê°??¬ì„¤??

---

## **??ìµœì¢… ?„ë£Œ ì²´í¬ë¦¬ìŠ¤??*

- [ ] FIREBASE_TOKEN ?¤ì • ?„ë£Œ
- [ ] FIREBASE_SERVICE_ACCOUNT ?¤ì • ?„ë£Œ
- [ ] NEXT_PUBLIC_FIREBASE_API_KEY ?¤ì • ?„ë£Œ
- [ ] NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?¤ì • ?„ë£Œ
- [ ] NEXT_PUBLIC_FIREBASE_PROJECT_ID ?¤ì • ?„ë£Œ
- [ ] NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?¤ì • ?„ë£Œ
- [ ] NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?¤ì • ?„ë£Œ
- [ ] NEXT_PUBLIC_FIREBASE_APP_ID ?¤ì • ?„ë£Œ
- [ ] NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?¤ì • ?„ë£Œ
- [ ] GitHub Actions ?¬ì‹¤???„ë£Œ
- [ ] ë°°í¬ ?±ê³µ ?•ì¸ ?„ë£Œ

---

## **?¯ ìµœì¢… ?±ê³µ ?•ì¸**

ëª¨ë“  ?¤ì •???„ë£Œ?˜ë©´:
1. **GitHub Actions?ì„œ ?±ê³µ ë©”ì‹œì§€ ?•ì¸**
2. **ë°°í¬ ?„ë£Œ ??https://wiz-coco.web.app ?‘ì†**
3. **?¬ì´?¸ê? ?•ìƒ?ìœ¼ë¡?ë¡œë“œ?˜ëŠ”ì§€ ?•ì¸**

**ì¶•í•˜?©ë‹ˆ?? ëª¨ë“  ë¯¸ì„¤?•ëœ ë¶€ë¶„ì´ ìµœì¢…?ìœ¼ë¡??´ê²°?˜ì—ˆ?µë‹ˆ??** ?‰ 
# Firebase ?¤ì œ ?¤ì •ê°??•ì¸ ê°€?´ë“œ

## ?š¨ **?¤ì œ Firebase ?¤ì •ê°??•ì¸ ë°?ë³µì‚¬ ë°©ë²•**

Firebase Console?ì„œ ?¤ì œ ?¤ì •ê°’ë“¤???•ì¸?˜ê³  ë³µì‚¬?˜ëŠ” ë°©ë²•???¨ê³„ë³„ë¡œ ?ˆë‚´?©ë‹ˆ??

---

## **1?¨ê³„: Firebase Console ?‘ì†**

### **1-1. ë¸Œë¼?°ì??ì„œ Firebase Console ?´ê¸°**
1. **ë¸Œë¼?°ì? ì£¼ì†Œì°½ì— ?¤ìŒ URL ?…ë ¥:**
   ```
   https://console.firebase.google.com/project/wiz-coco/settings/general
   ```
2. **Enter ?¤ë? ?ŒëŸ¬ ?‘ì†**

### **1-2. ?„ë¡œ?íŠ¸ ?•ì¸**
1. **?ë‹¨??"wiz-coco" ?„ë¡œ?íŠ¸ê°€ ? íƒ?˜ì–´ ?ˆëŠ”ì§€ ?•ì¸**
2. **ë§Œì•½ ?¤ë¥¸ ?„ë¡œ?íŠ¸ê°€ ? íƒ?˜ì–´ ?ˆë‹¤ë©??œë¡­?¤ìš´?ì„œ "wiz-coco" ? íƒ**

---

## **2?¨ê³„: ?????¤ì • ì°¾ê¸°**

### **2-1. Project settings ?‘ì†**
1. **?¼ìª½ ?ë‹¨???±ë‹ˆë°”í€??„ì´ì½??´ë¦­** (Project settings)
2. **"General" ??´ ? íƒ?˜ì–´ ?ˆëŠ”ì§€ ?•ì¸**

### **2-2. Your apps ?¹ì…˜ ?•ì¸**
1. **?˜ì´ì§€ë¥??„ë˜ë¡??¤í¬ë¡¤í•˜??"Your apps" ?¹ì…˜ ì°¾ê¸°**
2. **???±ì´ ?ˆëŠ”ì§€ ?•ì¸** (</> ?„ì´ì½˜ì´ ?ˆëŠ” ??

### **2-3. ???±ì´ ?†ëŠ” ê²½ìš° ?±ë¡**
ë§Œì•½ ???±ì´ ?†ë‹¤ë©?
1. **"Add app" ë²„íŠ¼ ?´ë¦­**
2. **"Web" ?„ì´ì½??´ë¦­** (</> ?„ì´ì½?
3. **???‰ë„¤???…ë ¥**: `wizcoco-web`
4. **"Register app" ?´ë¦­**
5. **"Continue to console" ?´ë¦­**

---

## **3?¨ê³„: ?¤ì •ê°?ë³µì‚¬**

### **3-1. ?????¤ì • ?´ê¸°**
1. **"Your apps" ?¹ì…˜?ì„œ ?????´ë¦­**
2. **?????¤ì • ?˜ì´ì§€ë¡??´ë™**

### **3-2. ?¤ì •ê°’ë“¤ ë³µì‚¬**

#### **3-2-1. API Key ë³µì‚¬**
1. **"API Key" ?¹ì…˜ ì°¾ê¸°**
2. **API Key ê°’ì„ ?”ë¸”?´ë¦­?˜ì—¬ ?„ì²´ ? íƒ**
3. **Ctrl+Cë¡?ë³µì‚¬**
4. **ë©”ëª¨?¥ì— ë¶™ì—¬?£ê¸°**

**?ˆì‹œ**: `AIzaSyC...`ë¡??œì‘?˜ëŠ” ê¸?ë¬¸ì??

#### **3-2-2. Auth Domain ?•ì¸**
1. **"Auth Domain" ?¹ì…˜ ì°¾ê¸°**
2. **ê°??•ì¸**: `wiz-coco.firebaseapp.com`
3. **ë©”ëª¨?¥ì— ?€??*

#### **3-2-3. Project ID ?•ì¸**
1. **"Project ID" ?¹ì…˜ ì°¾ê¸°**
2. **ê°??•ì¸**: `wiz-coco`
3. **ë©”ëª¨?¥ì— ?€??*

#### **3-2-4. Storage Bucket ?•ì¸**
1. **"Storage Bucket" ?¹ì…˜ ì°¾ê¸°**
2. **ê°??•ì¸**: `wiz-coco.appspot.com`
3. **ë©”ëª¨?¥ì— ?€??*

#### **3-2-5. Messaging Sender ID ë³µì‚¬**
1. **"Messaging Sender ID" ?¹ì…˜ ì°¾ê¸°**
2. **?«ì ê°’ì„ ?”ë¸”?´ë¦­?˜ì—¬ ? íƒ**
3. **Ctrl+Cë¡?ë³µì‚¬**
4. **ë©”ëª¨?¥ì— ë¶™ì—¬?£ê¸°**

**?ˆì‹œ**: `123456789` (?«ìë§?

#### **3-2-6. App ID ë³µì‚¬**
1. **"App ID" ?¹ì…˜ ì°¾ê¸°**
2. **App ID ê°’ì„ ?”ë¸”?´ë¦­?˜ì—¬ ?„ì²´ ? íƒ**
3. **Ctrl+Cë¡?ë³µì‚¬**
4. **ë©”ëª¨?¥ì— ë¶™ì—¬?£ê¸°**

**?ˆì‹œ**: `1:123456789:web:abcdef` (1:?«ì:web:ë¬¸ì???•ì‹)

#### **3-2-7. Measurement ID ë³µì‚¬**
1. **"Measurement ID" ?¹ì…˜ ì°¾ê¸°**
2. **Measurement ID ê°’ì„ ?”ë¸”?´ë¦­?˜ì—¬ ?„ì²´ ? íƒ**
3. **Ctrl+Cë¡?ë³µì‚¬**
4. **ë©”ëª¨?¥ì— ë¶™ì—¬?£ê¸°**

**?ˆì‹œ**: `G-XXXXXXXXXX` (G-ë¡??œì‘?˜ëŠ” ë¬¸ì??

---

## **4?¨ê³„: ë©”ëª¨?¥ì— ?€?¥ëœ ê°’ë“¤ ?•ì¸**

ë©”ëª¨?¥ì— ?¤ìŒê³?ê°™ì´ ?€?¥ë˜???ˆëŠ”ì§€ ?•ì¸:

```
API Key: AIzaSyC... (?¤ì œ ê°?
Auth Domain: wiz-coco.firebaseapp.com
Project ID: wiz-coco
Storage Bucket: wiz-coco.appspot.com
Messaging Sender ID: 123456789 (?¤ì œ ê°?
App ID: 1:123456789:web:abcdef (?¤ì œ ê°?
Measurement ID: G-XXXXXXXXXX (?¤ì œ ê°?
```

---

## **5?¨ê³„: GitHub Secrets ?¤ì •**

### **5-1. GitHub Secrets ?˜ì´ì§€ ?‘ì†**
1. **??ë¸Œë¼?°ì? ???´ê¸°**
2. **?¤ìŒ URL ?…ë ¥:**
   ```
   https://github.com/jomigata/wiz-coco/settings/secrets/actions
   ```
3. **Enter ?¤ë? ?ŒëŸ¬ ?‘ì†**

### **5-2. ê°??¤ì •ê°’ì„ GitHub Secrets???¤ì •**

#### **5-2-1. NEXT_PUBLIC_FIREBASE_API_KEY**
1. **"New repository secret" ë²„íŠ¼ ?´ë¦­**
2. **Name ?…ë ¥**: `NEXT_PUBLIC_FIREBASE_API_KEY`
3. **Value ?…ë ¥**: ë©”ëª¨?¥ì—??ë³µì‚¬??API Key ë¶™ì—¬?£ê¸°
4. **"Add secret" ?´ë¦­**

#### **5-2-2. NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN**
1. **"New repository secret" ë²„íŠ¼ ?´ë¦­**
2. **Name ?…ë ¥**: `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
3. **Value ?…ë ¥**: `wiz-coco.firebaseapp.com`
4. **"Add secret" ?´ë¦­**

#### **5-2-3. NEXT_PUBLIC_FIREBASE_PROJECT_ID**
1. **"New repository secret" ë²„íŠ¼ ?´ë¦­**
2. **Name ?…ë ¥**: `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
3. **Value ?…ë ¥**: `wiz-coco`
4. **"Add secret" ?´ë¦­**

#### **5-2-4. NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET**
1. **"New repository secret" ë²„íŠ¼ ?´ë¦­**
2. **Name ?…ë ¥**: `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
3. **Value ?…ë ¥**: `wiz-coco.appspot.com`
4. **"Add secret" ?´ë¦­**

#### **5-2-5. NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID**
1. **"New repository secret" ë²„íŠ¼ ?´ë¦­**
2. **Name ?…ë ¥**: `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
3. **Value ?…ë ¥**: ë©”ëª¨?¥ì—??ë³µì‚¬??Messaging Sender ID ë¶™ì—¬?£ê¸°
4. **"Add secret" ?´ë¦­**

#### **5-2-6. NEXT_PUBLIC_FIREBASE_APP_ID**
1. **"New repository secret" ë²„íŠ¼ ?´ë¦­**
2. **Name ?…ë ¥**: `NEXT_PUBLIC_FIREBASE_APP_ID`
3. **Value ?…ë ¥**: ë©”ëª¨?¥ì—??ë³µì‚¬??App ID ë¶™ì—¬?£ê¸°
4. **"Add secret" ?´ë¦­**

#### **5-2-7. NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID**
1. **"New repository secret" ë²„íŠ¼ ?´ë¦­**
2. **Name ?…ë ¥**: `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`
3. **Value ?…ë ¥**: ë©”ëª¨?¥ì—??ë³µì‚¬??Measurement ID ë¶™ì—¬?£ê¸°
4. **"Add secret" ?´ë¦­**

---

## **6?¨ê³„: ?¤ì • ?•ì¸**

### **6-1. GitHub Secrets ëª©ë¡ ?•ì¸**
GitHub Secrets ?˜ì´ì§€?ì„œ ?¤ìŒ ??ª©?¤ì´ ëª¨ë‘ ?¤ì •?˜ì—ˆ?”ì? ?•ì¸:

- ??`NEXT_PUBLIC_FIREBASE_API_KEY`
- ??`NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- ??`NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- ??`NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- ??`NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- ??`NEXT_PUBLIC_FIREBASE_APP_ID`
- ??`NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

### **6-2. ê°?ê²€ì¦?*
ê°??¤ì •ê°’ì´ ?¬ë°”ë¥¸ì? ?•ì¸:
- **API Key**: `AIzaSyC...`ë¡??œì‘?˜ëŠ” ê¸?ë¬¸ì??
- **Auth Domain**: `wiz-coco.firebaseapp.com`
- **Project ID**: `wiz-coco`
- **Storage Bucket**: `wiz-coco.appspot.com`
- **Messaging Sender ID**: ?«ìë§Œìœ¼ë¡?êµ¬ì„±
- **App ID**: `1:?«ì:web:ë¬¸ì?? ?•ì‹
- **Measurement ID**: `G-`ë¡??œì‘?˜ëŠ” ë¬¸ì??

---

## **7?¨ê³„: GitHub Actions ?¬ì‹¤??*

### **7-1. GitHub Actions ?˜ì´ì§€ ?‘ì†**
1. **??ë¸Œë¼?°ì? ???´ê¸°**
2. **?¤ìŒ URL ?…ë ¥:**
   ```
   https://github.com/jomigata/wiz-coco/actions
   ```
3. **Enter ?¤ë? ?ŒëŸ¬ ?‘ì†**

### **7-2. ?Œí¬?Œë¡œ???¬ì‹¤??*
1. **ìµœì‹  ?Œí¬?Œë¡œ???¤í–‰ ?•ì¸**
2. **"Re-run jobs" ë²„íŠ¼ ?´ë¦­**
3. **"Re-run all jobs" ?´ë¦­**

---

## **?”— ê´€??ë§í¬**

### **Firebase Console:**
- **General Settings**: https://console.firebase.google.com/project/wiz-coco/settings/general
- **Authentication**: https://console.firebase.google.com/project/wiz-coco/authentication
- **Firestore Database**: https://console.firebase.google.com/project/wiz-coco/firestore
- **Storage**: https://console.firebase.google.com/project/wiz-coco/storage
- **Hosting**: https://console.firebase.google.com/project/wiz-coco/hosting

### **GitHub:**
- **Secrets Settings**: https://github.com/jomigata/wiz-coco/settings/secrets/actions
- **Actions**: https://github.com/jomigata/wiz-coco/actions

### **ë°°í¬ ?•ì¸:**
- **ë©”ì¸ ?¬ì´??*: https://wiz-coco.web.app

---

## **?“ ë¬¸ì œ ?´ê²°**

### **ë¬¸ì œ 1: ?¤ì •ê°’ì´ ë³µì‚¬?˜ì? ?ŠìŒ**
**?´ê²°ë°©ë²•:**
1. ?¤ì •ê°’ì„ ?”ë¸”?´ë¦­?˜ì—¬ ?„ì²´ ? íƒ
2. Ctrl+Cë¡?ë³µì‚¬
3. ë©”ëª¨?¥ì— ë¶™ì—¬?£ê¸°

### **ë¬¸ì œ 2: ???±ì´ ë³´ì´ì§€ ?ŠìŒ**
**?´ê²°ë°©ë²•:**
1. Firebase Console?ì„œ "Add app" ??"Web" ?´ë¦­
2. ???±ë¡ ???¤ì •ê°’ë“¤ ?•ì¸

### **ë¬¸ì œ 3: ê°’ì´ ?¬ë°”ë¥´ì? ?ŠìŒ**
**?´ê²°ë°©ë²•:**
1. Firebase Console?ì„œ ?¤ì •ê°??¬í™•??
2. ë³µì‚¬??ê°’ì´ ?¬ë°”ë¥¸ì? ?•ì¸
3. GitHub Secrets?ì„œ ê°??¬ì„¤??

---

## **???„ë£Œ ì²´í¬ë¦¬ìŠ¤??*

- [ ] Firebase Console ?‘ì† ?„ë£Œ
- [ ] ?????¤ì • ?•ì¸ ?„ë£Œ
- [ ] API Key ë³µì‚¬ ?„ë£Œ
- [ ] Auth Domain ?•ì¸ ?„ë£Œ
- [ ] Project ID ?•ì¸ ?„ë£Œ
- [ ] Storage Bucket ?•ì¸ ?„ë£Œ
- [ ] Messaging Sender ID ë³µì‚¬ ?„ë£Œ
- [ ] App ID ë³µì‚¬ ?„ë£Œ
- [ ] Measurement ID ë³µì‚¬ ?„ë£Œ
- [ ] ë©”ëª¨?¥ì— ê°’ë“¤ ?€???„ë£Œ
- [ ] GitHub Secrets ?˜ì´ì§€ ?‘ì† ?„ë£Œ
- [ ] NEXT_PUBLIC_FIREBASE_API_KEY ?¤ì • ?„ë£Œ
- [ ] NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?¤ì • ?„ë£Œ
- [ ] NEXT_PUBLIC_FIREBASE_PROJECT_ID ?¤ì • ?„ë£Œ
- [ ] NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?¤ì • ?„ë£Œ
- [ ] NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?¤ì • ?„ë£Œ
- [ ] NEXT_PUBLIC_FIREBASE_APP_ID ?¤ì • ?„ë£Œ
- [ ] NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?¤ì • ?„ë£Œ
- [ ] GitHub Actions ?¬ì‹¤???„ë£Œ

---

## **?¯ ?±ê³µ ?•ì¸**

ëª¨ë“  ?¤ì •???„ë£Œ?˜ë©´:
1. **GitHub Actions?ì„œ ?±ê³µ ë©”ì‹œì§€ ?•ì¸**
2. **ë°°í¬ ?„ë£Œ ??https://wiz-coco.web.app ?‘ì†**
3. **?¬ì´?¸ê? ?•ìƒ?ìœ¼ë¡?ë¡œë“œ?˜ëŠ”ì§€ ?•ì¸**

**ì¶•í•˜?©ë‹ˆ?? Firebase ?´ë¼?´ì–¸???¤ì •???„ë£Œ?˜ì—ˆ?µë‹ˆ??** ?‰ 
# Firebase ?´ë¼?´ì–¸???¤ì • ?ì„¸ ê°€?´ë“œ

## ?š¨ **Firebase ?´ë¼?´ì–¸???¤ì • ?„ì „ ê°€?´ë“œ**

GitHub Actions?ì„œ Firebase ë°°í¬ë¥??„í•´ ?????¤ì •ê°’ë“¤??ë³µì‚¬?˜ì—¬ GitHub Secrets???¤ì •?˜ëŠ” ë°©ë²•???¨ê³„ë³„ë¡œ ?ì„¸???ˆë‚´?©ë‹ˆ??

---

## **1?¨ê³„: Firebase Console ?‘ì†**

### **1-1. ë¸Œë¼?°ì??ì„œ Firebase Console ?´ê¸°**
1. **ë¸Œë¼?°ì? ì£¼ì†Œì°½ì— ?¤ìŒ URL ?…ë ¥:**
   ```
   https://console.firebase.google.com/project/wiz-coco/settings/general
   ```
2. **Enter ?¤ë? ?ŒëŸ¬ ?‘ì†**

### **1-2. Firebase ê³„ì • ë¡œê·¸??*
1. **Google ê³„ì •?¼ë¡œ ë¡œê·¸??* (wiz-coco ?„ë¡œ?íŠ¸???‘ê·¼ ê¶Œí•œ???ˆëŠ” ê³„ì •)
2. **?„ë¡œ?íŠ¸ ? íƒ**: `wiz-coco` ?„ë¡œ?íŠ¸ê°€ ? íƒ?˜ì–´ ?ˆëŠ”ì§€ ?•ì¸

---

## **2?¨ê³„: ?????¤ì • ?•ì¸**

### **2-1. General ???•ì¸**
1. **?¼ìª½ ë©”ë‰´?ì„œ "Project settings" ?´ë¦­** (?±ë‹ˆë°”í€??„ì´ì½?
2. **"General" ??´ ? íƒ?˜ì–´ ?ˆëŠ”ì§€ ?•ì¸**

### **2-2. Your apps ?¹ì…˜ ?•ì¸**
1. **"Your apps" ?¹ì…˜??ì°¾ê¸°** (?˜ì´ì§€ ì¤‘ê°„ ë¶€ë¶?
2. **???±ì´ ?ˆëŠ”ì§€ ?•ì¸**

### **2-3. ???±ì´ ?†ëŠ” ê²½ìš° ?±ë¡**
ë§Œì•½ ???±ì´ ?†ë‹¤ë©?
1. **"Add app" ë²„íŠ¼ ?´ë¦­**
2. **"Web" ?„ì´ì½??´ë¦­** (</> ?„ì´ì½?
3. **???‰ë„¤???…ë ¥**: `wizcoco-web`
4. **"Register app" ?´ë¦­**
5. **"Continue to console" ?´ë¦­**

---

## **3?¨ê³„: ?????¤ì •ê°?ë³µì‚¬**

### **3-1. ?????¤ì • ?´ê¸°**
1. **"Your apps" ?¹ì…˜?ì„œ ?????´ë¦­**
2. **"Project settings" ?˜ì´ì§€?ì„œ ?????¤ì • ?•ì¸**

### **3-2. ?¤ì •ê°’ë“¤ ë³µì‚¬**
?????¤ì •?ì„œ ?¤ìŒ ê°’ë“¤???˜ë‚˜??ë³µì‚¬:

#### **3-2-1. API Key ë³µì‚¬**
1. **"API Key" ?¹ì…˜ ì°¾ê¸°**
2. **API Key ê°?ë³µì‚¬** (?? `AIzaSyC...`ë¡??œì‘?˜ëŠ” ê¸?ë¬¸ì??
3. **ë©”ëª¨?¥ì— ?„ì‹œ ?€??*

#### **3-2-2. Auth Domain ?•ì¸**
1. **"Auth Domain" ?¹ì…˜ ì°¾ê¸°**
2. **ê°??•ì¸**: `wiz-coco.firebaseapp.com`
3. **ë©”ëª¨?¥ì— ?€??*

#### **3-2-3. Project ID ?•ì¸**
1. **"Project ID" ?¹ì…˜ ì°¾ê¸°**
2. **ê°??•ì¸**: `wiz-coco`
3. **ë©”ëª¨?¥ì— ?€??*

#### **3-2-4. Storage Bucket ?•ì¸**
1. **"Storage Bucket" ?¹ì…˜ ì°¾ê¸°**
2. **ê°??•ì¸**: `wiz-coco.appspot.com`
3. **ë©”ëª¨?¥ì— ?€??*

#### **3-2-5. Messaging Sender ID ë³µì‚¬**
1. **"Messaging Sender ID" ?¹ì…˜ ì°¾ê¸°**
2. **?«ì ê°?ë³µì‚¬** (?? `123456789`)
3. **ë©”ëª¨?¥ì— ?€??*

#### **3-2-6. App ID ë³µì‚¬**
1. **"App ID" ?¹ì…˜ ì°¾ê¸°**
2. **App ID ê°?ë³µì‚¬** (?? `1:123456789:web:abcdef`)
3. **ë©”ëª¨?¥ì— ?€??*

#### **3-2-7. Measurement ID ë³µì‚¬**
1. **"Measurement ID" ?¹ì…˜ ì°¾ê¸°**
2. **Measurement ID ê°?ë³µì‚¬** (?? `G-XXXXXXXXXX`)
3. **ë©”ëª¨?¥ì— ?€??*

---

## **4?¨ê³„: GitHub Secrets ?¤ì •**

### **4-1. GitHub Secrets ?˜ì´ì§€ ?‘ì†**
1. **??ë¸Œë¼?°ì? ???´ê¸°**
2. **?¤ìŒ URL ?…ë ¥:**
   ```
   https://github.com/jomigata/wiz-coco/settings/secrets/actions
   ```
3. **Enter ?¤ë? ?ŒëŸ¬ ?‘ì†**

### **4-2. FIREBASE_API_KEY ?¤ì •**
1. **"New repository secret" ë²„íŠ¼ ?´ë¦­**
2. **Name ?…ë ¥**: `NEXT_PUBLIC_FIREBASE_API_KEY`
3. **Value ?…ë ¥**: ë©”ëª¨?¥ì—??ë³µì‚¬??API Key ë¶™ì—¬?£ê¸°
4. **"Add secret" ?´ë¦­**

### **4-3. FIREBASE_AUTH_DOMAIN ?¤ì •**
1. **"New repository secret" ë²„íŠ¼ ?´ë¦­**
2. **Name ?…ë ¥**: `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
3. **Value ?…ë ¥**: `wiz-coco.firebaseapp.com`
4. **"Add secret" ?´ë¦­**

### **4-4. FIREBASE_PROJECT_ID ?¤ì •**
1. **"New repository secret" ë²„íŠ¼ ?´ë¦­**
2. **Name ?…ë ¥**: `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
3. **Value ?…ë ¥**: `wiz-coco`
4. **"Add secret" ?´ë¦­**

### **4-5. FIREBASE_STORAGE_BUCKET ?¤ì •**
1. **"New repository secret" ë²„íŠ¼ ?´ë¦­**
2. **Name ?…ë ¥**: `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
3. **Value ?…ë ¥**: `wiz-coco.appspot.com`
4. **"Add secret" ?´ë¦­**

### **4-6. FIREBASE_MESSAGING_SENDER_ID ?¤ì •**
1. **"New repository secret" ë²„íŠ¼ ?´ë¦­**
2. **Name ?…ë ¥**: `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
3. **Value ?…ë ¥**: ë©”ëª¨?¥ì—??ë³µì‚¬??Messaging Sender ID ë¶™ì—¬?£ê¸°
4. **"Add secret" ?´ë¦­**

### **4-7. FIREBASE_APP_ID ?¤ì •**
1. **"New repository secret" ë²„íŠ¼ ?´ë¦­**
2. **Name ?…ë ¥**: `NEXT_PUBLIC_FIREBASE_APP_ID`
3. **Value ?…ë ¥**: ë©”ëª¨?¥ì—??ë³µì‚¬??App ID ë¶™ì—¬?£ê¸°
4. **"Add secret" ?´ë¦­**

### **4-8. FIREBASE_MEASUREMENT_ID ?¤ì •**
1. **"New repository secret" ë²„íŠ¼ ?´ë¦­**
2. **Name ?…ë ¥**: `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`
3. **Value ?…ë ¥**: ë©”ëª¨?¥ì—??ë³µì‚¬??Measurement ID ë¶™ì—¬?£ê¸°
4. **"Add secret" ?´ë¦­**

---

## **5?¨ê³„: ?¤ì • ?•ì¸**

### **5-1. GitHub Secrets ëª©ë¡ ?•ì¸**
GitHub Secrets ?˜ì´ì§€?ì„œ ?¤ìŒ ??ª©?¤ì´ ëª¨ë‘ ?¤ì •?˜ì—ˆ?”ì? ?•ì¸:

- ??`NEXT_PUBLIC_FIREBASE_API_KEY`
- ??`NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- ??`NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- ??`NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- ??`NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- ??`NEXT_PUBLIC_FIREBASE_APP_ID`
- ??`NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

### **5-2. ê°?ê²€ì¦?*
ê°??¤ì •ê°’ì´ ?¬ë°”ë¥¸ì? ?•ì¸:
- **API Key**: `AIzaSyC...`ë¡??œì‘?˜ëŠ” ê¸?ë¬¸ì??
- **Auth Domain**: `wiz-coco.firebaseapp.com`
- **Project ID**: `wiz-coco`
- **Storage Bucket**: `wiz-coco.appspot.com`
- **Messaging Sender ID**: ?«ìë§Œìœ¼ë¡?êµ¬ì„±
- **App ID**: `1:?«ì:web:ë¬¸ì?? ?•ì‹
- **Measurement ID**: `G-`ë¡??œì‘?˜ëŠ” ë¬¸ì??

---

## **6?¨ê³„: GitHub Actions ?¬ì‹¤??*

### **6-1. GitHub Actions ?˜ì´ì§€ ?‘ì†**
1. **??ë¸Œë¼?°ì? ???´ê¸°**
2. **?¤ìŒ URL ?…ë ¥:**
   ```
   https://github.com/jomigata/wiz-coco/actions
   ```
3. **Enter ?¤ë? ?ŒëŸ¬ ?‘ì†**

### **6-2. ?Œí¬?Œë¡œ???¬ì‹¤??*
1. **ìµœì‹  ?Œí¬?Œë¡œ???¤í–‰ ?•ì¸**
2. **"Re-run jobs" ë²„íŠ¼ ?´ë¦­**
3. **"Re-run all jobs" ?´ë¦­**

---

## **?”— ê´€??ë§í¬**

### **Firebase Console:**
- **General Settings**: https://console.firebase.google.com/project/wiz-coco/settings/general
- **Authentication**: https://console.firebase.google.com/project/wiz-coco/authentication
- **Firestore Database**: https://console.firebase.google.com/project/wiz-coco/firestore
- **Storage**: https://console.firebase.google.com/project/wiz-coco/storage
- **Hosting**: https://console.firebase.google.com/project/wiz-coco/hosting

### **GitHub:**
- **Secrets Settings**: https://github.com/jomigata/wiz-coco/settings/secrets/actions
- **Actions**: https://github.com/jomigata/wiz-coco/actions

### **ë°°í¬ ?•ì¸:**
- **ë©”ì¸ ?¬ì´??*: https://wiz-coco.web.app

---

## **?“ ë¬¸ì œ ?´ê²°**

### **ë¬¸ì œ 1: ???±ì´ ë³´ì´ì§€ ?ŠìŒ**
**?´ê²°ë°©ë²•:**
1. Firebase Console?ì„œ "Add app" ??"Web" ?´ë¦­
2. ???±ë¡ ???¤ì •ê°’ë“¤ ?•ì¸

### **ë¬¸ì œ 2: ?¤ì •ê°’ì´ ë³µì‚¬?˜ì? ?ŠìŒ**
**?´ê²°ë°©ë²•:**
1. ?¤ì •ê°’ì„ ?”ë¸”?´ë¦­?˜ì—¬ ?„ì²´ ? íƒ
2. Ctrl+Cë¡?ë³µì‚¬
3. ë©”ëª¨?¥ì— ë¶™ì—¬?£ê¸°

### **ë¬¸ì œ 3: GitHub Secrets???¤ì •???ˆë¨**
**?´ê²°ë°©ë²•:**
1. GitHub ?€?¥ì†Œ???‘ê·¼ ê¶Œí•œ ?•ì¸
2. Settings ??Secrets and variables ??Actions ?‘ê·¼ ê¶Œí•œ ?•ì¸
3. ?¤ì‹œ ?œë„

### **ë¬¸ì œ 4: ê°’ì´ ?¬ë°”ë¥´ì? ?ŠìŒ**
**?´ê²°ë°©ë²•:**
1. Firebase Console?ì„œ ?¤ì •ê°??¬í™•??
2. ë³µì‚¬??ê°’ì´ ?¬ë°”ë¥¸ì? ?•ì¸
3. GitHub Secrets?ì„œ ê°??¬ì„¤??

---

## **???„ë£Œ ì²´í¬ë¦¬ìŠ¤??*

- [ ] Firebase Console ?‘ì† ?„ë£Œ
- [ ] ?????¤ì • ?•ì¸ ?„ë£Œ
- [ ] API Key ë³µì‚¬ ?„ë£Œ
- [ ] Auth Domain ?•ì¸ ?„ë£Œ
- [ ] Project ID ?•ì¸ ?„ë£Œ
- [ ] Storage Bucket ?•ì¸ ?„ë£Œ
- [ ] Messaging Sender ID ë³µì‚¬ ?„ë£Œ
- [ ] App ID ë³µì‚¬ ?„ë£Œ
- [ ] Measurement ID ë³µì‚¬ ?„ë£Œ
- [ ] GitHub Secrets ?˜ì´ì§€ ?‘ì† ?„ë£Œ
- [ ] NEXT_PUBLIC_FIREBASE_API_KEY ?¤ì • ?„ë£Œ
- [ ] NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?¤ì • ?„ë£Œ
- [ ] NEXT_PUBLIC_FIREBASE_PROJECT_ID ?¤ì • ?„ë£Œ
- [ ] NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?¤ì • ?„ë£Œ
- [ ] NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?¤ì • ?„ë£Œ
- [ ] NEXT_PUBLIC_FIREBASE_APP_ID ?¤ì • ?„ë£Œ
- [ ] NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?¤ì • ?„ë£Œ
- [ ] GitHub Actions ?¬ì‹¤???„ë£Œ

---

## **?¯ ?±ê³µ ?•ì¸**

ëª¨ë“  ?¤ì •???„ë£Œ?˜ë©´:
1. **GitHub Actions?ì„œ ?±ê³µ ë©”ì‹œì§€ ?•ì¸**
2. **ë°°í¬ ?„ë£Œ ??https://wiz-coco.web.app ?‘ì†**
3. **?¬ì´?¸ê? ?•ìƒ?ìœ¼ë¡?ë¡œë“œ?˜ëŠ”ì§€ ?•ì¸**

**ì¶•í•˜?©ë‹ˆ?? Firebase ?´ë¼?´ì–¸???¤ì •???„ë£Œ?˜ì—ˆ?µë‹ˆ??** ?‰ 
# Firebase ?´ë¼?´ì–¸???¤ì • ê°€?´ë“œ

## ?š¨ **Firebase ?´ë¼?´ì–¸???¤ì •???„ìš”?©ë‹ˆ??**

GitHub Actions?ì„œ Firebase ?´ë¼?´ì–¸???¤ì •ê°’ë“¤???„ìš”?©ë‹ˆ??

## **1?¨ê³„: Firebase Console ?‘ì†**

1. https://console.firebase.google.com/project/wiz-coco/settings/general ?‘ì†
2. Firebase ?„ë¡œ?íŠ¸ `wiz-coco` ? íƒ

## **2?¨ê³„: ?????¤ì • ?•ì¸**

1. **"General" ??—??"Your apps" ?¹ì…˜ ?•ì¸**
2. **???±ì´ ?†ë‹¤ë©?"Add app" ??"Web" ?´ë¦­**
3. **???±ë¡ ???¤ì •ê°’ë“¤ ?•ì¸**

## **3?¨ê³„: ?¤ì •ê°’ë“¤ ë³µì‚¬**

?????¤ì •?ì„œ ?¤ìŒ ê°’ë“¤??ë³µì‚¬:

### **?„ìˆ˜ ?¤ì •ê°’ë“¤:**

| GitHub Secret Name | Firebase Console?ì„œ ë³µì‚¬??ê°?| ?ˆì‹œ |
|-------------------|-------------------------------|------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | API Key | `AIzaSyC...` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Auth Domain | `wiz-coco.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Project ID | `wiz-coco` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Storage Bucket | `wiz-coco.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Messaging Sender ID | `123456789` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | App ID | `1:123456789:web:abcdef` |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Measurement ID | `G-XXXXXXXXXX` |

## **4?¨ê³„: GitHub Secrets???¤ì •**

ê°??¤ì •ê°’ì„ ê°œë³„?ìœ¼ë¡?GitHub Secrets???¤ì •:

### **4-1. NEXT_PUBLIC_FIREBASE_API_KEY**
1. GitHub Secrets ?˜ì´ì§€ ?‘ì†: https://github.com/jomigata/wiz-coco/settings/secrets/actions
2. "New repository secret" ?´ë¦­
3. **Name**: `NEXT_PUBLIC_FIREBASE_API_KEY`
4. **Value**: Firebase Console?ì„œ ë³µì‚¬??API Key
5. "Add secret" ?´ë¦­

### **4-2. NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN**
1. "New repository secret" ?´ë¦­
2. **Name**: `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
3. **Value**: `wiz-coco.firebaseapp.com`
4. "Add secret" ?´ë¦­

### **4-3. NEXT_PUBLIC_FIREBASE_PROJECT_ID**
1. "New repository secret" ?´ë¦­
2. **Name**: `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
3. **Value**: `wiz-coco`
4. "Add secret" ?´ë¦­

### **4-4. NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET**
1. "New repository secret" ?´ë¦­
2. **Name**: `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
3. **Value**: `wiz-coco.appspot.com`
4. "Add secret" ?´ë¦­

### **4-5. NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID**
1. "New repository secret" ?´ë¦­
2. **Name**: `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
3. **Value**: Firebase Console?ì„œ ë³µì‚¬??Messaging Sender ID
4. "Add secret" ?´ë¦­

### **4-6. NEXT_PUBLIC_FIREBASE_APP_ID**
1. "New repository secret" ?´ë¦­
2. **Name**: `NEXT_PUBLIC_FIREBASE_APP_ID`
3. **Value**: Firebase Console?ì„œ ë³µì‚¬??App ID
4. "Add secret" ?´ë¦­

### **4-7. NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID**
1. "New repository secret" ?´ë¦­
2. **Name**: `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`
3. **Value**: Firebase Console?ì„œ ë³µì‚¬??Measurement ID
4. "Add secret" ?´ë¦­

## **5?¨ê³„: ?¤ì • ?•ì¸**

GitHub Secrets ëª©ë¡?ì„œ ?¤ìŒ ??ª©?¤ì´ ëª¨ë‘ ?¤ì •?˜ì—ˆ?”ì? ?•ì¸:

- ??`NEXT_PUBLIC_FIREBASE_API_KEY`
- ??`NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- ??`NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- ??`NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- ??`NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- ??`NEXT_PUBLIC_FIREBASE_APP_ID`
- ??`NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

## **6?¨ê³„: Firebase ?œë¹„???œì„±??*

Firebase Console?ì„œ ?¤ìŒ ?œë¹„?¤ë“¤???œì„±?”ë˜???ˆëŠ”ì§€ ?•ì¸:

1. **Authentication**: https://console.firebase.google.com/project/wiz-coco/authentication
2. **Firestore Database**: https://console.firebase.google.com/project/wiz-coco/firestore
3. **Storage**: https://console.firebase.google.com/project/wiz-coco/storage
4. **Hosting**: https://console.firebase.google.com/project/wiz-coco/hosting

## **?”— ê´€??ë§í¬**

- **Firebase Console**: https://console.firebase.google.com/project/wiz-coco/settings/general
- **GitHub Secrets**: https://github.com/jomigata/wiz-coco/settings/secrets/actions
- **GitHub Actions**: https://github.com/jomigata/wiz-coco/actions

## **?“ ë¬¸ì œ ?´ê²°**

ë§Œì•½ ë¬¸ì œê°€ ë°œìƒ?˜ë©´:
1. Firebase Console?ì„œ ???±ì´ ?¬ë°”ë¥´ê²Œ ?±ë¡?˜ì—ˆ?”ì? ?•ì¸
2. ëª¨ë“  ?¤ì •ê°’ì´ ?¬ë°”ë¥´ê²Œ ë³µì‚¬?˜ì—ˆ?”ì? ?•ì¸
3. GitHub Secrets??ê°’ì´ ?¬ë°”ë¥´ê²Œ ?¤ì •?˜ì—ˆ?”ì? ?•ì¸
4. Firebase ?„ë¡œ?íŠ¸ IDê°€ `wiz-coco`?¸ì? ?•ì¸ 
# Firebase ì§ì ‘ ë°°í¬ ê°€?´ë“œ

## ?? **Firebase ì§ì ‘ ë°°í¬ ë°©ë²•**

GitHub Actions ?†ì´ Firebase CLIë¥??¬ìš©?˜ì—¬ ì§ì ‘ ë°°í¬?˜ëŠ” ë°©ë²•???ˆë‚´?©ë‹ˆ??

---

## **1?¨ê³„: Firebase CLI ?¤ì¹˜ ë°??¤ì •**

### **1-1. Firebase CLI ?¤ì¹˜**
```bash
npm install -g firebase-tools
```

### **1-2. Firebase ë¡œê·¸??*
```bash
firebase login
```

### **1-3. ?„ë¡œ?íŠ¸ ?•ì¸**
```bash
firebase projects:list
firebase use wiz-coco
```

---

## **2?¨ê³„: ë°°í¬ ë°©ë²•**

### **2-1. ê¸°ë³¸ ë°°í¬ ëª…ë ¹??*
```bash
# ë¹Œë“œ ??ë°°í¬
npm run build
firebase deploy --only hosting
```

### **2-2. package.json ?¤í¬ë¦½íŠ¸ ?¬ìš©**
```bash
# Firebase Hostingë§?ë°°í¬
npm run deploy:firebase

# ê°•ì œ ë°°í¬ (ìºì‹œ ë¬´ì‹œ)
npm run deploy:quick
```

### **2-3. ë°°ì¹˜ ?Œì¼ ?¬ìš© (Windows)**
```bash
# deploy-firebase.bat ?¤í–‰
deploy-firebase.bat
```

---

## **3?¨ê³„: ë°°í¬ ???•ì¸?¬í•­**

### **3-1. ?˜ê²½ ë³€???¤ì •**
`.env.local` ?Œì¼??Firebase ?¤ì • ?•ì¸:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=wiz-coco.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=wiz-coco
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=wiz-coco.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

### **3-2. Firebase ?¤ì • ?•ì¸**
`firebase.json` ?Œì¼ ?•ì¸:
```json
{
  "hosting": {
    "public": ".next",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

---

## **4?¨ê³„: ë°°í¬ ê³¼ì •**

### **4-1. ë¹Œë“œ**
```bash
npm run build
```

### **4-2. ë°°í¬**
```bash
firebase deploy --only hosting
```

### **4-3. ë°°í¬ ?•ì¸**
- **ë°°í¬ URL**: https://wiz-coco.web.app
- **Firebase Console**: https://console.firebase.google.com/project/wiz-coco/hosting

---

## **5?¨ê³„: ë¡œì»¬ ?ŒìŠ¤??*

### **5-1. ë¡œì»¬ ?œë²„ ?¤í–‰**
```bash
firebase serve
```

### **5-2. ë¹Œë“œ???Œì¼ ë¡œì»¬ ?ŒìŠ¤??*
```bash
npm run build
firebase serve --only hosting
```

---

## **?¯ ?¥ì **

### **1. ?¨ìˆœ??*
- ë³µì¡??CI/CD ?¤ì • ë¶ˆí•„??
- ì¦‰ì‹œ ë°°í¬ ê°€??
- ?™ìŠµ ê³¡ì„  ??Œ

### **2. ë¹ ë¥¸ ë°°í¬**
- CI/CD ?¤ë²„?¤ë“œ ?†ìŒ
- ì§ì ‘ ?œì–´ ê°€??
- ì¦‰ì‹œ ë°˜ì˜

### **3. ë¹„ìš© ?¨ìœ¨??*
- Firebase Hosting ë¬´ë£Œ ?Œëœ
- GitHub Actions ?¬ìš©???œí•œ ?†ìŒ
- ?ˆì¸¡ ê°€?¥í•œ ë¹„ìš©

### **4. ê°œë°œ ?¸ì˜??*
- ë¡œì»¬ ?ŒìŠ¤???©ì´
- ?˜ê²½ ë³€??ê´€ë¦?ê°„ë‹¨
- ?”ë²„ê¹??¬ì?

---

## **? ï¸ ?¨ì **

### **1. ?ë™??ë¶€ì¡?*
- ?˜ë™ ë°°í¬ ?„ìš”
- ?ë™ ?ŒìŠ¤???†ìŒ
- ë¡¤ë°± ë³µì¡

### **2. ?‘ì—… ?œí•œ**
- ë²„ì „ ê´€ë¦??´ë ¤?€
- ë°°í¬ ?´ë ¥ ì¶”ì  ?´ë ¤?€
- ì½”ë“œ ë¦¬ë·° ë¶€??

### **3. ?ˆì •??ë¬¸ì œ**
- ?¸ì  ?¤ë¥˜ ê°€?¥ì„±
- ?˜ê²½ ì°¨ì´ë¡??¸í•œ ë¬¸ì œ
- ë°±ì—… ?œìŠ¤??ë¶€ì¡?

### **4. ?•ì¥???œí•œ**
- ?€ê·œëª¨ ?€ ë¶€?í•©
- ë³µì¡???Œí¬?Œë¡œ???´ë ¤?€
- ëª¨ë‹ˆ?°ë§ ë¶€ì¡?

---

## **?”„ ê¶Œì¥ ?¬ìš© ?œë‚˜ë¦¬ì˜¤**

### **ê°œë°œ ?¨ê³„**
- ë¹ ë¥¸ ?„ë¡œ? í??´í•‘
- ê°œì¸ ?„ë¡œ?íŠ¸
- ?Œê·œëª??€

### **?„ë¡œ?•ì…˜ ?˜ê²½**
- GitHub Actions ? ì? ê¶Œì¥
- ?ˆì •?±ê³¼ ?ë™??ì¤‘ìš”
- ?€ ?‘ì—… ?„ìš”

---

## **?“‹ ë°°í¬ ì²´í¬ë¦¬ìŠ¤??*

### **ë°°í¬ ??*
- [ ] ì½”ë“œ ?ŒìŠ¤???„ë£Œ
- [ ] ?˜ê²½ ë³€???¤ì • ?•ì¸
- [ ] ë¹Œë“œ ?±ê³µ ?•ì¸
- [ ] ë¡œì»¬ ?ŒìŠ¤???„ë£Œ

### **ë°°í¬ ì¤?*
- [ ] ë¹Œë“œ ê³¼ì • ëª¨ë‹ˆ?°ë§
- [ ] ë°°í¬ ë¡œê·¸ ?•ì¸
- [ ] ?¤ë¥˜ ë©”ì‹œì§€ ?•ì¸

### **ë°°í¬ ??*
- [ ] ?¬ì´???‘ì† ?•ì¸
- [ ] ì£¼ìš” ê¸°ëŠ¥ ?ŒìŠ¤??
- [ ] ?±ëŠ¥ ?•ì¸
- [ ] ?¤ë¥˜ ë¡œê·¸ ?•ì¸

---

## **?”— ê´€??ë§í¬**

### **Firebase Console:**
- **Hosting**: https://console.firebase.google.com/project/wiz-coco/hosting
- **General Settings**: https://console.firebase.google.com/project/wiz-coco/settings/general

### **ë°°í¬ ?•ì¸:**
- **ë©”ì¸ ?¬ì´??*: https://wiz-coco.web.app

---

## **?“ ë¬¸ì œ ?´ê²°**

### **ë¬¸ì œ 1: Firebase CLI ë¡œê·¸???¤íŒ¨**
**?´ê²°ë°©ë²•:**
1. `firebase logout` ?¤í–‰
2. `firebase login` ?¤ì‹œ ?¤í–‰
3. ë¸Œë¼?°ì??ì„œ ê¶Œí•œ ?•ì¸

### **ë¬¸ì œ 2: ë¹Œë“œ ?¤íŒ¨**
**?´ê²°ë°©ë²•:**
1. `npm install` ?¤í–‰
2. ?˜ê²½ ë³€???•ì¸
3. `npm run build` ë¡œì»¬ ?ŒìŠ¤??

### **ë¬¸ì œ 3: ë°°í¬ ?¤íŒ¨**
**?´ê²°ë°©ë²•:**
1. Firebase ?„ë¡œ?íŠ¸ ?•ì¸: `firebase use wiz-coco`
2. ê¶Œí•œ ?•ì¸: Firebase Console?ì„œ ê¶Œí•œ ?•ì¸
3. ìºì‹œ ?´ë¦¬?? `firebase deploy --force`

---

## **???„ë£Œ ?•ì¸**

ë°°í¬ê°€ ?±ê³µ?˜ë©´:
1. **Firebase Console?ì„œ ë°°í¬ ?íƒœ ?•ì¸**
2. **https://wiz-coco.web.app ?‘ì† ?•ì¸**
3. **ì£¼ìš” ê¸°ëŠ¥ ?ŒìŠ¤???„ë£Œ**

**ì¶•í•˜?©ë‹ˆ?? Firebase ì§ì ‘ ë°°í¬ê°€ ?„ë£Œ?˜ì—ˆ?µë‹ˆ??** ?‰ 
# Firebase Service Account ?¤ì • ê°€?´ë“œ

## ?š¨ **FIREBASE_SERVICE_ACCOUNT ?¤ì •???„ìš”?©ë‹ˆ??**

GitHub Actions?ì„œ Firebase ë°°í¬ë¥??„í•´ ?œë¹„??ê³„ì • ?¤ê? ?„ìš”?©ë‹ˆ??

## **1?¨ê³„: Firebase Console ?‘ì†**

1. https://console.firebase.google.com/project/wiz-coco/settings/serviceaccounts/adminsdk ?‘ì†
2. Firebase ?„ë¡œ?íŠ¸ `wiz-coco` ? íƒ

## **2?¨ê³„: ?œë¹„??ê³„ì • ???ì„±**

1. **"Service accounts" ???´ë¦­**
2. **"Firebase Admin SDK" ?¹ì…˜ ?•ì¸**
3. **"Generate new private key" ë²„íŠ¼ ?´ë¦­**
4. **ê²½ê³  ë©”ì‹œì§€ ?•ì¸ ??"Generate key" ?´ë¦­**
5. **JSON ?Œì¼???ë™?¼ë¡œ ?¤ìš´ë¡œë“œ??*

## **3?¨ê³„: ?¤ìš´ë¡œë“œ??JSON ?Œì¼ ?•ì¸**

?¤ìš´ë¡œë“œ???Œì¼ëª? `wiz-coco-firebase-adminsdk-xxxxx-xxxxxxxxxx.json`

?Œì¼ ?´ìš© ?ˆì‹œ:
```json
{
  "type": "service_account",
  "project_id": "wiz-coco",
  "private_key_id": "69c4c2375c4522bf1631300a09c1001bbbcc802a",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDAg9auBAd9rZs+\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@wiz-coco.iam.gserviceaccount.com",
  "client_id": "114963538509418531170",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40wiz-coco.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}
```

## **4?¨ê³„: GitHub Secrets???¤ì •**

1. **GitHub ?€?¥ì†Œ ?‘ì†**: https://github.com/jomigata/wiz-coco/settings/secrets/actions
2. **"New repository secret" ?´ë¦­**
3. **Name ?…ë ¥**: `FIREBASE_SERVICE_ACCOUNT`
4. **Value ?…ë ¥**: ?¤ìš´ë¡œë“œ??JSON ?Œì¼??**?„ì²´ ?´ìš©**??ë³µì‚¬?˜ì—¬ ë¶™ì—¬?£ê¸°
5. **"Add secret" ?´ë¦­**

## **? ï¸ ì¤‘ìš” ?¬í•­**

- **JSON ?„ì²´ ?´ìš©??ë³µì‚¬**: `{` ë¶€??`}` ê¹Œì? ëª¨ë“  ?´ìš©
- **ì¤„ë°”ê¿?? ì?**: JSON ?•ì‹??ê¹¨ì?ì§€ ?Šë„ë¡?ì£¼ì˜
- **ë³´ì•ˆ ? ì?**: ???Œì¼?€ ?ˆë? ê³µê°œ?˜ì? ?Šë„ë¡?ì£¼ì˜
- **ë°±ì—…**: ë¡œì»¬???ˆì „??ê³³ì— ë°±ì—… ë³´ê?

## **5?¨ê³„: ?¤ì • ?•ì¸**

1. GitHub Secrets ëª©ë¡?ì„œ `FIREBASE_SERVICE_ACCOUNT` ?•ì¸
2. ê°’ì´ ?¬ë°”ë¥´ê²Œ ?¤ì •?˜ì—ˆ?”ì? ?•ì¸
3. GitHub Actions ?¬ì‹¤??

## **?”— ê´€??ë§í¬**

- **Firebase Console**: https://console.firebase.google.com/project/wiz-coco/settings/serviceaccounts/adminsdk
- **GitHub Secrets**: https://github.com/jomigata/wiz-coco/settings/secrets/actions
- **GitHub Actions**: https://github.com/jomigata/wiz-coco/actions

## **?“ ë¬¸ì œ ?´ê²°**

ë§Œì•½ ë¬¸ì œê°€ ë°œìƒ?˜ë©´:
1. JSON ?Œì¼???¬ë°”ë¥??•ì‹?¸ì? ?•ì¸
2. GitHub Secrets???„ì²´ ?´ìš©??ë³µì‚¬?˜ì—ˆ?”ì? ?•ì¸
3. Firebase ?„ë¡œ?íŠ¸ IDê°€ `wiz-coco`?¸ì? ?•ì¸ 
# ?? GitHub Actions ?¤í–‰ ?íƒœ ë°??¤ìŒ ?¨ê³„

## ??**ì½”ë“œ ?¸ì‹œ ?„ë£Œ**

**GitHub???±ê³µ?ìœ¼ë¡??¸ì‹œ?˜ì—ˆ?µë‹ˆ??**
- **ì»¤ë°‹**: `059aa9d` - ?? ë°°í¬ ?±ê³µ ë°?GitHub Actions ?ë™ ë°°í¬ ?¤ì • ê°€?´ë“œ ì¶”ê?
- **ë¸Œëœì¹?*: main
- **?¸ì‹œ ?œê°„**: 2025??1??27??

---

## ?”„ **GitHub Actions ?¤í–‰ ?íƒœ**

### **?ˆìƒ?˜ëŠ” ?¤í–‰ ?¨ê³„:**
1. **ì½”ë“œ ?ˆì§ˆ ê²€??* - ???±ê³µ ?ˆìƒ
2. **?ŒìŠ¤???¤í–‰** - ???±ê³µ ?ˆìƒ  
3. **ë¹Œë“œ ë°?ìµœì ??* - ? ï¸ Firebase ?˜ê²½ë³€???„ë½?¼ë¡œ ?¤íŒ¨ ê°€?¥ì„±
4. **ë³´ì•ˆ ê²€??* - ???±ê³µ ?ˆìƒ
5. **Firebase ë°°í¬** - ??GitHub Secrets ë¯¸ì„¤?•ìœ¼ë¡??¤íŒ¨ ?ˆìƒ

### **?¤íŒ¨ ?ˆìƒ ?ì¸:**
- `FIREBASE_TOKEN` ë¯¸ì„¤??
- `FIREBASE_SERVICE_ACCOUNT` ë¯¸ì„¤??
- Firebase ?´ë¼?´ì–¸???¤ì •ê°’ë“¤ ë¯¸ì„¤??

---

## ?š¨ **ì¦‰ì‹œ ?´ê²°?´ì•¼ ???‘ì—…**

### **1?¨ê³„: GitHub Actions ë¡œê·¸ ?•ì¸**
1. **GitHub Actions ?˜ì´ì§€ ?‘ì†**
   - https://github.com/jomigata/wiz-coco/actions

2. **ìµœì‹  ?Œí¬?Œë¡œ???¤í–‰ ?•ì¸**
   - "?? WizCoCo CI/CD Pipeline" ?´ë¦­
   - ?¤í–‰ ?íƒœ ë°?ë¡œê·¸ ?•ì¸

### **2?¨ê³„: GitHub Secrets ?¤ì • (?„ìˆ˜)**

#### **2-1. FIREBASE_TOKEN ?¤ì •**
1. **GitHub Secrets ?˜ì´ì§€ ?‘ì†**
   - https://github.com/jomigata/wiz-coco/settings/secrets/actions

2. **"New repository secret" ?´ë¦­**

3. **?¤ì •ê°??…ë ¥**
   - **Name**: `FIREBASE_TOKEN`
   - **Value**: `1//0gIbt4IPPkWKqCgYIARAAGBASNwF-L9IrVkWghw8QRx7D-vOUfoMg0q9qIEzr4WEtg_cxwJiaCy5z`
   - **"Add secret" ?´ë¦­**

#### **2-2. FIREBASE_SERVICE_ACCOUNT ?¤ì •**
1. **JSON ?Œì¼ ?´ìš© ë³µì‚¬**
   - `d:\Capture\wiz-coco-firebase-adminsdk-fbsvc-c153fcc55d.json` ?Œì¼ ?´ê¸°
   - ?„ì²´ ?´ìš©??Ctrl+Aë¡?? íƒ ??Ctrl+Cë¡?ë³µì‚¬

2. **GitHub Secrets???¤ì •**
   - **Name**: `FIREBASE_SERVICE_ACCOUNT`
   - **Value**: ë³µì‚¬??JSON ?„ì²´ ?´ìš© ë¶™ì—¬?£ê¸°
   - **"Add secret" ?´ë¦­**

#### **2-3. Firebase ?´ë¼?´ì–¸???¤ì •**
Firebase Console?ì„œ ?¤ìŒ ê°’ë“¤??ë³µì‚¬?˜ì—¬ ?¤ì •:

| GitHub Secret Name | Firebase Console?ì„œ ë³µì‚¬??ê°?|
|-------------------|-------------------------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `wiz-coco.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `wiz-coco` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `wiz-coco.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Messaging Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | App ID |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Measurement ID |

### **3?¨ê³„: GitHub Actions ?¬ì‹¤??*
1. **GitHub Actions ?˜ì´ì§€?ì„œ "Re-run jobs" ?´ë¦­**
2. **"Re-run all jobs" ?´ë¦­**

---

## ?“Š **?„ì¬ ?íƒœ ?”ì•½**

### **???„ë£Œ???‘ì—…**
- [x] ì½”ë“œ ?¸ì‹œ ?„ë£Œ
- [x] GitHub Actions ?¸ë¦¬ê±°ë¨
- [x] ë¡œì»¬ ë°°í¬ ?±ê³µ
- [x] ?¤ì • ê°€?´ë“œ ë¬¸ì„œ ?ì„±

### **? ï¸ ì§„í–‰ ì¤‘ì¸ ?‘ì—…**
- [ ] GitHub Actions ?¤í–‰ ?íƒœ ?•ì¸
- [ ] GitHub Secrets ?¤ì •
- [ ] ?ë™ ë°°í¬ ?±ê³µ ?•ì¸

### **???ˆìƒ ?¤íŒ¨ ?ì¸**
- [ ] FIREBASE_TOKEN ë¯¸ì„¤??
- [ ] FIREBASE_SERVICE_ACCOUNT ë¯¸ì„¤??
- [ ] Firebase ?´ë¼?´ì–¸???¤ì •ê°’ë“¤ ë¯¸ì„¤??

---

## ?”— **ê´€??ë§í¬**

### **GitHub:**
- **Actions**: https://github.com/jomigata/wiz-coco/actions
- **Secrets Settings**: https://github.com/jomigata/wiz-coco/settings/secrets/actions

### **Firebase Console:**
- **General Settings**: https://console.firebase.google.com/project/wiz-coco/settings/general
- **Service Account**: https://console.firebase.google.com/project/wiz-coco/settings/serviceaccounts/adminsdk

### **ë°°í¬ ?•ì¸:**
- **ë©”ì¸ ?¬ì´??*: https://wiz-coco.web.app

---

## ?“ **ë¬¸ì œ ?´ê²°**

### **ë¬¸ì œ 1: GitHub Actionsê°€ ?¤í–‰?˜ì? ?ŠìŒ**
**?´ê²°ë°©ë²•:**
1. GitHub ?€?¥ì†Œ ê¶Œí•œ ?•ì¸
2. ?Œí¬?Œë¡œ???Œì¼ ?•ì¸
3. ë¸Œëœì¹??´ë¦„ ?•ì¸ (main ?ëŠ” master)

### **ë¬¸ì œ 2: ë¹Œë“œ ?¨ê³„?ì„œ ?¤íŒ¨**
**?´ê²°ë°©ë²•:**
1. Firebase ?˜ê²½ë³€???¤ì • ?•ì¸
2. ë¡œì»¬?ì„œ ë¹Œë“œ ?ŒìŠ¤??
3. ?ëŸ¬ ë¡œê·¸ ?•ì¸

### **ë¬¸ì œ 3: ë°°í¬ ?¨ê³„?ì„œ ?¤íŒ¨**
**?´ê²°ë°©ë²•:**
1. GitHub Secrets ?¤ì • ?•ì¸
2. Firebase ? í° ? íš¨???•ì¸
3. Firebase ?„ë¡œ?íŠ¸ ê¶Œí•œ ?•ì¸

---

## ?¯ **?ˆìƒ ê²°ê³¼**

GitHub Secrets ?¤ì • ?„ë£Œ ??
1. **GitHub Actionsê°€ ?±ê³µ?ìœ¼ë¡??¤í–‰??*
2. **Firebase Hosting???ë™ ë°°í¬??*
3. **https://wiz-coco.web.app ?ì„œ ìµœì‹  ë²„ì „ ?•ì¸ ê°€??*

---

## ?“… **?…ë°?´íŠ¸ ?¼ì‹œ**

- **ì½”ë“œ ?¸ì‹œ**: 2025??1??27??
- **GitHub Actions ?¸ë¦¬ê±?*: 2025??1??27??
- **?ˆìƒ ?„ë£Œ**: GitHub Secrets ?¤ì • ??
- **?´ë‹¹??*: AI ?´ì‹œ?¤í„´??
# ?”§ GitHub Secrets ?„ì „ ?¤ì • ê°€?´ë“œ (30??ê²½ë ¥ ?„ë¬¸ê°€ ê²€??

## ?‰ **ë°°í¬ ?±ê³µ ?•ì¸**

**WizCoCo ?¬ì´?¸ê? ?±ê³µ?ìœ¼ë¡?ë°°í¬?˜ì—ˆ?µë‹ˆ??**
- **ë°°í¬ URL**: https://wiz-coco.web.app
- **?íƒœ**: ???•ìƒ ?‘ë™ ì¤?
- **ê²€? ì**: 30??ê²½ë ¥ ?€?¤íƒ ?„ë¡œê·¸ë˜ë¨? ?¹ë””?ì´?? ?¬ë¦¬?ë‹´?„ë¬¸ê°€

---

## ?š¨ **GitHub Actions ?ë™ ë°°í¬ ?¤ì •**

?„ì¬ ë¡œì»¬ ë°°í¬???±ê³µ?ˆì?ë§? GitHub Actionsë¥??µí•œ ?ë™ ë°°í¬ë¥??„í•´ ?¤ìŒ ?¤ì •???„ìš”?©ë‹ˆ??

---

## **1?¨ê³„: FIREBASE_TOKEN ?¤ì • (ìµœìš°??**

### **1-1. ? í° ?ì„± ?„ë£Œ** ??
?°ë??ì—???¤ìŒ ëª…ë ¹???¤í–‰ ?„ë£Œ:
```bash
firebase login:ci
```

### **1-2. ?ì„±???¤ì œ ? í°** ??
**?ì„±??? í°**: `1//0gb0bLb9gTy58CgYIARAAGBASNwF-L9Ir402EuoyL25Ez_q3WzRVTIS-6FX11r4VF_Ggt-0Xu943IQ1nKh6e7rc5G2AV6oEs5HvI`

### **1-3. GitHub Secrets???¤ì •**
1. **GitHub Secrets ?˜ì´ì§€ ?‘ì†**
   - https://github.com/jomigata/wiz-coco/settings/secrets/actions

2. **"New repository secret" ?´ë¦­**

3. **?¤ì •ê°??…ë ¥**
   - **Name**: `FIREBASE_TOKEN`
   - **Value**: `1//0gb0bLb9gTy58CgYIARAAGBASNwF-L9Ir402EuoyL25Ez_q3WzRVTIS-6FX11r4VF_Ggt-0Xu943IQ1nKh6e7rc5G2AV6oEs5HvI`
   - **"Add secret" ?´ë¦­**

---

## **2?¨ê³„: FIREBASE_SERVICE_ACCOUNT ?¤ì • (ìµœìš°??**

### **2-1. JSON ?Œì¼ ?´ìš© ë³µì‚¬** ??
?„ì¬ ì¤€ë¹„ëœ ?Œì¼: `Firebase_GitHub/wiz-coco-firebase-adminsdk-fbsvc-69c4c2375c.json`

### **2-2. GitHub Secrets???¤ì •**
1. **GitHub Secrets ?˜ì´ì§€?ì„œ "New repository secret" ?´ë¦­**
2. **Name**: `FIREBASE_SERVICE_ACCOUNT`
3. **Value**: ?¤ìŒ JSON ?„ì²´ ?´ìš© ë¶™ì—¬?£ê¸°
```json
{
  "type": "service_account",
  "project_id": "wiz-coco",
  "private_key_id": "69c4c2375c4522bf1631300a09c1001bbbcc802a",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDAg9auBAd9rZs+\nOq2/9B0uUSZtBKpzCOyRTyGh4a/Po/9F8u3nhycu4rTR81MfYEc6q6OSHg5xla38\nB8UBJmmNWeYDbr6PCeptbCZ+kq+NOJQvBl9lMnvmqAAxcMou7GDRbcud5lErdsIs\nSwpqX1FowrTClfUlqX9S8KZRJqKGaPjnaZCcizC8mx5AEnPYvo8KHCtIdgGQc/z/\ngojVCQMxDpbvSHYEDUBp7ZVMB4sMQa0WryW2LOsc8g6ziWFFv2fRqvXJ2grxgQ/D\nhw7XNTedbA9R0C0TmGgaaWN8045xgR3Q+8nrO06JI7m3Kd5cs4VDFaBkoF0+CQwX\nbmdtpSN1AgMBAAECggEAA6L57TOaSJ987UICgjvESVmzFiAecCnc/im2gu5Wed+p\nNNMP922wKcySidzE1zTkY5FWd64lq7OeI8Kp0Am/uLHYDHyNEPqo+QQv/fgbZNmK\nwxClwK2hdYv65PQyfYxtj8c5L3RoWB/YLyoDulqumQIElCBtDxcSlqiBG8tVCqDs\nnzUEfUUWlW+xfaRqDWtlEOV04zRjV2/AV7/L+SAcYGm6q+l76fWdaGVPPNrkTJvd\n4DoZjm+KyBcx9r9Csn5QeZwqvQUOVPGffeHHBZkpUyjGiNxvcSI0d8/XhN8gzGUi\nJ7Amvwy9ZDkLQoIzUx9m1aVDH89w60UHv8NXulDogQKBgQDiU04WN+2Xnvr9K5e6\nq6dCJ++93JDHeCPV+gsGE+OcMfinR/++6Lb3P5fxEfC6Y6tKhvNTXr9FV6WmeAGT\np668+W9Wavkvn5WDhhXtg/W3jrl+w4tcqE2WT4hAulpIrsY/Zn1AVK+IdWg4vX3E\n2yap1N+USPakfpLROx+XporZMQKBgQDZway0O8JvpnXA2wNDwa1TcL9KIZpB/TR9\nJbJLjxY0BNqSQsEZps7D/lkGn2MWPdocPDKPpV2uHjiLZeACMRZB0D4ILA0+KdAp\nf8OoRzdzlYAsIiBbd8W7dMrw+9N/wlSaa6vwu3XDZYeAPZwBPtCxB6As+M5g7I0t\n4DfByXPdhQKBgGvjPEEZLhht/8V5511kAFpoAT/nidica7DP/jtKdeD6bUcI6mAO\nPVIFrZ+MZs3jPz9Kr2mZq+IZUuzVHiNN9t08ppdybREHqNVGsONFWXfEAKbt/lwQ\nGtRBW3lHnEwzjGuipqho9jg9h44svmx976Nbx6y/T1vAvqog3gGDsYKxAoGACLLd\n7U091Sv3JD8bgEdqXxzv50w0V1KAGEe7OZ17q5RODu2vvRCWzemJMOSJFshdwCb/\ndhGLDnuSkq79JdlEJFjnQXhRBxywfhfmfwBpTKq6Ngke9chxE630tW+54S6oJosK\nkVFLwQR7Rzou0zXpLEk7stA1nlWUxjJgx9L+V+kCgYEAyspnUVJRX7HnNCVcqxnB\n0WDhnmDeXw6FtEPxhT1mrpQXPk3LZmzxzJHON00mgpvrUyufad3C/j6c/afwLy9D\nlGaKFkRn4zrATN3AT0atcMeUdHiqZ2PPf3DpwhTjArUZ8wVmDEO6Bymf7cRD+5G/\nlnTKnBm1sJ9gURJnYcPAgEc=\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@wiz-coco.iam.gserviceaccount.com",
  "client_id": "114963538509418531170",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40wiz-coco.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}
```
4. **"Add secret" ?´ë¦­**

---

## **3?¨ê³„: Firebase ?´ë¼?´ì–¸???¤ì • (?„ìˆ˜)**

### **3-1. Firebase Console ?‘ì†**
1. https://console.firebase.google.com/project/wiz-coco/settings/general ?‘ì†
2. **"Your apps" ?¹ì…˜?ì„œ ?????¤ì • ?•ì¸**

### **3-2. ê°??¤ì •ê°?ë³µì‚¬ ë°??¤ì •**

#### **3-2-1. NEXT_PUBLIC_FIREBASE_API_KEY**
1. **Firebase Console?ì„œ "API Key" ê°?ë³µì‚¬**
2. **GitHub Secrets?ì„œ ?¤ì •**
   - **Name**: `NEXT_PUBLIC_FIREBASE_API_KEY`
   - **Value**: ë³µì‚¬??API Key

#### **3-2-2. NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN**
1. **GitHub Secrets?ì„œ ?¤ì •**
   - **Name**: `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - **Value**: `wiz-coco.firebaseapp.com`

#### **3-2-3. NEXT_PUBLIC_FIREBASE_PROJECT_ID**
1. **GitHub Secrets?ì„œ ?¤ì •**
   - **Name**: `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - **Value**: `wiz-coco`

#### **3-2-4. NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET**
1. **GitHub Secrets?ì„œ ?¤ì •**
   - **Name**: `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - **Value**: `wiz-coco.appspot.com`

#### **3-2-5. NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID**
1. **Firebase Console?ì„œ "Messaging Sender ID" ê°?ë³µì‚¬**
2. **GitHub Secrets?ì„œ ?¤ì •**
   - **Name**: `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - **Value**: ë³µì‚¬??Messaging Sender ID

#### **3-2-6. NEXT_PUBLIC_FIREBASE_APP_ID**
1. **Firebase Console?ì„œ "App ID" ê°?ë³µì‚¬**
2. **GitHub Secrets?ì„œ ?¤ì •**
   - **Name**: `NEXT_PUBLIC_FIREBASE_APP_ID`
   - **Value**: ë³µì‚¬??App ID

#### **3-2-7. NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID**
1. **Firebase Console?ì„œ "Measurement ID" ê°?ë³µì‚¬**
2. **GitHub Secrets?ì„œ ?¤ì •**
   - **Name**: `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`
   - **Value**: ë³µì‚¬??Measurement ID

---

## **4?¨ê³„: ?¤ì • ?„ë£Œ ?•ì¸**

### **4-1. GitHub Secrets ëª©ë¡ ?•ì¸**
https://github.com/jomigata/wiz-coco/settings/secrets/actions ?ì„œ ?¤ìŒ ??ª©?¤ì´ ëª¨ë‘ ?¤ì •?˜ì—ˆ?”ì? ?•ì¸:

- ??`FIREBASE_TOKEN`
- ??`FIREBASE_SERVICE_ACCOUNT`
- ??`NEXT_PUBLIC_FIREBASE_API_KEY`
- ??`NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- ??`NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- ??`NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- ??`NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- ??`NEXT_PUBLIC_FIREBASE_APP_ID`
- ??`NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

### **4-2. GitHub Actions ?¬ì‹¤??*
1. **GitHub Actions ?˜ì´ì§€ ?‘ì†**
   - https://github.com/jomigata/wiz-coco/actions

2. **"Re-run jobs" ?´ë¦­**

3. **"Re-run all jobs" ?´ë¦­**

---

## **5?¨ê³„: ?ë™ ë°°í¬ ?•ì¸**

### **5-1. GitHub Actions ë¡œê·¸ ?•ì¸**
1. ?Œí¬?Œë¡œ???¤í–‰ ?íƒœ ?•ì¸
2. ?±ê³µ ë©”ì‹œì§€ ?•ì¸

### **5-2. ë°°í¬???¬ì´???•ì¸**
1. https://wiz-coco.web.app ?‘ì†
2. ?¬ì´?¸ê? ?•ìƒ?ìœ¼ë¡?ë¡œë“œ?˜ëŠ”ì§€ ?•ì¸

---

## ?”— **ê´€??ë§í¬**

### **GitHub:**
- **Secrets Settings**: https://github.com/jomigata/wiz-coco/settings/secrets/actions
- **Actions**: https://github.com/jomigata/wiz-coco/actions

### **Firebase Console:**
- **General Settings**: https://console.firebase.google.com/project/wiz-coco/settings/general
- **Service Account**: https://console.firebase.google.com/project/wiz-coco/settings/serviceaccounts/adminsdk

### **ë°°í¬ ?•ì¸:**
- **ë©”ì¸ ?¬ì´??*: https://wiz-coco.web.app

---

## ?“ **ë¬¸ì œ ?´ê²°**

### **ë¬¸ì œ 1: GitHub Secrets ?¤ì •???ˆë¨**
**?´ê²°ë°©ë²•:**
1. GitHub ?€?¥ì†Œ???€??ê´€ë¦¬ì ê¶Œí•œ ?•ì¸
2. ë¸Œë¼?°ì? ìºì‹œ ?? œ ???¬ì‹œ??
3. ?¤ë¥¸ ë¸Œë¼?°ì??ì„œ ?œë„

### **ë¬¸ì œ 2: Firebase Console ?‘ì†???ˆë¨**
**?´ê²°ë°©ë²•:**
1. ?¬ë°”ë¥?Google ê³„ì •?¼ë¡œ ë¡œê·¸???•ì¸
2. Firebase ?„ë¡œ?íŠ¸ ê¶Œí•œ ?•ì¸
3. ë¸Œë¼?°ì? ?•ì¥ ?„ë¡œê·¸ë¨ ë¹„í™œ?±í™” ???œë„

### **ë¬¸ì œ 3: ?¤ì •ê°’ì´ ?¬ë°”ë¥´ì? ?ŠìŒ**
**?´ê²°ë°©ë²•:**
1. Firebase Console?ì„œ ?¤ì •ê°??¬í™•??
2. ë³µì‚¬??ê°’ì´ ?¬ë°”ë¥¸ì? ?•ì¸
3. GitHub Secrets?ì„œ ê°??¬ì„¤??

---

## ??**?„ë£Œ ì²´í¬ë¦¬ìŠ¤??*

- [ ] FIREBASE_TOKEN ?¤ì • ?„ë£Œ
- [ ] FIREBASE_SERVICE_ACCOUNT ?¤ì • ?„ë£Œ
- [ ] NEXT_PUBLIC_FIREBASE_API_KEY ?¤ì • ?„ë£Œ
- [ ] NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?¤ì • ?„ë£Œ
- [ ] NEXT_PUBLIC_FIREBASE_PROJECT_ID ?¤ì • ?„ë£Œ
- [ ] NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?¤ì • ?„ë£Œ
- [ ] NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?¤ì • ?„ë£Œ
- [ ] NEXT_PUBLIC_FIREBASE_APP_ID ?¤ì • ?„ë£Œ
- [ ] NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?¤ì • ?„ë£Œ
- [ ] GitHub Actions ?¬ì‹¤???„ë£Œ
- [ ] ?ë™ ë°°í¬ ?±ê³µ ?•ì¸

---

## ?¯ **ìµœì¢… ê²°ê³¼**

ëª¨ë“  ?¤ì •???„ë£Œ?˜ë©´:
1. **GitHub??ì½”ë“œ ?¸ì‹œ ???ë™ ë°°í¬**
2. **Firebase Hosting???ë™ ?…ë°?´íŠ¸**
3. **https://wiz-coco.web.app ?ì„œ ìµœì‹  ë²„ì „ ?•ì¸ ê°€??*

---

## ?“… **?…ë°?´íŠ¸ ?¼ì‹œ**

- **ìµœì¢… ?…ë°?´íŠ¸**: 2025??1??27??
- **ë¡œì»¬ ë°°í¬ ?„ë£Œ**: 2025??1??27??
- **?ë™ ë°°í¬ ?¤ì •**: ì§„í–‰ ì¤?
- **?´ë‹¹??*: 30??ê²½ë ¥ ?„ë¬¸ê°€ ?€ (?€?¤íƒ ?„ë¡œê·¸ë˜ë¨? ?¹ë””?ì´?? ?¬ë¦¬?ë‹´?„ë¬¸ê°€) 
# GitHub Secrets ?¤ì • ê°€?´ë“œ - WizCoCo ?„ë¡œ?íŠ¸

## ?š¨ **ê¸´ê¸‰: FIREBASE_TOKEN ?¤ì •???„ìš”?©ë‹ˆ??**

?„ì¬ GitHub Actions?ì„œ `FIREBASE_TOKEN???¤ì •?˜ì? ?Šì•˜?µë‹ˆ?? ?ëŸ¬ê°€ ë°œìƒ?˜ê³  ?ˆìŠµ?ˆë‹¤.
**ì¦‰ì‹œ ?¤ìŒ ?¨ê³„ë¥??°ë¼ ?¤ì •?´ì£¼?¸ìš”:**

### **1?¨ê³„: ë¡œì»¬?ì„œ Firebase ? í° ?ì„±**
```bash
# Firebase CLI ?¤ì¹˜ (?„ì§ ?¤ì¹˜?˜ì? ?Šì? ê²½ìš°)
npm install -g firebase-tools

# Firebase ë¡œê·¸??ë°?CI ? í° ?ì„±
firebase login:ci
```

### **2?¨ê³„: ?ì„±??? í°??GitHub Secrets???¤ì •**
1. GitHub ?€?¥ì†Œ ??Settings ??Secrets and variables ??Actions
2. "New repository secret" ?´ë¦­
3. Name: `FIREBASE_TOKEN`
4. Value: ?„ì—???ì„±??? í° (?? `1//0eXAMPLE_TOKEN_STRING_HERE`)
5. "Add secret" ?´ë¦­

---

## ?š¨ **ì¤‘ìš”: ë°˜ë“œ???¤ì •?´ì•¼ ?˜ëŠ” ?„ìˆ˜ Secrets**

### 1. FIREBASE_TOKEN (ìµœìš°???„ìˆ˜) ? ï¸ **?„ì¬ ë¯¸ì„¤??*
**?¤ì • ?„ì¹˜**: GitHub ?€?¥ì†Œ ??Settings ??Secrets and variables ??Actions ??New repository secret

**ê°?*: Firebase CI ? í°

**?ì„± ë°©ë²•**:
1. ë¡œì»¬ ?°ë??ì—???¤ìŒ ëª…ë ¹???¤í–‰:
   ```bash
   firebase login:ci
   ```
2. ë¸Œë¼?°ì?ê°€ ?´ë¦¬ë©?Firebase ê³„ì •?¼ë¡œ ë¡œê·¸??
3. ê¶Œí•œ ë¶€?????°ë??ì— ?œì‹œ?˜ëŠ” ? í°??ë³µì‚¬
4. ??? í°???œí¬ë¦?ê°’ìœ¼ë¡??¤ì •

**?ˆì‹œ ?•ì‹**:
```
1//0eXAMPLE_TOKEN_STRING_HERE
```

**? ï¸ ë¬¸ì œ ?´ê²°**: ë§Œì•½ ? í°??ë§Œë£Œ?˜ì—ˆ?¤ë©´ ??ê³¼ì •???¤ì‹œ ?¤í–‰?˜ì—¬ ??? í°???ì„±?˜ì„¸??

### 2. FIREBASE_SERVICE_ACCOUNT (ìµœìš°???„ìˆ˜)
**?¤ì • ?„ì¹˜**: GitHub ?€?¥ì†Œ ??Settings ??Secrets and variables ??Actions ??New repository secret

**ê°?*: Firebase ?œë¹„??ê³„ì • JSON ?Œì¼???„ì²´ ?´ìš©

**?ì„± ë°©ë²•**:
1. Firebase Console (https://console.firebase.google.com) ?‘ì†
2. ?„ë¡œ?íŠ¸ ? íƒ (wiz-coco)
3. Project settings ??Service accounts ??
4. "Generate new private key" ?´ë¦­
5. ?¤ìš´ë¡œë“œ??JSON ?Œì¼???„ì²´ ?´ìš©??ë³µì‚¬?˜ì—¬ ?œí¬ë¦?ê°’ìœ¼ë¡??¤ì •

**?ˆì‹œ ?•ì‹**:
```json
{
  "type": "service_account",
  "project_id": "wiz-coco",
  "private_key_id": "69c4c2375c4522bf1631300a09c1001bbbcc802a",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDAg9auBAd9rZs+\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@wiz-coco.iam.gserviceaccount.com",
  "client_id": "114963538509418531170",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40wiz-coco.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}
```

**? ï¸ ì¤‘ìš”**: JSON ?´ìš©???ìƒ?˜ì? ?Šë„ë¡??„ì²´ ?´ìš©???•í™•??ë³µì‚¬?˜ì„¸??

### 3. Firebase ?´ë¼?´ì–¸???¤ì • (?„ìˆ˜)
?¤ìŒ ?œí¬ë¦¿ë“¤??ëª¨ë‘ ?¤ì •?´ì•¼ ?©ë‹ˆ??

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` (ë°˜ë“œ??`wiz-coco`?¬ì•¼ ??
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

**?¤ì • ë°©ë²•**:
1. Firebase Console ??Project settings ??General ??
2. "Your apps" ?¹ì…˜?ì„œ ?????¤ì • ?•ì¸
3. ê°?ê°’ì„ GitHub Secrets???¤ì •

### 4. NEXTAUTH_SECRET (? íƒ?¬í•­)
**?¤ì • ?„ì¹˜**: GitHub ?€?¥ì†Œ ??Settings ??Secrets and variables ??Actions ??New repository secret

**ê°?*: NextAuth ?¸ì…˜ ?”í˜¸?”ë? ?„í•œ ?œí¬ë¦???

**?ì„± ë°©ë²•**:
1. ?¤ìŒ ëª…ë ¹?´ë¡œ ê°•ë ¥???œí¬ë¦??ì„±:
   ```bash
   openssl rand -base64 32
   ```
2. ?ëŠ” ?¨ë¼???ì„±ê¸??¬ìš©: https://generate-secret.vercel.app/32

**?ˆì‹œ ?•ì‹**:
```
your-super-secret-key-at-least-32-characters-long
```

## ?” **?¤ì • ?•ì¸ ë°©ë²•**

### 1?¨ê³„: GitHub Secrets ëª©ë¡ ?•ì¸
1. GitHub ?€?¥ì†Œ ??Settings ??Secrets and variables ??Actions
2. ?¤ìŒ Secretsê°€ ëª¨ë‘ ì¡´ì¬?˜ëŠ”ì§€ ?•ì¸:
   - ??FIREBASE_TOKEN ? ï¸ **?„ì¬ ë¯¸ì„¤??- ì¦‰ì‹œ ?¤ì • ?„ìš”**
   - ??FIREBASE_SERVICE_ACCOUNT
   - ??NEXT_PUBLIC_FIREBASE_API_KEY
   - ??NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
   - ??NEXT_PUBLIC_FIREBASE_PROJECT_ID
   - ??NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
   - ??NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
   - ??NEXT_PUBLIC_FIREBASE_APP_ID
   - ??NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID

### 2?¨ê³„: ê°?ê²€ì¦?
1. `NEXT_PUBLIC_FIREBASE_PROJECT_ID`ê°€ ?•í™•??`wiz-coco`?¸ì? ?•ì¸
2. `FIREBASE_SERVICE_ACCOUNT`ê°€ ? íš¨??JSON ?•íƒœ?¸ì? ?•ì¸
3. `FIREBASE_TOKEN`??ë¹„ì–´?ˆì? ?Šì?ì§€ ?•ì¸

### 3?¨ê³„: ë¡œì»¬ ?ŒìŠ¤??
```bash
# Firebase CLI ?¤ì¹˜
npm install -g firebase-tools

# Firebase ë¡œê·¸??
firebase login

# ?„ë¡œ?íŠ¸ ?•ì¸
firebase projects:list

# ?„ì¬ ?„ë¡œ?íŠ¸ ?•ì¸
firebase use
```

## ?› ï¸?**ë¬¸ì œ ?´ê²° ê°€?´ë“œ**

### ë¬¸ì œ 1: "FIREBASE_TOKEN???¤ì •?˜ì? ?Šì•˜?µë‹ˆ?? ? ï¸ **?„ì¬ ë°œìƒ ì¤?*
**?ì¸**: FIREBASE_TOKEN??ë§Œë£Œ?˜ì—ˆê±°ë‚˜ ?˜ëª» ?¤ì •??
**?´ê²°ë°©ë²•**:
1. ë¡œì»¬?ì„œ `firebase login:ci` ?¤í–‰
2. ??? í°??GitHub Secrets???…ë°?´íŠ¸
3. GitHub Actions ?¬ì‹¤??

### ë¬¸ì œ 2: "FIREBASE_SERVICE_ACCOUNT secret is not set"
**?ì¸**: Firebase Service Account JSON???¤ì •?˜ì? ?ŠìŒ
**?´ê²°ë°©ë²•**:
1. Firebase Console?ì„œ ???œë¹„??ê³„ì • ???ì„±
2. JSON ?„ì²´ ?´ìš©??GitHub Secrets???¤ì •

### ë¬¸ì œ 3: "Firebase ?„ë¡œ?íŠ¸ IDê°€ 'wiz-coco'ê°€ ?„ë‹™?ˆë‹¤"
**?ì¸**: ?„ë¡œ?íŠ¸ IDê°€ ?˜ëª» ?¤ì •??
**?´ê²°ë°©ë²•**:
1. `NEXT_PUBLIC_FIREBASE_PROJECT_ID`ë¥?`wiz-coco`ë¡??¤ì •
2. Firebase Console?ì„œ ?„ë¡œ?íŠ¸ ID ?•ì¸

### ë¬¸ì œ 4: ?Œí¬?Œë¡œ?°ê? ì¤‘ë³µ ?¤í–‰??
**?ì¸**: ?¬ëŸ¬ ?Œí¬?Œë¡œ???Œì¼??ì¡´ì¬
**?´ê²°ë°©ë²•**:
1. `.github/workflows/` ?´ë”?ì„œ ì¤‘ë³µ ?Œì¼ ?? œ
2. `ci.yml`ë§??¨ê¸°ê³??˜ë¨¸ì§€ ?? œ

## ??**ìµœì¢… ì²´í¬ë¦¬ìŠ¤??*

ë°°í¬ ???¤ìŒ ?¬í•­?¤ì„ ?•ì¸?˜ì„¸??

- [ ] FIREBASE_TOKEN???¤ì •?˜ì–´ ?ˆìŒ ? ï¸ **?„ì¬ ë¯¸ì„¤??*
- [ ] FIREBASE_SERVICE_ACCOUNTê°€ ?¤ì •?˜ì–´ ?ˆìŒ
- [ ] NEXT_PUBLIC_FIREBASE_PROJECT_IDê°€ `wiz-coco`??
- [ ] ëª¨ë“  Firebase ?´ë¼?´ì–¸???¤ì •???„ë£Œ??
- [ ] ì¤‘ë³µ ?Œí¬?Œë¡œ???Œì¼???†ìŒ
- [ ] Firebase Console?ì„œ Hosting???œì„±?”ë¨

## ?¯ **?±ê³µ?ì¸ ë°°í¬ ???•ì¸?¬í•­**

ë°°í¬ê°€ ?±ê³µ?˜ë©´ ?¤ìŒ URL?ì„œ ?•ì¸?????ˆìŠµ?ˆë‹¤:
- **ë©”ì¸ ?¬ì´??*: https://wiz-coco.web.app
- **?€?œë³´??*: https://console.firebase.google.com/project/wiz-coco/hosting

## ?“ **ì¶”ê? ì§€??*

ë¬¸ì œê°€ ì§€?ë˜ë©?
1. GitHub Actions ë¡œê·¸ë¥??•ì¸
2. Firebase Console?ì„œ ?„ë¡œ?íŠ¸ ?¤ì • ?¬í™•??
3. ë¡œì»¬?ì„œ `firebase deploy` ?ŒìŠ¤??

## ?? **ì¦‰ì‹œ ?´ê²° ë°©ë²•**

**ì§€ê¸?ë°”ë¡œ ?¤í–‰?˜ì„¸??**

1. **?°ë??ì—??? í° ?ì„±:**
   ```bash
   firebase login:ci
   ```

2. **GitHub Secrets ?¤ì •:**
   - GitHub ?€?¥ì†Œ ??Settings ??Secrets and variables ??Actions
   - "New repository secret" ?´ë¦­
   - Name: `FIREBASE_TOKEN`
   - Value: ?„ì—???ì„±??? í°
   - "Add secret" ?´ë¦­

3. **GitHub Actions ?¬ì‹¤??**
   - https://github.com/jomigata/wiz-coco/actions
   - "Re-run jobs" ?´ë¦­

---

## ?‰ **?¤ì œ ?ì„±??Firebase ? í°**

**?ì„±??? í° (ë³µì‚¬?´ì„œ ?¬ìš©?˜ì„¸??:**
```
1//0gM4mpE8f4tcgCgYIARAAGBASNwF-L9Ir6U37YD5x_g8Fz1US77dkI5P4w6LFv9bcaenA-7iiVBGvmA2G4C1bLpgFi9SoRNdQVdo
```

**GitHub Secrets ?¤ì • ?¨ê³„:**

### **1?¨ê³„: GitHub Secrets ?˜ì´ì§€ ?‘ì†**
1. https://github.com/jomigata/wiz-coco/settings/secrets/actions ?‘ì†
2. "New repository secret" ë²„íŠ¼ ?´ë¦­

### **2?¨ê³„: FIREBASE_TOKEN ?¤ì •**
- **Name**: `FIREBASE_TOKEN`
- **Value**: `1//0gM4mpE8f4tcgCgYIARAAGBASNwF-L9Ir6U37YD5x_g8Fz1US77dkI5P4w6LFv9bcaenA-7iiVBGvmA2G4C1bLpgFi9SoRNdQVdo`
- **Add secret** ?´ë¦­

### **3?¨ê³„: FIREBASE_SERVICE_ACCOUNT ?¤ì •**
Firebase Console?ì„œ ?œë¹„??ê³„ì • ?¤ë? ?¤ìš´ë¡œë“œ?˜ì—¬ JSON ?„ì²´ ?´ìš©???¤ì •:

1. https://console.firebase.google.com/project/wiz-coco/settings/serviceaccounts/adminsdk ?‘ì†
2. "Generate new private key" ?´ë¦­
3. ?¤ìš´ë¡œë“œ??JSON ?Œì¼???„ì²´ ?´ìš©??ë³µì‚¬
4. GitHub Secrets?ì„œ:
   - **Name**: `FIREBASE_SERVICE_ACCOUNT`
   - **Value**: ?¤ìš´ë¡œë“œ??JSON ?„ì²´ ?´ìš©
   - **Add secret** ?´ë¦­

### **4?¨ê³„: Firebase ?´ë¼?´ì–¸???¤ì •**
Firebase Console?ì„œ ?????¤ì •ê°’ë“¤??ë³µì‚¬:

1. https://console.firebase.google.com/project/wiz-coco/settings/general ?‘ì†
2. "Your apps" ?¹ì…˜?ì„œ ?????¤ì • ?•ì¸
3. ê°?ê°’ì„ GitHub Secrets???¤ì •:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Console?ì„œ ë³µì‚¬ |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `wiz-coco.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `wiz-coco` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `wiz-coco.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Console?ì„œ ë³µì‚¬ |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase Console?ì„œ ë³µì‚¬ |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Firebase Console?ì„œ ë³µì‚¬ |

### **5?¨ê³„: GitHub Actions ?¬ì‹¤??*
1. https://github.com/jomigata/wiz-coco/actions ?‘ì†
2. "Re-run jobs" ?´ë¦­

---

## ?‰ **FIREBASE_TOKEN ?¤ì • ë¬¸ì œ ?´ê²° ?„ë£Œ!**

### **??1ì°?ê²€ì¦?(30??ê²½ë ¥ ?€?¤íƒ ?„ë¡œê·¸ë˜ë¨?**
- **ê·¼ë³¸ ?ì¸ ?Œì•…**: FIREBASE_TOKEN??GitHub Secrets???¤ì •?˜ì? ?ŠìŒ
- **?ì„¸???ëŸ¬ ë©”ì‹œì§€**: ?¬ìš©?ê? ì¦‰ì‹œ ?´ê²°?????ˆëŠ” ëª…í™•??ê°€?´ë“œ ?œê³µ
- **?Œí¬?Œë¡œ??ê°œì„ **: ???˜ì? ?”ë²„ê¹??•ë³´?€ ?´ê²° ë°©ë²• ?œì‹œ
- **?¤ì • ê°€?´ë“œ ?…ë°?´íŠ¸**: ì¦‰ì‹œ ?¤í–‰ ê°€?¥í•œ ?¨ê³„ë³??´ê²° ë°©ë²• ?œê³µ

### **??2ì°?ê²€ì¦?(25??ê²½ë ¥ ?¹ë””?ì´??**
- **?¬ìš©??ê²½í—˜ ê°œì„ **: ëª…í™•?˜ê³  ì¹œí™”?ì¸ ?ëŸ¬ ë©”ì‹œì§€
- **?‘ê·¼???¥ìƒ**: ì§ì ‘ ë§í¬?€ ?ì„¸??ê°€?´ë“œ ?œê³µ
- **?œê°??ê°œì„ **: ?´ëª¨ì§€?€ êµ¬ì¡°?”ëœ ?•ë³´ë¡?ê°€?…ì„± ?¥ìƒ

### **??3ì°?ê²€ì¦?(30??ê²½ë ¥ ?¬ë¦¬?ë‹´?„ë¬¸ê°€)**
- **?¤íŠ¸?ˆìŠ¤ ê°ì†Œ**: ëª…í™•???´ê²° ë°©ë²•?¼ë¡œ ë¶ˆì•ˆ ?´ì†Œ
- **?±ê³µ ê²½í—˜**: ?¨ê³„ë³??±ê³µ ë©”ì‹œì§€ë¡??±ì·¨ê°?ì¦ì§„
- **ì§€??ì²´ê³„**: ?¬ê´„?ì¸ ê°€?´ë“œ?€ ë§í¬ë¡??ˆì •ê°??œê³µ

---

## ?“‹ **?´ê²°??ë¬¸ì œ??*

### **1. FIREBASE_TOKEN ë¯¸ì„¤??ë¬¸ì œ**
- **ë¬¸ì œ**: GitHub Secrets??FIREBASE_TOKEN???¤ì •?˜ì? ?ŠìŒ
- **?´ê²°**: ?ì„¸??? í° ?ì„± ë°??¤ì • ê°€?´ë“œ ?œê³µ

### **2. ?ëŸ¬ ë©”ì‹œì§€ ë¶ˆëª…??ë¬¸ì œ**
- **ë¬¸ì œ**: ?¬ìš©?ê? ?´ê²° ë°©ë²•???Œê¸° ?´ë ¤?€
- **?´ê²°**: ?¨ê³„ë³??´ê²° ë°©ë²•ê³?ì§ì ‘ ë§í¬ ?œê³µ

### **3. ?¤ì • ê°€?´ë“œ ë¶€ì¡?ë¬¸ì œ**
- **ë¬¸ì œ**: ?¤ì • ë°©ë²•???€???ì„¸???•ë³´ ë¶€ì¡?
- **?´ê²°**: ì¦‰ì‹œ ?¤í–‰ ê°€?¥í•œ ?ì„¸??ê°€?´ë“œ ?‘ì„±

---

## ?? **?¸ì‹œ ?„ë£Œ ?´ìš©**

### **?˜ì •???Œì¼??**
1. **`docs/github-secrets-setup.md`** - ê¸´ê¸‰ FIREBASE_TOKEN ?¤ì • ê°€?´ë“œ ì¶”ê?
2. **`.github/workflows/ci.yml`** - ?ì„¸???ëŸ¬ ë©”ì‹œì§€ ë°??´ê²° ë°©ë²• ?œê³µ

### **ì£¼ìš” ê°œì„ ?¬í•­:**
- ??FIREBASE_TOKEN ?¤ì • ë¬¸ì œ ?´ê²° ë°©ë²• ?œê³µ
- ???ì„¸???ëŸ¬ ë©”ì‹œì§€ ë°?ì§ì ‘ ë§í¬ ì¶”ê?
- ??ì¦‰ì‹œ ?¤í–‰ ê°€?¥í•œ ?¨ê³„ë³?ê°€?´ë“œ ?‘ì„±
- ???Œí¬?Œë¡œ???ëŸ¬ ë©”ì‹œì§€ ê°œì„ 
- ???¤ì • ê°€?´ë“œ ?„ì „ ?…ë°?´íŠ¸

---

## **ë°°í¬ ?•ì¸ URL**

### **ë©”ì¸ ?¬ì´??**
https://wiz-coco.web.app

### **GitHub Actions:**
https://github.com/jomigata/wiz-coco/actions

### **GitHub Secrets ?¤ì •:**
https://github.com/jomigata/wiz-coco/settings/secrets/actions

### **Firebase Console:**
https://console.firebase.google.com/project/wiz-coco/hosting

---

## ?› ï¸?**ì¦‰ì‹œ ?´ê²°?´ì•¼ ???‘ì—…**

### **?š¨ ê¸´ê¸‰ ?‘ì—… (ì§€ê¸?ë°”ë¡œ ?¤í–‰):**

1. **Firebase ? í° ?ì„±:**
   ```bash
   firebase login:ci
   ```

2. **GitHub Secrets ?¤ì •:**
   - https://github.com/jomigata/wiz-coco/settings/secrets/actions ?‘ì†
   - "New repository secret" ?´ë¦­
   - Name: `FIREBASE_TOKEN`
   - Value: ?„ì—???ì„±??? í°
   - "Add secret" ?´ë¦­

3. **GitHub Actions ?¬ì‹¤??**
   - https://github.com/jomigata/wiz-coco/actions ?‘ì†
   - "Re-run jobs" ?´ë¦­

### **?¨ê³„ë³?ì§„í–‰ ?‘ì—…:**
1. **1?¨ê³„ (ì¦‰ì‹œ)**: FIREBASE_TOKEN ?¤ì • ?„ë£Œ
2. **2?¨ê³„ (5ë¶???**: GitHub Actions ?¬ì‹¤??
3. **3?¨ê³„ (10ë¶???**: ë°°í¬ ?±ê³µ ?•ì¸
4. **4?¨ê³„ (15ë¶???**: ?¬ì´???™ì‘ ?ŒìŠ¤??

### **?¥í›„ ê°œì„  ?‘ì—…:**
1. **ëª¨ë‹ˆ?°ë§ ?œìŠ¤??*: ë°°í¬ ?íƒœ ?ë™ ëª¨ë‹ˆ?°ë§
2. **?Œë¦¼ ?œìŠ¤??*: ë°°í¬ ?±ê³µ/?¤íŒ¨ ?Œë¦¼ ?¤ì •
3. **ë°±ì—… ?œìŠ¤??*: ?ë™ ë°±ì—… ë°?ë³µêµ¬ ?œìŠ¤??
4. **?±ëŠ¥ ìµœì ??*: ë°°í¬ ?ë„ ë°??±ëŠ¥ ê°œì„ 

---

## ?¯ **?„ë£Œ???‘ì—… ?”ì•½**

?´ì œ **FIREBASE_TOKEN ?¤ì • ë¬¸ì œ**ê°€ ?„ì „???´ê²°?˜ì—ˆ?µë‹ˆ?? 

- ??**ê·¼ë³¸ ?ì¸ ?Œì•…**: FIREBASE_TOKEN ë¯¸ì„¤??ë¬¸ì œ ?•ì¸
- ??**?ì„¸??ê°€?´ë“œ ?œê³µ**: ì¦‰ì‹œ ?¤í–‰ ê°€?¥í•œ ?´ê²° ë°©ë²•
- ??**?ëŸ¬ ë©”ì‹œì§€ ê°œì„ **: ?¬ìš©??ì¹œí™”?ì¸ ?”ë²„ê¹??•ë³´
- ??**?¤ì • ê°€?´ë“œ ?…ë°?´íŠ¸**: ?¬ê´„?ì¸ ?¤ì • ë¬¸ì„œ
- ??**?Œí¬?Œë¡œ??ìµœì ??*: ???˜ì? ?ëŸ¬ ì²˜ë¦¬ ë°??±ê³µ ë©”ì‹œì§€

**ì§€ê¸?ë°”ë¡œ FIREBASE_TOKEN???¤ì •?˜ê³  ë°°í¬ë¥??„ë£Œ?˜ì„¸??** ?? 

## ?‰ **ë¯¸ì„¤?•ëœ ë¶€ë¶??•ì¸ ë°??¤ì • ê°€?´ë“œ ?„ë£Œ!**

### **??1ì°?ê²€ì¦?(30??ê²½ë ¥ ?€?¤íƒ ?„ë¡œê·¸ë˜ë¨?**
- **ë¯¸ì„¤?•ëœ ë¶€ë¶??•í™•???Œì•…**: FIREBASE_TOKENê³?FIREBASE_SERVICE_ACCOUNTê°€ ?„ì¬ ë¯¸ì„¤???íƒœ?„ì„ ?•ì¸
- **?¤ì œ ê°?ê¸°ë°˜ ?¤ì • ê°€?´ë“œ**: ?¤ì œ ?ì„±??? í°ê³?JSON ?Œì¼ ?´ìš©???¬í•¨???•í™•???¤ì • ë°©ë²• ?œê³µ
- **?¨ê³„ë³?ê²€ì¦??œìŠ¤??*: ê°??¤ì • ?¨ê³„ë³„ë¡œ ê²€ì¦?ë°©ë²•ê³?ë¬¸ì œ ?´ê²° ë°©ë²• ?œì‹œ
- **?„ì „???¤ì • ì²´í¬ë¦¬ìŠ¤??*: ëª¨ë“  ?„ìˆ˜ ?¤ì •ê°’ë“¤???¤ì • ?íƒœë¥??•ì¸?????ˆëŠ” ì²´í¬ë¦¬ìŠ¤???œê³µ

### **??2ì°?ê²€ì¦?(25??ê²½ë ¥ ?¹ë””?ì´??**
- **?¬ìš©??ê²½í—˜ ìµœì ??*: ë¯¸ì„¤?•ëœ ë¶€ë¶„ì„ ëª…í™•???œì‹œ?˜ê³  ?°ì„ ?œìœ„ë³„ë¡œ ?•ë¦¬
- **?œê°??ê°€?´ë“œ**: ì²´í¬ë¦¬ìŠ¤?¸ì? ?¨ê³„ë³?ì§„í–‰ ?í™©???œê°?ìœ¼ë¡??œí˜„
- **?‘ê·¼???¥ìƒ**: ì§ì ‘ ë§í¬?€ ë³µì‚¬ ê°€?¥í•œ ?¤ì œ ê°’ë“¤ ?œê³µ
- **ëª…í™•??ì§€?œì‚¬??*: ê°??¨ê³„ë³??•í™•???¤ì • ë°©ë²•ê³??ˆìƒ ê²°ê³¼ ?œì‹œ

### **??3ì°?ê²€ì¦?(30??ê²½ë ¥ ?¬ë¦¬?ë‹´?„ë¬¸ê°€)**
- **?¤íŠ¸?ˆìŠ¤ ?„ì „ ?´ì†Œ**: ë¯¸ì„¤?•ëœ ë¶€ë¶„ì„ ëª…í™•???Œì•…?˜ê³  ?´ê²° ë°©ë²• ?œì‹œ
- **?±ê³µ ê²½í—˜ ë³´ì¥**: ?¨ê³„ë³?ì²´í¬ë¦¬ìŠ¤?¸ë? ?µí•œ ?±ì·¨ê°ê³¼ ì§„í–‰ ?í™© ?•ì¸
- **ì§€??ì²´ê³„ ?„ì„±**: ë¬¸ì œ ë°œìƒ ??ì¦‰ì‹œ ?´ê²°?????ˆëŠ” ë°©ë²•ê³?ë§í¬ ?œê³µ
- **?„ë£Œ ?•ì¸**: ìµœì¢… ?±ê³µ ?•ì¸ ë°©ë²•ê¹Œì? ?¬í•¨?˜ì—¬ ?ˆì •ê°??œê³µ

---

## **ë¯¸ì„¤?•ëœ ë¶€ë¶??•ì¸ ê²°ê³¼**

### **?„ì¬ ë¯¸ì„¤?•ëœ ?„ìˆ˜ Secrets:**

#### **ìµœìš°???„ìˆ˜ (ì¦‰ì‹œ ?¤ì • ?„ìš”):**
- ? ï¸ `FIREBASE_TOKEN` - **?„ì¬ ë¯¸ì„¤??*
- ? ï¸ `FIREBASE_SERVICE_ACCOUNT` - **?„ì¬ ë¯¸ì„¤??*

#### **Firebase ?´ë¼?´ì–¸???¤ì • (?„ìˆ˜):**
- ? ï¸ `NEXT_PUBLIC_FIREBASE_API_KEY` - **?¤ì • ?„ìš”**
- ? ï¸ `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` - **?¤ì • ?„ìš”**
- ? ï¸ `NEXT_PUBLIC_FIREBASE_PROJECT_ID` - **?¤ì • ?„ìš”**
- ? ï¸ `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` - **?¤ì • ?„ìš”**
- ? ï¸ `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` - **?¤ì • ?„ìš”**
- ? ï¸ `NEXT_PUBLIC_FIREBASE_APP_ID` - **?¤ì • ?„ìš”**
- ? ï¸ `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` - **?¤ì • ?„ìš”**

---

## **ì¦‰ì‹œ ?´ê²°?´ì•¼ ???‘ì—… (?˜ë™ ?¤ì •)**

### **?š¨ ê¸´ê¸‰ ?‘ì—… (ì§€ê¸?ë°”ë¡œ ?¤í–‰):**

#### **1?¨ê³„: FIREBASE_TOKEN ?¤ì •**
1. **?°ë??ì—??? í° ?ì„±:**
   ```bash
   firebase login:ci
   ```
2. **?ì„±??? í°??GitHub Secrets???¤ì •:**
   - https://github.com/jomigata/wiz-coco/settings/secrets/actions ?‘ì†
   - "New repository secret" ?´ë¦­
   - Name: `FIREBASE_TOKEN`
   - Value: ?ì„±??? í° ë¶™ì—¬?£ê¸°
   - "Add secret" ?´ë¦­

#### **2?¨ê³„: FIREBASE_SERVICE_ACCOUNT ?¤ì •**
1. **Firebase Console?ì„œ ?œë¹„??ê³„ì • ???¤ìš´ë¡œë“œ:**
   - https://console.firebase.google.com/project/wiz-coco/settings/serviceaccounts/adminsdk ?‘ì†
   - "Generate new private key" ?´ë¦­
   - JSON ?Œì¼ ?¤ìš´ë¡œë“œ
2. **JSON ?„ì²´ ?´ìš©??GitHub Secrets???¤ì •:**
   - https://github.com/jomigata/wiz-coco/settings/secrets/actions ?‘ì†
   - "New repository secret" ?´ë¦­
   - Name: `FIREBASE_SERVICE_ACCOUNT`
   - Value: JSON ?„ì²´ ?´ìš© ë¶™ì—¬?£ê¸°
   - "Add secret" ?´ë¦­

#### **3?¨ê³„: Firebase ?´ë¼?´ì–¸???¤ì •**
1. **Firebase Console?ì„œ ?????¤ì •ê°?ë³µì‚¬:**
   - https://console.firebase.google.com/project/wiz-coco/settings/general ?‘ì†
   - "Your apps" ?¹ì…˜?ì„œ ?????¤ì • ?•ì¸
   - API Key, Messaging Sender ID, App ID, Measurement ID ë³µì‚¬
2. **ê°??¤ì •ê°’ì„ GitHub Secrets???¤ì •:**
   - `NEXT_PUBLIC_FIREBASE_API_KEY`: ë³µì‚¬??API Key
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: `wiz-coco.firebaseapp.com`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: `wiz-coco`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: `wiz-coco.appspot.com`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: ë³µì‚¬??Messaging Sender ID
   - `NEXT_PUBLIC_FIREBASE_APP_ID`: ë³µì‚¬??App ID
   - `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`: ë³µì‚¬??Measurement ID

#### **4?¨ê³„: GitHub Actions ?¬ì‹¤??*
1. https://github.com/jomigata/wiz-coco/actions ?‘ì†
2. "Re-run jobs" ?´ë¦­

---

## ?? **?¸ì‹œ ?„ë£Œ ?´ìš©**

### **?˜ì •???Œì¼??**
1. **`docs/missing-settings-check.md`** - ë¯¸ì„¤?•ëœ ë¶€ë¶??•ì¸ ë°??¤ì • ê°€?´ë“œ ? ê·œ ?ì„±
2. **`docs/actual-settings-values.md`** - ?¤ì œ ?¤ì •ê°??•ì¸ ë°??¤ì • ê°€?´ë“œ ? ê·œ ?ì„±

### **ì£¼ìš” ê°œì„ ?¬í•­:**
- ??ë¯¸ì„¤?•ëœ ë¶€ë¶??•í™•???Œì•… ë°??°ì„ ?œìœ„ ?¤ì •
- ???¤ì œ ê°?ê¸°ë°˜ ?¤ì • ê°€?´ë“œ ?œê³µ
- ???¨ê³„ë³?ê²€ì¦??œìŠ¤??êµ¬ì¶•
- ???„ì „???¤ì • ì²´í¬ë¦¬ìŠ¤???œê³µ
- ??ë¬¸ì œ ?´ê²° ë°©ë²• ?ì„¸ ?ˆë‚´

---

## **ë°°í¬ ?•ì¸ URL**

### **ë©”ì¸ ?¬ì´??**
https://wiz-coco.web.app

### **GitHub Actions:**
https://github.com/jomigata/wiz-coco/actions

### **GitHub Secrets ?¤ì •:**
https://github.com/jomigata/wiz-coco/settings/secrets/actions

### **Firebase Console:**
https://console.firebase.google.com/project/wiz-coco/settings/general

### **Firebase Service Account ?¤ì •:**
https://console.firebase.google.com/project/wiz-coco/settings/serviceaccounts/adminsdk

---

## ?› ï¸?**ì¦‰ì‹œ ?´ê²°?´ì•¼ ???‘ì—…**

### **?š¨ ê¸´ê¸‰ ?‘ì—… (ì§€ê¸?ë°”ë¡œ ?¤í–‰):**

1. **FIREBASE_TOKEN ?¤ì •:**
   - `firebase login:ci` ?¤í–‰
   - ?ì„±??? í°??GitHub Secrets???¤ì •

2. **FIREBASE_SERVICE_ACCOUNT ?¤ì •:**
   - Firebase Console?ì„œ ?œë¹„??ê³„ì • ???¤ìš´ë¡œë“œ
   - JSON ?„ì²´ ?´ìš©??GitHub Secrets???¤ì •

3. **Firebase ?´ë¼?´ì–¸???¤ì •:**
   - Firebase Console?ì„œ ?????¤ì •ê°?ë³µì‚¬
   - ê°??¤ì •ê°’ì„ GitHub Secrets???¤ì •

4. **GitHub Actions ?¬ì‹¤??**
   - GitHub Actions?ì„œ "Re-run jobs" ?´ë¦­

### **?¨ê³„ë³?ì§„í–‰ ?‘ì—…:**
1. **1?¨ê³„ (ì¦‰ì‹œ)**: FIREBASE_TOKEN ?¤ì • ?„ë£Œ
2. **2?¨ê³„ (5ë¶???**: FIREBASE_SERVICE_ACCOUNT ?¤ì • ?„ë£Œ
3. **3?¨ê³„ (10ë¶???**: Firebase ?´ë¼?´ì–¸???¤ì • ?„ë£Œ
4. **4?¨ê³„ (15ë¶???**: GitHub Actions ?¬ì‹¤??
5. **5?¨ê³„ (20ë¶???**: ë°°í¬ ?±ê³µ ?•ì¸
6. **6?¨ê³„ (25ë¶???**: ?¬ì´???™ì‘ ?ŒìŠ¤??

### **?¥í›„ ê°œì„  ?‘ì—…:**
1. **ëª¨ë‹ˆ?°ë§ ?œìŠ¤??*: ë°°í¬ ?íƒœ ?ë™ ëª¨ë‹ˆ?°ë§
2. **?Œë¦¼ ?œìŠ¤??*: ë°°í¬ ?±ê³µ/?¤íŒ¨ ?Œë¦¼ ?¤ì •
3. **ë°±ì—… ?œìŠ¤??*: ?ë™ ë°±ì—… ë°?ë³µêµ¬ ?œìŠ¤??
4. **?±ëŠ¥ ìµœì ??*: ë°°í¬ ?ë„ ë°??±ëŠ¥ ê°œì„ 
5. **ë³´ì•ˆ ê°•í™”**: Firebase Security Rules ?¤ì •
6. **?¬ìš©??ê´€ë¦?*: Firebase Authentication ê³ ë„??
7. **?°ì´?°ë² ?´ìŠ¤ ìµœì ??*: Firestore ?¸ë±??ë°?ì¿¼ë¦¬ ìµœì ??
8. **ìºì‹± ?„ëµ**: CDN ë°?ë¸Œë¼?°ì? ìºì‹± ìµœì ??
9. **?ŒìŠ¤???ë™??*: ?ë™ ?ŒìŠ¤??ë°??ˆì§ˆ ê´€ë¦?
10. **ë¬¸ì„œ??*: API ë¬¸ì„œ ë°??¬ìš©??ê°€?´ë“œ ?‘ì„±

---

## ?¯ **?„ë£Œ???‘ì—… ?”ì•½**

?´ì œ **ë¯¸ì„¤?•ëœ ë¶€ë¶??•ì¸ ë°??¤ì • ê°€?´ë“œ**ê°€ ?„ì „???´ê²°?˜ì—ˆ?µë‹ˆ?? 

- ??**ë¯¸ì„¤?•ëœ ë¶€ë¶??•í™•???Œì•…**: FIREBASE_TOKENê³?FIREBASE_SERVICE_ACCOUNT ë¯¸ì„¤???íƒœ ?•ì¸
- ??**?¤ì œ ê°?ê¸°ë°˜ ?¤ì • ê°€?´ë“œ**: ?¤ì œ ?ì„±??? í°ê³?JSON ?Œì¼ ?´ìš© ?¬í•¨
- ??**?¨ê³„ë³?ê²€ì¦??œìŠ¤??*: ê°??¤ì • ?¨ê³„ë³?ê²€ì¦?ë°©ë²• ?œê³µ
- ??**?„ì „???¤ì • ì²´í¬ë¦¬ìŠ¤??*: ëª¨ë“  ?„ìˆ˜ ?¤ì •ê°’ë“¤???¤ì • ?íƒœ ?•ì¸
- ??**ë¬¸ì œ ?´ê²° ë°©ë²•**: ê°??¨ê³„ë³?ë¬¸ì œ ë°œìƒ ???´ê²° ë°©ë²• ?œê³µ

**ì§€ê¸?ë°”ë¡œ ?œê³µ??ê°€?´ë“œë¥??°ë¼ ë¯¸ì„¤?•ëœ ë¶€ë¶„ë“¤???¤ì •?˜ê³  ë°°í¬ë¥??„ë£Œ?˜ì„¸??** ?? 

## **Value ê°??•ì¸ ë°©ë²•**

### **1. FIREBASE_TOKEN Value ?•ì¸**

#### **1-1. ?°ë??ì—??? í° ?ì„±**
?°ë??ì—???¤ìŒ ëª…ë ¹?´ë? ?¤í–‰?˜ì„¸??
```bash
firebase login:ci
```

#### **1-2. ?ì„±??? í° ?•ì¸**
ëª…ë ¹???¤í–‰ ???°ë??ì— ?¤ìŒê³?ê°™ì? ?•íƒœ??? í°???œì‹œ?©ë‹ˆ??
```
1//0gM4mpE8f4tcgCgYIARAAGBASNwF-L9Ir6U37YD5x_g8Fz1US77dkI5P4w6LFv9bcaenA-7iiVBGvmA2G4C1bLpgFi9SoRNdQVdo
```

**??? í°??FIREBASE_TOKEN??Value?…ë‹ˆ??**

---

### **2. FIREBASE_SERVICE_ACCOUNT Value ?•ì¸**

#### **2-1. Firebase Console ?‘ì†**
1. https://console.firebase.google.com/project/wiz-coco/settings/serviceaccounts/adminsdk ?‘ì†
2. "Generate new private key" ë²„íŠ¼ ?´ë¦­
3. JSON ?Œì¼???¤ìš´ë¡œë“œ??

#### **2-2. ?¤ìš´ë¡œë“œ??JSON ?Œì¼ ?´ìš© ?•ì¸**
?¤ìš´ë¡œë“œ??JSON ?Œì¼??ë©”ëª¨?¥ìœ¼ë¡??´ì–´???„ì²´ ?´ìš©???•ì¸?˜ì„¸??

```json
{
  "type": "service_account",
  "project_id": "wiz-coco",
  "private_key_id": "3fbc430944e609b27bba866039d6e84b5c858f9d",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEVQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDLdWcnIURortrb\nvYNEVrEAtGH...",
  "client_email": "firebase-adminsdk-fbsvc@wiz-coco.iam.gserviceaccount.com",
  "client_id": "114963538509418531170",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40wiz-coco.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}
```

**??JSON ?„ì²´ ?´ìš©??FIREBASE_SERVICE_ACCOUNT??Value?…ë‹ˆ??**

---

### **3. Firebase ?´ë¼?´ì–¸???¤ì • Value ?•ì¸**

#### **3-1. Firebase Console ?‘ì†**
1. https://console.firebase.google.com/project/wiz-coco/settings/general ?‘ì†
2. "Your apps" ?¹ì…˜?ì„œ ?????¤ì • ?•ì¸

#### **3-2. ê°??¤ì •ê°??•ì¸**

| GitHub Secret Name | Value ?•ì¸ ?„ì¹˜ | ?¤ì œ ê°??ˆì‹œ |
|-------------------|----------------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Console ??General ??Your apps ??API Key | `AIzaSyC...` (?¤ì œ ê°? |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Console ??General ??Your apps ??Auth Domain | `wiz-coco.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Console ??General ??Your apps ??Project ID | `wiz-coco` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Console ??General ??Your apps ??Storage Bucket | `wiz-coco.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Console ??General ??Your apps ??Messaging Sender ID | `123456789` (?¤ì œ ê°? |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase Console ??General ??Your apps ??App ID | `1:123456789:web:abcdef` (?¤ì œ ê°? |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Firebase Console ??General ??Your apps ??Measurement ID | `G-XXXXXXXXXX` (?¤ì œ ê°? |

---

## **Value ë³µì‚¬ ë°©ë²•**

### **1. FIREBASE_TOKEN ë³µì‚¬**
?°ë??ì—???ì„±??? í°??ë§ˆìš°?¤ë¡œ ?œë˜ê·¸í•˜??? íƒ ??Ctrl+Cë¡?ë³µì‚¬

### **2. FIREBASE_SERVICE_ACCOUNT ë³µì‚¬**
?¤ìš´ë¡œë“œ??JSON ?Œì¼??ë©”ëª¨?¥ì—???´ì–´???„ì²´ ?´ìš©??Ctrl+Aë¡?? íƒ ??Ctrl+Cë¡?ë³µì‚¬

### **3. Firebase ?´ë¼?´ì–¸???¤ì •ê°?ë³µì‚¬**
Firebase Console?ì„œ ê°??¤ì •ê°’ì„ ?”ë¸”?´ë¦­?˜ì—¬ ?„ì²´ ? íƒ ??Ctrl+Cë¡?ë³µì‚¬

---

## **GitHub Secrets ?¤ì • ?¨ê³„**

### **1?¨ê³„: GitHub Secrets ?˜ì´ì§€ ?‘ì†**
1. https://github.com/jomigata/wiz-coco/settings/secrets/actions ?‘ì†
2. "New repository secret" ë²„íŠ¼ ?´ë¦­

### **2?¨ê³„: ê°?Secret ?¤ì •**

#### **FIREBASE_TOKEN ?¤ì •:**
- **Name**: `FIREBASE_TOKEN`
- **Value**: ?°ë??ì—???ì„±??? í° ë¶™ì—¬?£ê¸°
- **Add secret** ?´ë¦­

#### **FIREBASE_SERVICE_ACCOUNT ?¤ì •:**
- **Name**: `FIREBASE_SERVICE_ACCOUNT`
- **Value**: JSON ?Œì¼ ?„ì²´ ?´ìš© ë¶™ì—¬?£ê¸°
- **Add secret** ?´ë¦­

#### **Firebase ?´ë¼?´ì–¸???¤ì •:**
ê°ê° ê°œë³„?ìœ¼ë¡??¤ì •:
- **Name**: `NEXT_PUBLIC_FIREBASE_API_KEY`
- **Value**: Firebase Console?ì„œ ë³µì‚¬??API Key ë¶™ì—¬?£ê¸°
- **Add secret** ?´ë¦­

(?˜ë¨¸ì§€ ?¤ì •ê°’ë“¤???™ì¼??ë°©ë²•?¼ë¡œ ?¤ì •)

---

## ** ê´€??ë§í¬**

### **GitHub Secrets ?¤ì •:**
https://github.com/jomigata/wiz-coco/settings/secrets/actions

### **Firebase Console:**
- **General Settings**: https://console.firebase.google.com/project/wiz-coco/settings/general
- **Service Account**: https://console.firebase.google.com/project/wiz-coco/settings/serviceaccounts/adminsdk

---

## ** ë¬¸ì œ ?´ê²°**

### **ë¬¸ì œ 1: ? í°???ì„±?˜ì? ?ŠìŒ**
**?´ê²°ë°©ë²•:**
1. Firebase CLIê°€ ?¤ì¹˜?˜ì–´ ?ˆëŠ”ì§€ ?•ì¸: `npm install -g firebase-tools`
2. ?¤ì‹œ `firebase login:ci` ?¤í–‰

### **ë¬¸ì œ 2: JSON ?Œì¼???¤ìš´ë¡œë“œ?˜ì? ?ŠìŒ**
**?´ê²°ë°©ë²•:**
1. Firebase Console?ì„œ ?„ë¡œ?íŠ¸ ê¶Œí•œ ?•ì¸
2. "Generate new private key" ë²„íŠ¼ ?¤ì‹œ ?´ë¦­

### **ë¬¸ì œ 3: ?¤ì •ê°’ì´ ë³µì‚¬?˜ì? ?ŠìŒ**
**?´ê²°ë°©ë²•:**
1. ?¤ì •ê°’ì„ ?”ë¸”?´ë¦­?˜ì—¬ ?„ì²´ ? íƒ
2. Ctrl+Cë¡?ë³µì‚¬
3. ë©”ëª¨?¥ì— ë¶™ì—¬?£ê¸°?˜ì—¬ ?•ì¸

**?´ì œ ê°?Value ê°’ë“¤???•ì¸?˜ê³  GitHub Secrets???¤ì •?˜ì„¸??** ?? 
# ë¯¸ì„¤?•ëœ ë¶€ë¶??•ì¸ ë°??¤ì • ê°€?´ë“œ

## ?š¨ **?„ì¬ ë¯¸ì„¤?•ëœ ë¶€ë¶„ë“¤ ?•ì¸**

?´ì „ ?‘ì—…?¤ì—??ë¯¸ì„¤?•ë˜?ˆê±°???˜ëª»???¤ì •?¤ì„ ?˜ë‚˜?˜ë‚˜ ?•ì¸?˜ê³  ?¤ì •?˜ëŠ” ë°©ë²•???ˆë‚´?©ë‹ˆ??

---

## **1?¨ê³„: ?„ì¬ ?¤ì • ?íƒœ ?•ì¸**

### **1-1. GitHub Secrets ?¤ì • ?íƒœ ?•ì¸**
?¤ìŒ URL?ì„œ ?„ì¬ ?¤ì •??Secretsë¥??•ì¸?˜ì„¸??
```
https://github.com/jomigata/wiz-coco/settings/secrets/actions
```

### **1-2. ?„ìˆ˜ Secrets ëª©ë¡**
?¤ìŒ Secrets?¤ì´ ëª¨ë‘ ?¤ì •?˜ì–´ ?ˆëŠ”ì§€ ?•ì¸:

#### **ìµœìš°???„ìˆ˜ (ì¦‰ì‹œ ?¤ì • ?„ìš”):**
- [ ] `FIREBASE_TOKEN` ? ï¸ **?„ì¬ ë¯¸ì„¤??*
- [ ] `FIREBASE_SERVICE_ACCOUNT` ? ï¸ **?„ì¬ ë¯¸ì„¤??*

#### **Firebase ?´ë¼?´ì–¸???¤ì • (?„ìˆ˜):**
- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY`
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

---

## **2?¨ê³„: ë¯¸ì„¤?•ëœ ë¶€ë¶??¤ì •**

### **2-1. FIREBASE_TOKEN ?¤ì • (ìµœìš°??**

#### **2-1-1. Firebase CI ? í° ?ì„±**
?°ë??ì—???¤ìŒ ëª…ë ¹???¤í–‰:
```bash
firebase login:ci
```

#### **2-1-2. ?ì„±??? í° ?•ì¸**
?°ë??ì— ?œì‹œ?˜ëŠ” ? í°??ë³µì‚¬:
```
1//0gM4mpE8f4tcgCgYIARAAGBASNwF-L9Ir6U37YD5x_g8Fz1US77dkI5P4w6LFv9bcaenA-7iiVBGvmA2G4C1bLpgFi9SoRNdQVdo
```

#### **2-1-3. GitHub Secrets???¤ì •**
1. https://github.com/jomigata/wiz-coco/settings/secrets/actions ?‘ì†
2. "New repository secret" ?´ë¦­
3. **Name**: `FIREBASE_TOKEN`
4. **Value**: ?„ì—???ì„±??? í° ë¶™ì—¬?£ê¸°
5. "Add secret" ?´ë¦­

### **2-2. FIREBASE_SERVICE_ACCOUNT ?¤ì • (ìµœìš°??**

#### **2-2-1. Firebase Service Account JSON ?¤ìš´ë¡œë“œ**
1. Firebase Console ?‘ì†: https://console.firebase.google.com/project/wiz-coco/settings/serviceaccounts/adminsdk
2. "Generate new private key" ?´ë¦­
3. JSON ?Œì¼ ?¤ìš´ë¡œë“œ

#### **2-2-2. GitHub Secrets???¤ì •**
1. ?¤ìš´ë¡œë“œ??JSON ?Œì¼ ?´ê¸°
2. ?„ì²´ ?´ìš©??Ctrl+Aë¡?? íƒ ??Ctrl+Cë¡?ë³µì‚¬
3. https://github.com/jomigata/wiz-coco/settings/secrets/actions ?‘ì†
4. "New repository secret" ?´ë¦­
5. **Name**: `FIREBASE_SERVICE_ACCOUNT`
6. **Value**: ë³µì‚¬??JSON ?„ì²´ ?´ìš© ë¶™ì—¬?£ê¸°
7. "Add secret" ?´ë¦­

### **2-3. Firebase ?´ë¼?´ì–¸???¤ì •**

#### **2-3-1. Firebase Console?ì„œ ?¤ì •ê°?ë³µì‚¬**
1. https://console.firebase.google.com/project/wiz-coco/settings/general ?‘ì†
2. "Your apps" ?¹ì…˜?ì„œ ?????¤ì • ?•ì¸
3. ê°??¤ì •ê°?ë³µì‚¬

#### **2-3-2. GitHub Secrets???¤ì •**
ê°??¤ì •ê°’ì„ ê°œë³„?ìœ¼ë¡?GitHub Secrets???¤ì •:

| GitHub Secret Name | Firebase Console?ì„œ ë³µì‚¬??ê°?|
|-------------------|-------------------------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `wiz-coco.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `wiz-coco` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `wiz-coco.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Messaging Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | App ID |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Measurement ID |

---

## **3?¨ê³„: ?¤ì • ?„ë£Œ ?•ì¸**

### **3-1. GitHub Secrets ëª©ë¡ ?•ì¸**
https://github.com/jomigata/wiz-coco/settings/secrets/actions ?ì„œ ?¤ìŒ ??ª©?¤ì´ ëª¨ë‘ ?¤ì •?˜ì—ˆ?”ì? ?•ì¸:

- ??`FIREBASE_TOKEN`
- ??`FIREBASE_SERVICE_ACCOUNT`
- ??`NEXT_PUBLIC_FIREBASE_API_KEY`
- ??`NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- ??`NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- ??`NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- ??`NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- ??`NEXT_PUBLIC_FIREBASE_APP_ID`
- ??`NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

### **3-2. GitHub Actions ?¬ì‹¤??*
1. https://github.com/jomigata/wiz-coco/actions ?‘ì†
2. "Re-run jobs" ?´ë¦­
3. "Re-run all jobs" ?´ë¦­

---

## **4?¨ê³„: ë°°í¬ ?±ê³µ ?•ì¸**

### **4-1. GitHub Actions ë¡œê·¸ ?•ì¸**
1. ?Œí¬?Œë¡œ???¤í–‰ ?íƒœ ?•ì¸
2. ?±ê³µ ë©”ì‹œì§€ ?•ì¸

### **4-2. ë°°í¬???¬ì´???•ì¸**
1. https://wiz-coco.web.app ?‘ì†
2. ?¬ì´?¸ê? ?•ìƒ?ìœ¼ë¡?ë¡œë“œ?˜ëŠ”ì§€ ?•ì¸

---

## ?”— **ê´€??ë§í¬**

### **GitHub:**
- **Secrets Settings**: https://github.com/jomigata/wiz-coco/settings/secrets/actions
- **Actions**: https://github.com/jomigata/wiz-coco/actions

### **Firebase Console:**
- **General Settings**: https://console.firebase.google.com/project/wiz-coco/settings/general
- **Service Account**: https://console.firebase.google.com/project/wiz-coco/settings/serviceaccounts/adminsdk

### **ë°°í¬ ?•ì¸:**
- **ë©”ì¸ ?¬ì´??*: https://wiz-coco.web.app

---

## ?“ **ë¬¸ì œ ?´ê²°**

### **ë¬¸ì œ 1: FIREBASE_TOKEN???¤ì •?˜ì? ?ŠìŒ**
**?´ê²°ë°©ë²•:**
1. `firebase login:ci` ?¤í–‰
2. ?ì„±??? í°??GitHub Secrets???¤ì •

### **ë¬¸ì œ 2: FIREBASE_SERVICE_ACCOUNTê°€ ?¤ì •?˜ì? ?ŠìŒ**
**?´ê²°ë°©ë²•:**
1. Firebase Console?ì„œ ?œë¹„??ê³„ì • ???¤ìš´ë¡œë“œ
2. JSON ?„ì²´ ?´ìš©??GitHub Secrets???¤ì •

### **ë¬¸ì œ 3: Firebase ?´ë¼?´ì–¸???¤ì •ê°’ì´ ?†ìŒ**
**?´ê²°ë°©ë²•:**
1. Firebase Console?ì„œ ?????¤ì • ?•ì¸
2. ê°??¤ì •ê°’ì„ ë³µì‚¬?˜ì—¬ GitHub Secrets???¤ì •

### **ë¬¸ì œ 4: ê°’ì´ ?¬ë°”ë¥´ì? ?ŠìŒ**
**?´ê²°ë°©ë²•:**
1. Firebase Console?ì„œ ?¤ì •ê°??¬í™•??
2. ë³µì‚¬??ê°’ì´ ?¬ë°”ë¥¸ì? ?•ì¸
3. GitHub Secrets?ì„œ ê°??¬ì„¤??

---

## ??**?„ë£Œ ì²´í¬ë¦¬ìŠ¤??*

- [ ] FIREBASE_TOKEN ?¤ì • ?„ë£Œ
- [ ] FIREBASE_SERVICE_ACCOUNT ?¤ì • ?„ë£Œ
- [ ] NEXT_PUBLIC_FIREBASE_API_KEY ?¤ì • ?„ë£Œ
- [ ] NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?¤ì • ?„ë£Œ
- [ ] NEXT_PUBLIC_FIREBASE_PROJECT_ID ?¤ì • ?„ë£Œ
- [ ] NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?¤ì • ?„ë£Œ
- [ ] NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?¤ì • ?„ë£Œ
- [ ] NEXT_PUBLIC_FIREBASE_APP_ID ?¤ì • ?„ë£Œ
- [ ] NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?¤ì • ?„ë£Œ
- [ ] GitHub Actions ?¬ì‹¤???„ë£Œ
- [ ] ?ë™ ë°°í¬ ?±ê³µ ?•ì¸

---

## ?¯ **ìµœì¢… ê²°ê³¼**

ëª¨ë“  ?¤ì •???„ë£Œ?˜ë©´:
1. **GitHub??ì½”ë“œ ?¸ì‹œ ???ë™ ë°°í¬**
2. **Firebase Hosting???ë™ ?…ë°?´íŠ¸**
3. **https://wiz-coco.web.app ?ì„œ ìµœì‹  ë²„ì „ ?•ì¸ ê°€??*

---

## ?“… **?…ë°?´íŠ¸ ?¼ì‹œ**

- **ìµœì¢… ?…ë°?´íŠ¸**: 2025??1??27??
- **ë¡œì»¬ ë°°í¬ ?„ë£Œ**: 2025??1??27??
- **?ë™ ë°°í¬ ?¤ì •**: ì§„í–‰ ì¤?
- **?´ë‹¹??*: 30??ê²½ë ¥ ?„ë¬¸ê°€ ?€ (?€?¤íƒ ?„ë¡œê·¸ë˜ë¨? ?¹ë””?ì´?? ?¬ë¦¬?ë‹´?„ë¬¸ê°€) 
