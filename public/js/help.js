/**
 * Help page functionality
 * Provides:
 * - Sign out functionality
 * - User support features
 * - Documentation access
 */

const auth = firebase.auth()
document.getElementById("signOutBtn").onclick = () => auth.signOut().then(() => window.location.href = '/index.html');