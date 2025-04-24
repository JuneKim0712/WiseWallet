/**
 * Database access and manipulation module
 * Handles all Firebase Firestore database operations including:
 * - Reading/writing transactions, income, expenses
 * - Managing categories
 * - User data access and authentication
 */

const db = firebase.firestore()

/**
 * Retrieves data from a specific collection for a user
 * @param {string} uid - User ID
 * @param {string} collec - Collection name
 * @returns {Promise<Array>} Array of documents from the collection
 */
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

/**
 * Adds a new expense record
 * @param {number} amount - Expense amount
 * @param {string} category - Expense category
 * @param {string} period - Time period
 * @param {string} uid - User ID
 */
export const addExpense = (amount, category, period, uid) => {
    db.collection('account').doc(`${uid}`).collection('expense').add({
        amount: amount,
        category: category,
        period: period
    })
}

/**
 * Adds a new income record
 * @param {number} amount - Income amount
 * @param {string} category - Income category
 * @param {string} period - Time period
 * @param {string} uid - User ID
 */
export const addIncome = (amount, category, period, uid) => {
    db.collection('account').doc(`${uid}`).collection('income').add({
        amount: amount,
        category: category,
        period: period
    })
}

/**
 * Adds a new transaction record
 * @param {number} amount - Transaction amount
 * @param {string} category - Transaction category
 * @param {Date} date - Transaction date
 * @param {string} type - Transaction type ('income' or 'expense')
 * @param {string} uid - User ID
 */
export const addTransaction = (amount, category, date, type, uid) => {
    db.collection('account').doc(`${uid}`).collection('transaction').add({
        amount: amount,
        category: category,
        date: date,
        type: type
    })
}

/**
 * Updates an existing transaction
 * @param {number} amount - New amount
 * @param {string} category - New category
 * @param {Date} date - New date
 * @param {string} type - Transaction type
 * @param {string} docId - Document ID to update
 * @param {string} uid - User ID
 */
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

/**
 * Deletes a document from a collection
 * @param {string} collec - Collection name
 * @param {string} docId - Document ID to delete
 * @param {string} uid - User ID
 */
export const deleteDoc = (collec, docId, uid) => {
    db.collection('account').doc(`${uid}`).collection(`${collec}`).doc(`${docId}`).delete()
}

/**
 * Deletes a transaction
 * @param {string} docId - Document ID to delete
 * @param {string} uid - User ID
 */
export const deleteTransaction = (docId, uid) => {
    return deleteDoc('transaction', docId, uid);
}

/**
 * Adds a custom category
 * @param {string} uid - User ID
 * @param {string} type - Category type ('income' or 'expense')
 * @param {string} category - Category name
 * @returns {Promise} Promise that resolves when category is added
 */
export const addCustomCategory = (uid, type, category) => {
    return db.collection('account').doc(uid).collection('categories').add({
        type: type,
        name: category,
        custom: true
    });
};

/**
 * Gets all custom categories for a user
 * @param {string} uid - User ID
 * @returns {Promise<Array>} Array of custom categories
 */
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

/**
 * Gets all categories (default + custom) organized by type
 * @param {string} uid - User ID
 * @returns {Promise<Object>} Object containing income and expense categories
 */
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

// Default category lists
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
