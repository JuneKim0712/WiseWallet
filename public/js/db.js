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


export const addExpense = (amount, category, period, uid) => {
    db.collection('account').doc(`${uid}`).collection('expense').add({
        amount: amount,
        category: category,
        period: period
    })
}

export const addIncome = (amount, category, period, uid) => {
    db.collection('account').doc(`${uid}`).collection('income').add({
        amount: amount,
        category: category,
        period: period
    })
}

export const addTransaction = (amount, category, date, type, uid) => {
    db.collection('account').doc(`${uid}`).collection('transaction').add({
        amount: amount,
        category: category,
        date: date,
        type: type
    })
}

export const updateTransaction = (amount, category, date, type, docId, uid) => {
    db.collection('account').doc(`${uid}`).collection('transaction').doc(`${docId}`).set({
        amount: amount,
        category: category,
        date: date,
        type: type
    })
}

export const updateExpense = (amount, category, period, docId, uid) => {
    db.collection('account').doc(`${uid}`).collection('expense').doc(`${docId}`).set({
        amount: amount,
        category: category,
        period: period
    })
}

export const updateIncome = (amount, category, period, docId, uid) => {
    db.collection('account').doc(`${uid}`).collection('income').doc(`${docId}`).set({
        amount: amount,
        category: category,
        period: period
    })
}

export const deleteDoc = (collec, docId, uid) => {
    db.collection('account').doc(`${uid}`).collection(`${collec}`).doc(`${docId}`).delete()
}
