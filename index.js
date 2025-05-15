const bookList = document.querySelector("#book-list");
const userInfo = document.querySelector("#user-info");

const isLoggedIn = () => !!sessionStorage.getItem("token");
const getUserId = () => sessionStorage.getItem("userId");
const getToken = () => sessionStorage.getItem("token");

/* Hämta alla böcker */
const renderBooks = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/api/books?pLevel`);
    const books = res.data.data || [];

    bookList.innerHTML = "";
    books.forEach(book => {
      bookList.appendChild(createBookCard(book));
    });

    bindBookActions();

  } catch {
    bookList.innerHTML = `
      <div class="error">
        <p>Kunde inte hämta böcker.</p>
      </div>
    `;
  }
};

/* Skapa ett bokkort och knappar */
const createBookCard = (book) => {
  const { id, title, author, pages, published, cover, rating } = book;

  let avgRating = "Ej betygsatt";
  if (Array.isArray(rating) && rating.length > 0) {
    const sum = rating.reduce((acc, r) => acc + (r.score || 0), 0);
    avgRating = (sum / rating.length).toFixed(1) + "/10";
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
    <p><strong>Betyg:</strong> ${avgRating}</p>
    ${imageUrl ? `<img src="${imageUrl}" width="120" alt="Bokomslag">` : ""}
    ${isLoggedIn() ? `
      <button data-id="${id}" class="save-btn">📌 Spara till Att läsa</button>
      <form class="rating-form" data-id="${id}">
        <label>Betygsätt (1-10):</label>
        <input type="number" min="1" max="10" required />
        <button type="submit">Skicka</button>
      </form>
    ` : ""}
  `;

  return card;
};

/* Event för spara och betygsättningsknappar */
const bindBookActions = () => {
  document.querySelectorAll(".save-btn").forEach(btn => {
    btn.addEventListener("click", () => saveBookToUser(btn.dataset.id));
  });

  document.querySelectorAll(".rating-form").forEach(form => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const bookId = form.dataset.id;
      const score = parseInt(form.querySelector("input").value);
      await submitRating(bookId, score);
    });
  });
};

/* Spara bok till toReadList */
const saveBookToUser = async (bookId) => {
  try {
    const res = await axios.get(`${BASE_URL}/api/users/${getUserId()}?pLevel`, {
      headers: { Authorization: `Bearer ${getToken() }` }
    });

    const currentList = res.data.toReadList?.map(book => book.id) || [];

    if (currentList.includes(Number(bookId))) {
      alert("Boken finns redan i din lista.");
      return;
    }

    currentList.push(Number(bookId));

    await axios.put(`${BASE_URL}/api/users/${getUserId()}`, {
  toReadList: {
    connect: currentList
  }
}, {
  headers: { Authorization: `Bearer ${getToken()}` }
});

    alert("📚 Bok sparad!");

  } catch {
    alert("Kunde inte spara bok.");
  }
};

/* Skicka in ett betyg */
const submitRating = async (bookId, score) => {
  try {
    const existing = await axios.get(`${BASE_URL}/api/ratings?filters[user][id][$eq]=${getUserId()}&filters[book][id][$eq]=${bookId}&pLevel=1`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });

    if (existing.data.data.length > 0) {
      alert("Du har redan betygsatt denna bok.");
      return;
    }

    await axios.post(`${BASE_URL}/api/ratings`, {
      data: {
        score,
        user: {
          connect: [getUserId()]
        },
        book: {
          connect: [bookId]
        }
      }
    }, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });

    alert("Tack för ditt betyg!");

  } catch {
    alert("Det gick inte att spara betyget.");
  }
};

/* Logga ut användare */
const logout = () => {
  sessionStorage.clear();
  location.reload();
};



/* starta sidan */
const init = async () => {
  await loadTheme();
  await renderBooks();

  if (isLoggedIn()) {
    const username = sessionStorage.getItem("username");
    userInfo.textContent = `Välkommen ${username}`;
    document.querySelector('a[href="auth.html"]').style.display = "none";
  } else {
  document.querySelector('#logout-btn').style.display = "none";
  document.querySelector('a[href="profile.html"]').style.display = "none";
}
};

document.querySelector("#logout-btn").addEventListener("click", logout);
document.addEventListener("DOMContentLoaded", init);
