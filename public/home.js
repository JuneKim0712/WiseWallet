import * as util from "./preprocess.js"
import * as ref from "./db.js"
const db = firebase.firestore()
const auth = firebase.auth()
const projectionChart = document.getElementById('projectedBalance');
const balanceSummary = document.getElementById('balanceSummary');
const uid = 12;


//button assignmnet
document.getElementById("signOutBtn").onclick = () => auth.signOut().then(window.location.href = '/index.html')


const test = async () => {
  ref.addExpense(100, 2, uid)
  ref.addIncome(50, 1, uid)
  ref.addIncome(150, 4, uid)
  ref.addIncome(1500, 12, uid)
  ref.addTransaction(22, new Date(), "income", uid)
  for (let i = 1; i < 12; i++) {
    for (let j = 1; j < 28; j++) {
      ref.addTransaction((i * j + 120) / 2, new Date(2024, i, j), "expense", uid)
      if ((j + i) % 12 == 0) {
        ref.addTransaction(i * j * 1000, new Date(2024, i, j), "income", uid)
      }
    }
  }
}

const plotProjection = (chart, data, period) => {
  new Chart(chart, {
    type: 'line',
    data: {
      labels: Array.from({ length: period }, (_, index) => index + 1),
      datasets: [{
        label: 'Balance',
        data: data,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        borderWidth: 2,
        tension: 0.1
      }]
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: 'Balance Projected Over Time',
          font: { size: 18 }
        }
      },
      scales: {
        x: {
          type: 'category',
          title: { display: true, text: 'Month passed', font: { size: 14 } }
        },
        y: {
          title: { display: true, text: 'Balance ($)', font: { size: 14 } }
        }
      }
    }
  });
}

const plotBalance = (chart, data) => {
  new Chart(chart, {
    type: 'line',
    data: {
      labels: data.map(item => new Date(item.x.seconds * 1000)
        .toISOString().split('T')[0]),
      datasets: [{
        label: 'Balance',
        data: data.map(entry => entry.y),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        borderWidth: 2,
        tension: 0.1
      }]
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: 'Balance Over Time',
          font: { size: 18 }
        }
      },
      scales: {
        x: {
          type: 'category',
          title: { display: true, text: 'Date', font: { size: 14 } }
        },
        y: {
          title: { display: true, text: 'Balance ($)', font: { size: 14 } }
        }
      }
    }
  });
}

const listTransactions = (transactions) => {
  const tableBody = document.querySelector("#transactionTable tbody");
  tableBody.innerHTML = "";  // Clear existing rows

  transactions.forEach(transaction => {
    const row = document.createElement("tr");
    const dateCell = document.createElement("td");

    dateCell.textContent = new Date(transaction.date.seconds * 1000)
      .toISOString().split('T')[0];
    row.appendChild(dateCell);

    const amountCell = document.createElement("td");

    amountCell.textContent = transaction.amount;
    amountCell.style.color = transaction.category === "income" ? "blue" : "red";
    row.appendChild(amountCell);

    tableBody.appendChild(row);
  });
};


const sortTransactions = (transactions) => {
  const sortedTransactions = transactions.sort((a, b) => a.date.seconds - b.date.seconds);
  return sortedTransactions
};

let expense = await ref.access(uid, 'expense')
let income = await ref.access(uid, 'income')
let transactions = sortTransactions(await ref.access(uid, 'transaction'))

const projectedBalanceData = util.genProjectedBalance(income, expense, 0, 120)
const balanceOverTimeData = util.genBalanceOverTime(transactions);

plotProjection(projectionChart, projectedBalanceData, 120)
plotBalance(balanceSummary, balanceOverTimeData);
listTransactions(transactions);
test()