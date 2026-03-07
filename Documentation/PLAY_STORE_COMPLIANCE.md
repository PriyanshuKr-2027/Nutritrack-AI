# NutriTrack AI — Google Play Store Compliance Guide
**Version:** 1.0 | **Date:** March 2026

---

## ✅ Pre-Submission Checklist

Use this checklist **before** submitting to Play Store to avoid rejection.

```
Documentation:
□ Privacy Policy created and hosted on public URL
□ Terms of Service created
□ Medical disclaimer written

Play Console Setup:
□ Health apps declaration form completed
□ Data Safety section filled completely
□ All permissions justified (camera, mic, internet)
□ Age rating: 13+ selected
□ Content rating questionnaire completed
□ AI-generated content disclosed

In-App Requirements:
□ Medical disclaimer shown on first launch
□ Privacy Policy linked in Settings
□ "Delete Account" button implemented
□ "Export Data" button implemented (GDPR)
□ First-time camera permission: Privacy notice shown
□ First-time mic permission: Privacy notice shown

App Store Listing:
□ Description includes AI disclosure
□ No misleading health claims in description
□ Screenshots don't make medical claims
□ Category: Health & Fitness selected
```

---

## 1. Privacy Policy (CRITICAL - Will Be Rejected Without)

### **Requirements:**

✅ Must be hosted on public, non-editable URL  
✅ Must be linked in Play Console AND in app (Settings screen)  
✅ Must cover all data collection and usage  

### **Quick Generator Tools:**

- https://www.privacypolicygenerator.info
- https://www.termsfeed.com/privacy-policy-generator
- https://app-privacy-policy-generator.firebaseapp.com

### **Required Sections for NutriTrack AI:**

```markdown
# Privacy Policy for NutriTrack AI

Last updated: [DATE]

## 1. Introduction
NutriTrack AI ("we", "our", "us") provides a nutrition tracking mobile application.
This Privacy Policy explains how we collect, use, and protect your information.

## 2. Data We Collect

### 2.1 Personal Information
- Name
- Age
- Weight and height (for goal calculation)
- Gender
- Email address (for account authentication)

### 2.2 Health & Fitness Data
- Nutrition logs (calories, protein, carbs, fat)
- Meal timestamps and photos
- Weight goals and activity level

### 2.3 Photos
- Food photos captured via camera
- Sent to Groq AI for food identification
- NOT stored permanently on our servers
- Deleted immediately after AI processing

### 2.4 Audio Recordings
- Voice recordings for food logging (Hinglish support)
- Sent to Groq Whisper for transcription
- Audio files deleted immediately after transcription
- Only transcript text is stored

### 2.5 Technical Data
- Device type and operating system
- App version and usage analytics
- Crash reports (via Expo/Sentry)

## 3. How We Use Your Data

- Calculate personalized nutrition goals
- Track daily food intake
- Identify food from photos via AI (Groq Vision API)
- Transcribe voice recordings (Groq Whisper API)
- Improve app functionality and user experience
- Provide customer support

## 4. Third-Party Services

We share data with the following third-party services:

### 4.1 Groq (AI Processing)
- Purpose: Food detection from photos, voice transcription
- Data shared: Photos (temporary), audio (temporary)
- Privacy policy: https://groq.com/privacy

### 4.2 OpenRouter (Backup AI)
- Purpose: Backup food detection when Groq is unavailable
- Data shared: Photos (temporary)
- Privacy policy: https://openrouter.ai/privacy

### 4.3 OpenFoodFacts (Nutrition Database)
- Purpose: Barcode product lookup
- Data shared: Barcode numbers only
- Privacy policy: https://world.openfoodfacts.org/privacy

### 4.4 Supabase (Data Storage)
- Purpose: Store user account, nutrition logs, database
- Data shared: All user data
- Privacy policy: https://supabase.com/privacy

## 5. Data Retention

- **Photos:** Processed immediately, NOT stored
- **Audio:** Transcribed immediately, then deleted
- **Nutrition logs:** Stored indefinitely until account deletion
- **Account data:** Stored until you delete your account

## 6. Your Rights

You have the right to:
- Access your data (Profile → Export Data)
- Delete your data (Profile → Delete Account)
- Opt out of AI features (use Manual Entry only)
- Request data correction

## 7. Data Security

- All data encrypted in transit (HTTPS/TLS)
- Database access protected by Row Level Security (RLS)
- API keys stored securely on server (never in app)
- No third-party data selling

## 8. Children's Privacy

NutriTrack AI is not intended for children under 13.
We do not knowingly collect data from children under 13.

## 9. International Users

Data is processed in [YOUR REGION].
By using NutriTrack AI, you consent to data transfer to this region.

## 10. Changes to This Policy

We may update this policy.
Changes will be posted in-app and on this page.
Last updated date shown at top.

## 11. Contact Us

Email: [YOUR EMAIL]
Website: [YOUR WEBSITE]

## 12. GDPR Compliance (EU Users)

Under GDPR, you have rights to:
- Data portability
- Right to be forgotten
- Data access requests

Contact us to exercise these rights.
```

