const db = firebase.firestore()

export const access = (uid, collec) => {
    return db.collection('account').doc(`${uid}`).collection(`${collec}`).get().then((querySnapshot) => {
        const partners = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            partners.push({ id: doc.id, ...data });
        });
        return partners;
    });
};


export const addExpense = (amount, period, uid) => {
    db.collection('account').doc(`${uid}`).collection('expense').add({
        amount: amount,
        period: period
    })
}

export const addIncome = (amount, period, uid) => {
    db.collection('account').doc(`${uid}`).collection('income').add({
        amount: amount,
        period: period
    })
}

export const addTransaction = (amount, date, category, uid) => {
    db.collection('account').doc(`${uid}`).collection('transaction').add({
        amount: amount,
        date: date,
        category: category
    })
}

export const updateTransaction = (amount, date, category, docId, uid) => {
    db.collection('account').doc(`${uid}`).collection('transaction').doc(`${docId}`).set({
        amount: amount,
        date: date,
        category: category
    })
}

export const updateExpense = (amount, period, docId, uid) => {
    db.collection('account').doc(`${uid}`).collection('expense').doc(`${docId}`).set({
        amount: amount,
        period: period
    })
}

export const updateIncome = (amount, period, docId, uid) => {
    db.collection('account').doc(`${uid}`).collection('income').doc(`${docId}`).set({
        amount: amount,
        period: period
    })
}

export const deleteDoc = (collec, docId, uid) => {
    db.collection('account').doc(`${uid}`).collection(`${collec}`).doc(`${docId}`).delete()
}
