const BASE_URL = "http://localhost:1337";

// DOM-element
const bookList = document.querySelector("#book-list");

// Skapar ett bok-kort för DOM:en
const createBookCard = (book) => {
    const { title, author, pages, published, cover, rating } = book;
  
    // Snittbetyg
    let averageRating = "Ej betygsatt";
    if (Array.isArray(rating) && rating.length > 0) {
      const sum = rating.reduce((acc, r) => acc + (r.score || 0), 0);
      averageRating = (sum / rating.length).toFixed(1) + "/10";
    }
  
    // Bild
    let imageUrl = "";

    if (cover?.formats?.medium?.url) {
      imageUrl = `${BASE_URL}${cover.formats.medium.url}`;
    } else if (cover?.formats?.thumbnail?.url) {
      imageUrl = `${BASE_URL}${cover.formats.thumbnail.url}`;
    } else if (cover?.url) {
      imageUrl = `${BASE_URL}${cover.url}`;
    }
    
    // Kort
    const card = document.createElement("div");
    card.classList.add("book-card");
    card.innerHTML = `
      <h2>${title}</h2>
      <p><strong>Författare:</strong> ${author}</p>
      <p><strong>Sidor:</strong> ${pages}</p>
      <p><strong>Utgiven:</strong> ${published}</p>
      <p><strong>Betyg:</strong> ${averageRating}</p>
      ${imageUrl ? `<img src="${imageUrl}" width="120" alt="Bokomslag">` : ""}
      ${localStorage.getItem("token") ? `<button data-id="${book.id}" class="save-btn">📌 Spara till Att läsa</button>` : ""}

    `;
    return card;
  };

// Hämta och rendera alla böcker
const renderBooks = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/api/books?pLevel`, {
      headers: {
        Accept: "application/json"
      }
    });

    const books = response.data?.data || [];
    console.log("Böcker:", books);

    bookList.innerHTML = "";

    books.forEach(book => {
      bookList.appendChild(createBookCard(book));
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
  document.querySelectorAll(".save-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const bookId = e.target.dataset.id;
      const token = sessionStorage.getItem("token");
      const userProfileId = sessionStorage.getItem("userProfileId");

  
      try {
        await axios.put(`${BASE_URL}/api/user-profiles/${userProfileId}`, {
          data: {
            toReadList: {
              connect: [bookId]
            }
          }
        }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
  
        alert("Bok sparad i Att läsa-listan 📚");
      } catch (err) {
        console.error("Fel vid sparning:", err);
        alert("Det gick inte att spara boken.");
      }
    });
  });
};

// Hämta och applicera aktivt färgtema
const loadTheme = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/api/themes?filters[active][$eq]=true`);
    const activeTheme = response.data.data[0]?.name || "light";
    applyTheme(activeTheme);
  } catch (err) {
    console.error("Fel vid hämtning av tema:", err);
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

const register = async () => {
  const username = document.querySelector("#register-username").value;
  const email = document.querySelector("#register-email").value;
  const password = document.querySelector("#register-password").value;

  try {
    const response = await axios.post(`${BASE_URL}/api/auth/local/register`, {
      username,
      email,
      password,
    });

    console.log("Registrerad:", response.data);
    alert("Registrering lyckades!");
  } catch (err) {
    console.error("Fel vid registrering:", err.response.data);
    alert("Registrering misslyckades: " + err.response.data.error.message);
  }
};

const login = async () => {
  const identifier = document.querySelector("#login-identifier").value;
  const password = document.querySelector("#login-password").value;

  try {
    // 🔐 1. Logga in
    const res = await axios.post(`${BASE_URL}/api/auth/local`, {
      identifier,
      password,
    });

    const jwt = res.data.jwt;
    sessionStorage.setItem("token", jwt);

    // 👤 2. Hämta användaren
    const userRes = await axios.get(`${BASE_URL}/api/users/me`, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      }
    });

    const user = userRes.data;
    document.querySelector("#user-info").textContent = `Inloggad som: ${user.username}`;
    sessionStorage.setItem("userId", user.id);
    sessionStorage.setItem("username", user.username);

    // ✅ Klar – inget mer!
    console.log("✅ Inloggad som", user.username);

  } catch (err) {
    console.error("❌ Fel vid inloggning:", err.response?.data || err);
    alert("Inloggning misslyckades.");
  }
};

const logout = () => {
  sessionStorage.clear();
  location.reload(); // eller redirect om du har en separat login.html
};


// Event listeners
document.querySelector("#register-btn").addEventListener("click", register);
document.querySelector("#login-btn").addEventListener("click", login);
document.querySelector("#logout-btn").addEventListener("click", logout);


// Initiera sidan
document.addEventListener("DOMContentLoaded", async () => {
  await loadTheme();
  await renderBooks();
});
