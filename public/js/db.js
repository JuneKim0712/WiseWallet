const db = firebase.firestore()

export const access = (uid, collec) => {
    return new Promise((resolve, reject) => {
        db.collection('account').doc(`${uid}`).collection(`${collec}`).get()
            .then((querySnapshot) => {
                const partners = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    partners.push({ id: doc.id, ...data });
                });
                resolve(partners); // Resolve the promise with the data
            })
            .catch((error) => {
                console.error("Error accessing collection:", collec, "for user:", uid, error);
                reject(error); // Reject the promise if there's an error
            });
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

export const addCustomCategory = (uid, type, category) => {
  return db.collection('account').doc(uid).collection('categories').add({
    type: type,
    name: category,
    custom: true
  });
};

export const getCustomCategories = (uid) => {
  return new Promise((resolve, reject) => {
    db.collection('account').doc(uid).collection('categories').get()
      .then((querySnapshot) => {
        const categories = [];
        querySnapshot.forEach((doc) => {
          categories.push({ id: doc.id, ...doc.data() });
        });
        resolve(categories);
      })
      .catch(reject);
  });
};

export const getAllCategories = async (uid) => {
  try {
    // Get custom categories from Firestore
    const customCats = await getCustomCategories(uid);
    
    // Organize categories by type
    const categories = {
      income: [...incomeCategories],
      expense: [...expenseCategories]
    };

    // Add custom categories to appropriate type
    customCats.forEach(cat => {
      if (cat.custom && !categories[cat.type].includes(cat.name)) {
        categories[cat.type].push(cat.name);
      }
    });

    // Sort both arrays alphabetically (case-insensitive)
    categories.income.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    categories.expense.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

    return categories;
  } catch (error) {
    console.error("Error getting all categories:", error);
    throw error;
  }
};

const incomeCategories = [
  "Salary",
  "Freelance/Contract Work",
  "Investments",
  "Gifts",
  "Rental Income",
  "Business Income",
  "Other"
];

const expenseCategories = [
  "Rent",
  "Insurance/Bills",
  "Utilities",
  "Subscription",
  "Groceries",
  "Personal Expenses",
  "Transportation",
  "Healthcare",
  "Entertainment",
  "Education",
  "Other"
];

export { incomeCategories, expenseCategories };
