/* Registrera ny användare */
const register = async () => {
  const username = document.querySelector("#register-username").value;
  const email = document.querySelector("#register-email").value;
  const password = document.querySelector("#register-password").value;

  try {
    await axios.post(`${BASE_URL}/api/auth/local/register`, {
      username, email, password
    });

    alert("Registrering lyckades!");
  } catch {
    alert("Fel vid registrering.");
  }
};

/* Logga in användare */
const login = async () => {
  const identifier = document.querySelector("#login-identifier").value;
  const password = document.querySelector("#login-password").value;

  try {
    const response = await axios.post(`${BASE_URL}/api/auth/local`, {
      identifier, password
    });

    const jwt = response.data.jwt;
    sessionStorage.setItem("token", jwt);

    const userRes = await axios.get(`${BASE_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${jwt}` }
    });

    const user = userRes.data;
    sessionStorage.setItem("userId", user.id);
    sessionStorage.setItem("username", user.username);

    alert(`Välkommen, ${user.username}!`);
    window.location.href = "index.html";

  } catch {
    alert("Inloggning misslyckades.");
  }
};

/* Starta */
document.addEventListener("DOMContentLoaded", () => {
    loadTheme()
    const loginBtn = document.querySelector("#login-btn");
  if (loginBtn) loginBtn.addEventListener("click", login);
  const registerBtn = document.querySelector("#register-btn");
  if (registerBtn) registerBtn.addEventListener("click", register);

  
});
