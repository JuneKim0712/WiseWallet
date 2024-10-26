const auth =firebase.auth()
export const genSummary  = (range, transaction, uid) => {
    db.collection('coll').doc('doc').collection('subcoll').get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            console.log(`${doc.id} => ${doc.data().amount}`);
        });
    });
}