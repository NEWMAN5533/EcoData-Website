
export async function getUserData(uid) {

  const app = await 
  getDoc(doc(db, "users", uid));

  if(!snap.exists()) return null;

  return snap.data();
}