### **Where to Host:**

- Option 1: GitHub Pages (free, easy)
- Option 2: Your website /privacy-policy
- Option 3: Google Sites (free)

**DO NOT use:** Google Docs (editable, not acceptable)

---

## 2. Data Safety Section (Play Console)

### **Navigate to:** Play Console → App Content → Data Safety

### **Declare the following:**

#### **Data Types Collected:**

| Data Type | Collected? | Required/Optional | Purpose | Shared? |
|---|---|---|---|---|
| **Photos** | ✅ Yes | Optional | Food detection via AI | ✅ Yes (Groq API) |
| **Audio** | ✅ Yes | Optional | Voice food logging | ✅ Yes (Groq API) |
| **Name** | ✅ Yes | Required | User profile | ❌ No |
| **Email** | ✅ Yes | Required | Authentication | ❌ No |
| **Health & Fitness** | ✅ Yes | Required | Nutrition tracking | ❌ No |
| **Body measurements** | ✅ Yes | Required | Goal calculation | ❌ No |
| **Location** | ❌ No | — | — | — |
| **Device ID** | ❌ No | — | — | — |

#### **Data Security:**

- [x] Data is encrypted in transit
- [x] Users can request data deletion
- [ ] Data is encrypted at rest (optional - Supabase handles this)

#### **Detailed Explanations:**

**Photos:**
- **Why collected:** "Used to identify food items via AI vision. Required for photo logging feature."
- **How used:** "Sent to Groq API for processing. Not permanently stored."
- **Shared with:** "Groq (AI processing provider)"
- **Can users opt out:** "Yes - use manual entry or voice logging instead"

**Audio:**
- **Why collected:** "Used to transcribe Hinglish (Hindi + English) food logs."
- **How used:** "Sent to Groq Whisper for transcription. Audio deleted after transcription."
- **Shared with:** "Groq (AI processing provider)"
- **Can users opt out:** "Yes - use photo or manual entry instead"

**Health & Fitness:**
- **Why collected:** "Track nutrition intake (calories, protein, carbs, fat)."
- **How used:** "Calculate daily progress toward nutrition goals."
- **Shared with:** "No third parties"
- **Can users opt out:** "No - core feature of app"

---

## 3. Health Apps Declaration (Mandatory)

### **Navigate to:** Play Console → App Content → Health apps declaration

### **Questions & Answers:**

**Q: Does your app have health features?**  
A: Yes → Nutrition tracking and diet management

**Q: Does your app access Health Connect?**  
A: No

**Q: Provide justification for health features:**  
A: 
```
NutriTrack AI helps users track dietary intake and manage nutrition goals.
Features include:
- AI-powered food detection from photos
- Voice logging in Hinglish (Hindi + English)
- Barcode scanning for packaged foods
- Manual food entry with IFCT (Indian Food Composition Tables) database
- Daily calorie and macro tracking

The app does NOT:
- Access Health Connect or body sensors
- Provide medical diagnosis or treatment
- Recommend medications or supplements
- Replace professional medical advice
```

**Q: Is your app a medical device?**  
A: No

**Q: Is your app regulated by any health authority?**  
A: No

---

## 4. Medical Disclaimer (Required In-App)

### **Where to Show:**

1. ✅ Onboarding welcome screen (first launch)
2. ✅ Settings → About → Medical Disclaimer
3. ✅ Play Store description (short version)

### **Full Text:**

```typescript
const MEDICAL_DISCLAIMER = `
⚕️ MEDICAL DISCLAIMER

NutriTrack AI is for informational and fitness purposes only.

NOT A SUBSTITUTE FOR:
• Professional medical advice
• Diagnosis or treatment of medical conditions
• Dietitian or nutritionist consultation
• Diabetes management or insulin dosing
• Treatment of eating disorders

ACCURACY LIMITATIONS:
• AI food detection may not be 100% accurate
• Nutrition data is estimated from databases
• Always verify nutrition data for medical decisions
• Consult healthcare provider for medical diet plans

DISCLAIMER:
NutriTrack AI is a fitness and wellness tracking tool.
It is NOT a medical device and is NOT regulated by any health authority.

By using this app, you acknowledge:
- This is a fitness tracking tool, not medical advice
- You will consult healthcare professionals for medical nutrition needs
- The developers are not liable for health decisions based on app data

If you have a medical condition, eating disorder, or are pregnant,
consult your doctor before using this app.
`;
```

### **Implementation:**

