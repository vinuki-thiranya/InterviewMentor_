# Firebase Setup Instructions

## Firestore Indexes

To resolve the Firestore index error, you need to create composite indexes. You have two options:

### Option 1: Use Firebase Console (Recommended)
1. Click the link provided in the error message to directly create the index:
   ```
   https://console.firebase.google.com/v1/r/project/mockmate-4464b/firestore/indexes
   ```
2. This will automatically create the required index for `userId` (Ascending) and `createdAt` (Descending)

### Option 2: Deploy indexes using Firebase CLI
1. Install Firebase CLI if not already installed:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project (if not already done):
   ```bash
   firebase init firestore
   ```

4. Deploy the indexes:
   ```bash
   firebase deploy --only firestore:indexes
   ```

## Firestore Security Rules
Deploy the security rules to ensure proper data access:
```bash
firebase deploy --only firestore:rules
```

## Note
The current code has been updated to work without requiring the composite index by sorting results in memory. However, for better performance with large datasets, you should still create the composite indexes using one of the methods above.