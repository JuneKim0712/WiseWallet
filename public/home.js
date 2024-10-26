import * as util from "./calculator.js"
const db = firebase.firestore()
const auth = firebase.auth()

document.getElementById("signOutBtn").onclick = () => auth.signOut().then(window.location.href = '/index.html')

util.genSummaryWeek()