```typescript
// OnboardingWelcomeScreen.tsx
<Modal visible={showDisclaimer}>
  <ScrollView style={styles.disclaimerCard}>
    <Icon name="shield-alert" size={48} color="red" />
    <Text style={styles.title}>Important Notice</Text>
    <Text style={styles.body}>{MEDICAL_DISCLAIMER}</Text>
    
    <Checkbox
      value={acceptedDisclaimer}
      onValueChange={setAcceptedDisclaimer}
      label="I understand and accept"
    />
    
    <Button
      title="Continue"
      disabled={!acceptedDisclaimer}
      onPress={() => setShowDisclaimer(false)}
    />
  </ScrollView>
</Modal>
```

---

## 5. AI-Generated Content Disclosure (NEW 2026)

### **Google's New Requirement:**

Apps using AI must disclose this clearly.

### **Play Store Description (Add This):**

```
🤖 AI-POWERED FEATURES:

This app uses artificial intelligence for:
• Food identification from photos (Groq Llama Vision AI)
• Voice transcription for Hinglish logging (Groq Whisper)
• Nutrition data estimation when not in verified database

AI-estimated nutrition data may not be 100% accurate.
Verified nutrition data comes from IFCT (Indian Food Composition Tables)
and USDA databases.
```

### **In-App (Optional):**

```typescript
// On MultiItemConfirmView, show small indicator
{food.source === 'ai_generated' && (
  <View style={styles.aiTag}>
    <Icon name="sparkles" size={10} />
    <Text style={styles.aiText}>AI-estimated</Text>
  </View>
)}
```

---

## 6. Permissions Justification

### **Permissions Requested:**

```xml
<!-- AndroidManifest.xml -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.INTERNET" />
```

### **Play Console Justifications:**

| Permission | Why Needed | User-Facing Explanation |
|---|---|---|
| `CAMERA` | "Required to photograph food for AI identification and scan nutrition labels/barcodes" | "NutriTrack needs camera access to identify food from photos and scan product barcodes" |
| `RECORD_AUDIO` | "Required for voice logging in Hinglish (Hindi + English mixed speech)" | "NutriTrack needs microphone access to log food via voice (supports Hinglish)" |
| `INTERNET` | "Required to sync nutrition data, process AI requests, and authenticate users" | "NutriTrack needs internet to sync your data and use AI features" |

### **Runtime Permission Requests:**

```typescript
// First time camera accessed
const { status } = await Camera.requestCameraPermissionsAsync();
if (status !== 'granted') {
  showAlert(
    'Camera Permission Required',
    'NutriTrack needs camera access to identify food from photos. You can also use voice or manual entry instead.'
  );
}

// First time microphone accessed
const { status } = await Audio.requestPermissionsAsync();
if (status !== 'granted') {
  showAlert(
    'Microphone Permission Required',
    'NutriTrack needs microphone access for voice logging. You can also use photos or manual entry instead.'
  );
}
```

---

## 7. Content Rating

### **Recommended Rating:**

- **ESRB:** Everyone 13+
- **PEGI:** PEGI 3 (or 12+ to be safe)
- **Reason:** Health/fitness apps can create body image concerns for young children

### **Questionnaire Answers:**

**Violence:** No  
**Sex/Nudity:** No  
**Language:** No  
**Controlled Substances:** No (just tracks food)  
**Gambling:** No  
**User Interaction:** No (v1 has no social features)  
**Shares Location:** No  
**Digital Purchases:** Yes (when you add premium tier in v2)

---

## 8. Feature Graphic & Screenshots

### **Requirements:**

**Feature Graphic:**
- 1024 x 500 px
- Must NOT include:
  - Medical claims ("Cure diabetes")
  - False promises ("Lose 10kg in 1 week")
  - Before/after weight loss photos

**Screenshots (minimum 2, recommended 8):**
- 1080 x 1920 px (portrait)
- Show actual app functionality
- Must NOT show fake data or unrealistic results

**Safe Screenshots:**
- Dashboard with realistic daily intake
- Photo detection flow (before/after)
- Voice logging interface
- Trends charts
- Barcode scanning
- Manual entry
- Meal history

---

## 9. App Description Guidelines

### **❌ DON'T Say:**

