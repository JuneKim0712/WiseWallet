const db = firebase.firestore();
const auth = firebase.auth();
import * as process from "./preprocess.js";
import * as ref from "./db.js";
import * as plot from "./plot.js"
let uid;

// Add Goal Modal HTML
const modalHTML = `
  <div id="addGoalModal" class="fixed inset-0 bg-black bg-opacity-50 hidden opacity-0 pointer-events-none transition-opacity duration-300 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4 transform scale-95 transition-transform duration-300">
      <h2 class="text-2xl font-bold mb-6">Add New Goal</h2>
      <form id="goalForm" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Goal Name</label>
          <input type="text" id="goalName" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Target Amount ($)</label>
          <input type="number" id="goalAmount" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required min="0" step="0.01">
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <button type="button" id="cancelGoal" class="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
          <button type="submit" class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200">Create Goal</button>
        </div>
      </form>
    </div>
  </div>
`;

// Add modal to the document
document.body.insertAdjacentHTML('beforeend', modalHTML);

// Get modal elements
const addGoalModal = document.getElementById('addGoalModal');
const goalForm = document.getElementById('goalForm');
const cancelGoal = document.getElementById('cancelGoal');
const addGoalBtn = document.getElementById('addGoalBtn');

// Show modal function
const showModal = () => {
  addGoalModal.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
  addGoalModal.querySelector('.bg-white').classList.remove('scale-95');
  addGoalModal.querySelector('.bg-white').classList.add('scale-100');
  document.body.style.overflow = 'hidden';
};

// Hide modal function
const hideModal = () => {
  addGoalModal.classList.add('opacity-0', 'pointer-events-none');
  addGoalModal.querySelector('.bg-white').classList.remove('scale-100');
  addGoalModal.querySelector('.bg-white').classList.add('scale-95');
  setTimeout(() => {
    addGoalModal.classList.add('hidden');
  }, 300);
  document.body.style.overflow = '';
  goalForm.reset();
};

// Event Listeners
addGoalBtn.addEventListener('click', showModal);

cancelGoal.addEventListener('click', hideModal);

// Close modal when clicking outside
addGoalModal.addEventListener('click', (e) => {
  if (e.target === addGoalModal) {
    hideModal();
  }
});

goalForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const goalName = document.getElementById('goalName').value;
  const goalAmount = parseFloat(document.getElementById('goalAmount').value);
  
  if (!goalName || !goalAmount || goalAmount <= 0) {
    alert('Please enter valid goal name and amount');
    return;
  }

  try {
    // Add goal to Firestore
    await db.collection('users').doc(uid).collection('goals').add({
      name: goalName,
      target: goalAmount,
      current: 0,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // Close modal and refresh goals
    hideModal();
    initializeGoals();
  } catch (error) {
    console.error("Error adding goal:", error);
    alert("Failed to add goal. Please try again.");
  }
});

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    uid = user.uid;
    initializeGoals();
  } else {
    window.location.href = '/index.html';
  }
});

// Add Delete Confirmation Modal HTML
const deleteModalHTML = `
  <div id="deleteGoalModal" class="fixed inset-0 bg-black bg-opacity-50 hidden opacity-0 pointer-events-none transition-opacity duration-300 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4 transform scale-95 transition-transform duration-300">
      <div class="text-center">
        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
          <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Delete Goal</h3>
        <p class="text-sm text-gray-500 mb-6">Are you sure you want to delete this goal? This action cannot be undone.</p>
        <div class="flex justify-center gap-3">
          <button id="cancelDeleteGoal" class="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
          <button id="confirmDeleteGoal" class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200">Delete</button>
        </div>
      </div>
    </div>
  </div>
`;

// Add delete modal to the document
document.body.insertAdjacentHTML('beforeend', deleteModalHTML);

// Get delete modal elements
const deleteGoalModal = document.getElementById('deleteGoalModal');
const cancelDeleteGoal = document.getElementById('cancelDeleteGoal');
const confirmDeleteGoal = document.getElementById('confirmDeleteGoal');

let goalToDelete = null;

// Show delete modal function
const showDeleteModal = (goalId) => {
  goalToDelete = goalId;
  deleteGoalModal.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
  deleteGoalModal.querySelector('.bg-white').classList.remove('scale-95');
  deleteGoalModal.querySelector('.bg-white').classList.add('scale-100');
  document.body.style.overflow = 'hidden';
};

// Hide delete modal function
const hideDeleteModal = () => {
  deleteGoalModal.classList.add('opacity-0', 'pointer-events-none');
  deleteGoalModal.querySelector('.bg-white').classList.remove('scale-100');
  deleteGoalModal.querySelector('.bg-white').classList.add('scale-95');
  setTimeout(() => {
    deleteGoalModal.classList.add('hidden');
  }, 300);
  document.body.style.overflow = '';
  goalToDelete = null;
};

