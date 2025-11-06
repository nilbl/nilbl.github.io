import { db, collection, addDoc, getDocs, query, orderBy, limit } from './firebaseConfig.js';

const COLLECTION_NAME = 'visitors';

/**
 * Add a new visitor to Firestore (GDPR Compliant)
 * Only stores country-level data, no precise location
 */
export async function addVisitor(location) {
    try {
        console.log('🔥 Firebase addVisitor called with:', location);
        console.log('🔥 Collection name:', COLLECTION_NAME);
        console.log('🔥 Database object:', db);

        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            country: location.country,
            countryCode: location.countryCode,
            timestamp: new Date().toISOString()
        });

        console.log('✅ Visitor country added to Firestore:', location.country);
        console.log('✅ Document ID:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('❌ Error adding visitor to Firestore:', error);
        console.error('❌ Error name:', error.name);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error stack:', error.stack);
        throw error;
    }
}

/**
 * Get all visitors from Firestore
 */
export async function getAllVisitors() {
    try {
        const q = query(collection(db, COLLECTION_NAME), orderBy('timestamp', 'asc'));
        const querySnapshot = await getDocs(q);

        const visitors = [];
        querySnapshot.forEach((doc) => {
            visitors.push({
                id: doc.id,
                ...doc.data()
            });
        });

        console.log('Fetched', visitors.length, 'visitors from Firestore');
        return visitors;
    } catch (error) {
        console.error('Error getting visitors from Firestore:', error);
        throw error;
    }
}

/**
 * Get the N most recent visitors from Firestore
 */
export async function getRecentVisitors(limitCount = 5) {
    try {
        const q = query(
            collection(db, COLLECTION_NAME),
            orderBy('timestamp', 'desc'),
            limit(limitCount)
        );
        const querySnapshot = await getDocs(q);

        const visitors = [];
        querySnapshot.forEach((doc) => {
            visitors.push({
                id: doc.id,
                ...doc.data()
            });
        });

        console.log('Fetched', visitors.length, 'recent visitors from Firestore');
        return visitors;
    } catch (error) {
        console.error('Error getting recent visitors from Firestore:', error);
        throw error;
    }
}
