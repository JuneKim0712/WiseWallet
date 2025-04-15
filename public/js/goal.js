const db = firebase.firestore();
const auth = firebase.auth();
let uid;


firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    uid = user.uid;
  } else {
  }
});

    