- "Lose weight fast"
- "Doctor-approved nutrition"
- "Medically accurate"
- "Cure diseases"
- "FDA approved" (it's not)
- "Guaranteed results"
- "Replace your dietitian"

### **✅ DO Say:**

- "Track your nutrition goals"
- "AI-powered food logging for Indian meals"
- "Monitor daily calorie and macro intake"
- "Built for Indian food with IFCT database"
- "For fitness and wellness purposes"
- "Supports Hinglish voice logging"

### **Example Good Description:**

```
NutriTrack AI - Perfect for India 🇮🇳

Track nutrition the smart way! Designed specifically for Indian meals.

✨ FEATURES:
• AI food detection - Snap a photo, get instant nutrition
• Hinglish voice logging - "Dal chawal khaya" works!
• Thali intelligence - Detects multiple Indian foods from one photo
• Barcode scanning - Instant nutrition for packaged foods
• IFCT database - 528+ verified Indian foods
• Auto-add system - Database grows as you use it

🎯 PERFECT FOR:
• Gym enthusiasts tracking macros
• Anyone monitoring calorie intake
• People who eat Indian home food
• Users who want zero-friction logging

🤖 AI-POWERED:
Uses AI for food detection and voice transcription.
Nutrition data from verified databases (IFCT, USDA) and AI estimates.

⚕️ DISCLAIMER:
For fitness and wellness purposes only.
Not a medical device. Not a substitute for professional advice.
Consult healthcare provider for medical nutrition needs.

Download now and start tracking! 🚀
```

---

## 10. Delete Account & Data Export (GDPR)

### **Required Features:**

**Delete Account:**
```typescript
// In ProfileView or Settings
<Button
  title="Delete My Account"
  onPress={async () => {
    Alert.alert(
      'Delete Account?',
      'This will permanently delete all your data. This cannot be undone.',
      [
        { text: 'Cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // Delete all user data
            await supabase.from('meals').delete().eq('user_id', userId);
            await supabase.from('custom_foods').delete().eq('user_id', userId);
            await supabase.from('profiles').delete().eq('id', userId);
            await supabase.auth.signOut();
            // Delete auth user (requires service role key - use Edge Function)
          }
        }
      ]
    );
  }}
/>
```

**Export Data:**
```typescript
<Button
  title="Export My Data"
  onPress={async () => {
    const { data: profile } = await supabase.from('profiles').select().single();
    const { data: meals } = await supabase.from('meals').select('*, meal_items(*)');
    
    const exportData = {
      profile,
      meals,
      exported_at: new Date().toISOString()
    };
    
    const jsonString = JSON.stringify(exportData, null, 2);
    // Share as file or email
    await Share.share({
      message: jsonString,
      title: 'NutriTrack Data Export'
    });
  }}
/>
```

---

## 11. Pre-Launch Testing Checklist

Before submission, test these scenarios:

```
User Flow Tests:
□ New user: Sign up → Onboarding → See disclaimer → Accept → Dashboard
□ Log meal via photo → AI detection works → Nutrition shows → Save
□ Log meal via voice (Hinglish) → Transcription works → Save
□ Scan barcode → Product found in OpenFoodFacts → Save
□ Scan nutrition label → OCR extracts values → Save
□ Search manually → Find food → Save
□ View Dashboard → Today's meals shown → Macros correct
□ View History → Past days shown → Can tap for details
□ View Trends → Charts shown correctly
□ Delete meal → Removed from Dashboard
□ Export data → JSON file generated
□ Delete account → All data removed → Logged out

Permission Tests:
□ Deny camera → Error message shown → Suggests alternatives
□ Deny microphone → Error message shown → Suggests alternatives
□ No internet → Offline message shown → Manual/label still works

Privacy Tests:
□ Privacy policy link works (Settings)
□ Medical disclaimer shown on first launch
□ User must accept disclaimer to proceed
□ AI disclosure shown where appropriate

Error Handling:
□ All API errors show user-friendly messages
□ Network failures handled gracefully
□ Invalid inputs validated before saving
```

---

## 12. Submission Timeline

**Typical approval time:** 2-7 days

**Steps:**
1. Complete all checklist items above
2. Upload APK/AAB to Play Console
3. Fill all required forms
4. Submit for review
5. Monitor for rejection/approval email

**If rejected:**
- Read rejection reason carefully
- Fix specific issues mentioned
- Resubmit (usually approved within 24 hours after fix)

---

## 13. Common Rejection Reasons (Avoid These)

1. ❌ **No privacy policy** → Add hosted URL
2. ❌ **Medical claims** → Add disclaimer, remove claims
3. ❌ **Missing data safety info** → Fill completely
4. ❌ **No health declaration** → Complete form
5. ❌ **AI not disclosed** → Add to description
6. ❌ **Permissions not justified** → Explain each one
7. ❌ **Inappropriate content rating** → Choose 13+
8. ❌ **Misleading screenshots** → Show real app

---

## ✅ Final Pre-Submission Checklist

```
Day Before Submission:
□ All code complete and tested
□ Privacy policy live on public URL
□ Medical disclaimer in app
□ All Play Console forms filled
□ Screenshots prepared (8 total)
□ Feature graphic uploaded
□ App description written (includes AI disclosure)
□ Delete account feature implemented
□ Export data feature implemented
□ Test all permission requests
□ Test all error states
□ Verify no API keys in APK (use apktool to check)

Ready to submit! 🚀
```

---

*Play Store Compliance Guide v1.0 — NutriTrack AI*
*Follow this checklist to avoid rejection and ensure smooth approval*
