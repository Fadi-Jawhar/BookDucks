const BASE_URL = "http://localhost:1337";
const bookList = document.querySelector("#book-list");

// Skapa bokkort
const createBookCard = (book) => {
  const { title, author, pages, published, cover, rating } = book;

  let averageRating = "Ej betygsatt";
  if (Array.isArray(rating) && rating.length > 0) {
    const sum = rating.reduce((acc, r) => acc + (r.score || 0), 0);
    averageRating = (sum / rating.length).toFixed(1) + "/10";
  }

  let imageUrl = "";
  if (cover?.formats?.medium?.url) {
    imageUrl = `${BASE_URL}${cover.formats.medium.url}`;
  } else if (cover?.formats?.thumbnail?.url) {
    imageUrl = `${BASE_URL}${cover.formats.thumbnail.url}`;
  } else if (cover?.url) {
    imageUrl = `${BASE_URL}${cover.url}`;
  }

  const card = document.createElement("div");
  card.classList.add("book-card");
  card.innerHTML = `
    <h2>${title}</h2>
    <p><strong>Författare:</strong> ${author}</p>
    <p><strong>Sidor:</strong> ${pages}</p>
    <p><strong>Utgiven:</strong> ${published}</p>
    <p><strong>Betyg:</strong> ${averageRating}</p>
    ${imageUrl ? `<img src="${imageUrl}" width="120" alt="Bokomslag">` : ""}
    ${sessionStorage.getItem("token") ? `<button data-id="${book.id}" class="save-btn">📌 Spara till Att läsa</button>` : ""}
  `;
  return card;
};

// Spara bok till inloggad användare
const saveBookToUser = async (bookId) => {
  const token = sessionStorage.getItem("token");
  const userId = sessionStorage.getItem("userId");

  if (!token || !userId) return alert("Du måste vara inloggad");

  try {
    // Hämta användare och toReadList
    const res = await axios.get(`${BASE_URL}/api/users/${userId}?populate=toReadList`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const currentList = res.data.toReadList?.map(book => book.id) || [];

    if (currentList.includes(Number(bookId))) {
      alert("Boken finns redan i din lista.");
      return;
    }

    currentList.push(bookId);

    //  Uppdatera användaren
    //     await axios.put(`${BASE_URL}/api/users/${userId}`, {
    //   data: {
    //     toReadList: currentList
    //   }
    // }, {
    //   headers: { Authorization: `Bearer ${token}` }
    // });
    await axios.put(`${BASE_URL}/api/users/${userId}`, {
      toReadList: currentList
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    alert("📚 Bok sparad!");

  } catch {
    alert("Kunde inte spara bok.");
  }
};

// Rendera böcker
const renderBooks = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/api/books?populate=*`);
    const books = response.data.data || [];

    bookList.innerHTML = "";
    books.forEach(book => {
      bookList.appendChild(createBookCard(book));
    });

    // Event listeners för spara-knappar
    document.querySelectorAll(".save-btn").forEach(btn => {
      btn.addEventListener("click", () => saveBookToUser(btn.dataset.id));
    });

  } catch (err) {
    console.error("Fel vid hämtning av böcker:", err);
    bookList.innerHTML = `
      <div class="error">
        <p>Kunde inte hämta böcker. Kontrollera API:t eller CORS.</p>
        <button onclick="window.location.reload()">Försök igen</button>
      </div>
    `;
  }
};

// Registrera ny användare
const register = async () => {
  const username = document.querySelector("#register-username").value;
  const email = document.querySelector("#register-email").value;
  const password = document.querySelector("#register-password").value;

  try {
    await axios.post(`${BASE_URL}/api/auth/local/register`, {
      username,
      email,
      password
    });

    alert("Registrering lyckades!");
  } catch {
    alert("Fel vid registrering.");
  }
};

// Logga in
const login = async () => {
  const identifier = document.querySelector("#login-identifier").value;
  const password = document.querySelector("#login-password").value;

  try {
    const response = await axios.post(`${BASE_URL}/api/auth/local`, {
      identifier,
      password
    });

    const jwt = response.data.jwt;
    sessionStorage.setItem("token", jwt);

    const userRes = await axios.get(`${BASE_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${jwt}` }
    });

    const user = userRes.data;
    sessionStorage.setItem("userId", user.id);
    sessionStorage.setItem("username", user.username);
    document.querySelector("#user-info").textContent = `Inloggad som: ${user.username}`;

    location.reload();

  } catch {
    alert("Inloggning misslyckades.");
  }
};

// Logga ut
const logout = () => {
  sessionStorage.clear();
  location.reload();
};

//  Ladda färgtema
const loadTheme = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/api/themes?filters[active][$eq]=true`);
    const theme = res.data.data[0]?.name || "light";
    applyTheme(theme);
  } catch {
    applyTheme("light");
  }
};

const applyTheme = (theme) => {
  const root = document.documentElement;
  if (theme === "dark") {
    root.style.setProperty("--bg", "#1e1e1e");
    root.style.setProperty("--text", "#f5f5f5");
    root.style.setProperty("--primary", "#333");
  } else if (theme === "sepia") {
    root.style.setProperty("--bg", "#f4ecd8");
    root.style.setProperty("--text", "#5b4636");
    root.style.setProperty("--primary", "#a58c6f");
  } else {
    root.style.setProperty("--bg", "#ffffff");
    root.style.setProperty("--text", "#000000");
    root.style.setProperty("--primary", "#0055aa");
  }
};

// Event listeners
document.querySelector("#register-btn").addEventListener("click", register);
document.querySelector("#login-btn").addEventListener("click", login);
document.querySelector("#logout-btn").addEventListener("click", logout);

//  starta
document.addEventListener("DOMContentLoaded", async () => {
  await loadTheme();
  await renderBooks();

  const username = sessionStorage.getItem("username");
  if (username) {
    document.querySelector("#user-info").textContent = `Inloggad som: ${username}`;
  }
});