// Event Listeners for delete modal
cancelDeleteGoal.addEventListener('click', hideDeleteModal);

confirmDeleteGoal.addEventListener('click', async () => {
  if (!goalToDelete) return;

  try {
    await db.collection('users').doc(uid).collection('goals').doc(goalToDelete).delete();
    hideDeleteModal();
    initializeGoals();
  } catch (error) {
    console.error("Error deleting goal:", error);
    alert("Failed to delete goal. Please try again.");
  }
});

// Close delete modal when clicking outside
deleteGoalModal.addEventListener('click', (e) => {
  if (e.target === deleteGoalModal) {
    hideDeleteModal();
  }
});

const initializeGoals = async () => {
  try {
    while (!uid) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    
    // Get all transactions
    const transactions = await ref.access(uid, 'transaction');
    const sortedTransactions = process.sortTransactions(transactions);
    
    // Calculate current balance
    const balanceOverTimeData = process.genBalanceOverTime(sortedTransactions);
    const currentBalance = balanceOverTimeData.length > 0 ? balanceOverTimeData[balanceOverTimeData.length - 1].amount : 0;

    // Get goals from Firestore
    const goalsSnapshot = await db.collection('users').doc(uid).collection('goals').get();
    const goals = goalsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Clear existing goal cards
    const goalsContainer = document.getElementById('goalsGrid');
    goalsContainer.innerHTML = '';

    // Create goal cards
    goals.forEach((goal, index) => {
      const progress = Math.min((currentBalance / goal.target) * 100, 100);
      const remaining = Math.max(goal.target - currentBalance, 0);

      const goalCard = document.createElement('div');
      goalCard.className = 'goal-card bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 border border-gray-100';
      goalCard.style.animationDelay = `${index * 0.2}s`;
      goalCard.innerHTML = `
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold text-gray-800">${goal.name}</h2>
          <div class="flex items-center gap-2">
            <button class="delete-goal-btn p-2 text-gray-400 hover:text-red-500 transition-colors duration-200" data-goal-id="${goal.id}">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            <div class="goal-icon p-2 bg-blue-50 rounded-full">
              <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
          </div>
        </div>
        <div class="flex justify-center mb-8">
          <div class="relative w-32 h-32 progress-circle">
            <svg class="w-full h-full" viewBox="0 0 36 36">
              <path
                class="text-gray-100"
                stroke="currentColor"
                stroke-width="3"
                fill="none"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              ></path>
              <path
                class="text-blue-500 progress-path"
                stroke="currentColor"
                stroke-width="3"
                stroke-dasharray="${progress},100"
                fill="none"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              ></path>
            </svg>
            <div class="absolute inset-0 flex flex-col justify-center items-center">
              <span class="text-2xl font-bold progress-percent">${Math.round(progress)}%</span>
              <span class="text-sm text-gray-500">to goal</span>
            </div>
          </div>
        </div>
        <div class="goal-info space-y-4">
          <div class="flex justify-between items-center">
            <span class="text-gray-600">Current Savings</span>
            <span class="text-xl font-bold current-savings">$${formatNumberWithCommas(currentBalance)}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-600">Goal Amount</span>
            <span class="text-lg font-medium goal-amount">$${formatNumberWithCommas(goal.target)}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-600">Remaining</span>
            <span class="text-lg font-medium text-green-600 remaining-amount">$${formatNumberWithCommas(remaining)}</span>
          </div>
        </div>
      `;
      
      goalsContainer.appendChild(goalCard);

      // Add event listener for delete button
      const deleteBtn = goalCard.querySelector('.delete-goal-btn');
      deleteBtn.addEventListener('click', () => {
        showDeleteModal(goal.id);
      });
    });

    // If no goals exist, show a message
    if (goals.length === 0) {
      goalsContainer.innerHTML = `
        <div class="col-span-full text-center py-12">
          <div class="inline-block p-4 bg-blue-50 rounded-full mb-4">
            <svg class="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-gray-800 mb-2">No Goals Yet</h3>
          <p class="text-gray-600 mb-4">Start by creating your first financial goal</p>
          <button id="addFirstGoalBtn" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-300">
            Add Your First Goal
          </button>
        </div>
      `;

      // Add event listener for the "Add Your First Goal" button
      document.getElementById('addFirstGoalBtn').addEventListener('click', showModal);
    }

  } catch (error) {
    console.error("Error initializing goals:", error);
  }
};

// Helper function to format numbers with commas
const formatNumberWithCommas = (number) => {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

    