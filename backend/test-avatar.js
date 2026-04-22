const http = require('http');

async function doTest() {
  const loginRes = await fetch("http://localhost:8080/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@helpdesk.com", password: "admin1234" })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;

  if(!token) { console.log('Login failed', loginData); return; }
  console.log("Token:", token ? "ok" : "fail");

  const updateRes = await fetch("http://localhost:8080/api/users/me", {
    method: "PUT",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    },
    body: JSON.stringify({ avatar: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==" })
  });
  const updateData = await updateRes.json();
  console.log("Update OK:", updateData.avatar ? "avatar present" : "missing avatar");
}
doTest();
