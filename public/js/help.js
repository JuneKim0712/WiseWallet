const auth = firebase.auth()
document.getElementById("signOutBtn").onclick = () => auth.signOut().then(() => window.location.href = '/index.html');