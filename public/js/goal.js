const db = firebase.firestore();
const auth = firebase.auth();
import * as process from "./preprocess.js";
import * as ref from "./db.js";
import * as plot from "./plot.js"
let uid;

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    uid = user.uid;
    initializeGoals();
  } else {
    // Handle user not logged in
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

    // Define goals
    const goals = [
      { name: "New Car Fund", target: 37000 },
      { name: "Vacation Fund", target: 5000 },
      { name: "Emergency Fund", target: 10000 }
    ];

    // Update each goal card
    goals.forEach((goal, index) => {
      const progress = Math.min((currentBalance / goal.target) * 100, 100);
      const remaining = Math.max(goal.target - currentBalance, 0);

      // Update progress circle
      const progressPath = document.querySelectorAll('.progress-path')[index];
      progressPath.setAttribute('stroke-dasharray', `${progress},100`);

      // Update percentage text
      const percentText = document.querySelectorAll('.progress-percent')[index];
      percentText.textContent = `${Math.round(progress)}%`;

      // Update current savings
      const currentSavings = document.querySelectorAll('.current-savings')[index];
      currentSavings.textContent = `$${formatNumberWithCommas(currentBalance)}`;

      // Update goal amount
      const goalAmount = document.querySelectorAll('.goal-amount')[index];
      goalAmount.textContent = `of $${formatNumberWithCommas(goal.target)} goal`;

      // Update remaining amount
      const remainingAmount = document.querySelectorAll('.remaining-amount')[index];
      remainingAmount.textContent = `$${formatNumberWithCommas(remaining)} remaining`;
    });

  } catch (error) {
    console.error("Error initializing goals:", error);
  }
};

// Helper function to format numbers with commas
const formatNumberWithCommas = (number) => {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

    