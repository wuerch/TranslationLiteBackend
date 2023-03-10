const { getFirestore } = require('firebase-admin/firestore')
const serviceAccount = require('./firebaseServiceAccount.json')
const admin = require('firebase-admin');

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
});

const db = getFirestore()


async function verifyToken(token){
    try{
        const decodeValue = await admin.auth().verifyIdToken(token);
        if (decodeValue) {
            //console.log(decodeValue)
            return { uid: decodeValue.uid, email: decodeValue.email } 
        }else{
            return null
        }
    }catch(e){

    }
}

module.exports = {admin, db, verifyToken};