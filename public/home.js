import * as util from "./calculator.js"
import * as ref from "./db.js"
const db = firebase.firestore()
const auth = firebase.auth()

document.getElementById("signOutBtn").onclick = () => auth.signOut().then(window.location.href = '/index.html')


const uid = 12;
ref.addExpense(123, 2, uid)
ref.addIncome(324, 1, uid)
ref.addTransaction(22, new Date(), "expense", uid)
ref.access(uid, 'expense').then((partners) => {
    console.log(partners)
})
ref.access(uid, 'income').then((partners) => {
    console.log(partners)
})
ref.access(uid, 'transaction').then((partners) => {
    console.log(partners)
})

ref.updateTransaction(33, new Date(), "income", 'LxS50LCUUJRsFmyFy8Kk', uid)

ref.updateExpense(33, 32, '0uuYJoTgi8rFGAT086Qk', uid)
ref.updateIncome(33, 11, 'G8vsScs0tnfzmISliUDZ', uid)

await new Promise(r => setTimeout(r, 2000));
ref.deleteDoc( 'expense', '0uuYJoTgi8rFGAT086Qk',uid)
ref.deleteDoc('transaction','LxS50LCUUJRsFmyFy8Kk',  uid)
ref.deleteDoc( 'income', 'G8vsScs0tnfzmISliUDZ',uid)