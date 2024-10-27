const auth = firebase.auth()

const signInBtn = document.getElementById('googleSignIn')

const provider = new firebase.auth.GoogleAuthProvider()

signInBtn.onclick = () => auth.signInWithPopup(provider)

auth.onAuthStateChanged(user => {
  if (user) {
    window.location.href = '/home.html'
  }
})
