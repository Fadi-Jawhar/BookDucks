const savedBooksContainer = document.querySelector("#saved-books");
const ratedBooksContainer = document.querySelector("#rated-books");
const sortSelect = document.querySelector("#sort-select");
const ratingSortSelect = document.querySelector("#rating-sort-select");
const logoutBtn = document.querySelector("#logout-btn");
const userInfo = document.querySelector("#user-info");

let savedBooks = [];
let ratedBooks = [];

/* Hämta användarens profil och rendera */
const fetchProfileData = async () => {
  const token = sessionStorage.getItem("token");
  const userId = sessionStorage.getItem("userId");

  if (!token || !userId) {
    alert("Du måste vara inloggad.");
    window.location.href = "index.html";
    return;
  }

  try {
    // Hämta användarinfo + sparade böcker
    const userRes = await axios.get(`${BASE_URL}/api/users/${userId}?pLevel`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const user = userRes.data;
    savedBooks = user.toReadList || [];

    // Hämta betyg
    const ratingsRes = await axios.get(`${BASE_URL}/api/ratings?filters[user][id][$eq]=${userId}&pLevel`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    ratedBooks = ratingsRes.data.data || [];

    renderSavedBooks(sortBooks(savedBooks, "latest"));
    renderRatedBooks(sortRatings(ratedBooks, "score"));
    bindRemoveButtons();

  } catch {
    alert("Det gick inte att hämta användardata.");
  }
};


/* Visa sparade böcker */
const renderSavedBooks = (books) => {
  savedBooksContainer.innerHTML = "";
  if (books.length === 0) {
    savedBooksContainer.innerHTML = "<p>Inga sparade böcker ännu.</p>";
    return;
  }

  books.forEach((book) => {
    const img = book.cover?.formats?.thumbnail?.url
      ? `${BASE_URL}${book.cover.formats.thumbnail.url}`
      : "";

    const card = document.createElement("div");
    card.classList.add("book-card");
    card.innerHTML = `
      <h3>${book.title}</h3>
      <p><strong>Författare:</strong> ${book.author}</p>
      <p><strong>Sidor:</strong> ${book.pages}</p>
      <p><strong>Utgiven:</strong> ${book.published}</p>
      ${img ? `<img src="${img}" width="120" alt="Bokomslag">` : ""}
      <button class="remove-btn" data-id="${book.id}">❌ Ta bort</button>
    `;
    savedBooksContainer.appendChild(card);
  });
};

/* Visa betygsatta böcker */
const renderRatedBooks = (ratings) => {
  ratedBooksContainer.innerHTML = "";
  if (ratings.length === 0) {
    ratedBooksContainer.innerHTML = "<p>Du har inte betygsatt några böcker.</p>";
    return;
  }

  ratings.forEach(({ book, score }) => {
    const img = book?.cover?.formats?.thumbnail?.url
      ? `${BASE_URL}${book.cover.formats.thumbnail.url}`
      : "";

    const card = document.createElement("div");
    card.classList.add("book-card");
    card.innerHTML = `
      <h3>${book.title}</h3>
      <p><strong>Författare:</strong> ${book.author}</p>
      <p><strong>Sidor:</strong> ${book.pages}</p>
      <p><strong>Utgiven:</strong> ${book.published}</p>
      <p><strong>Ditt betyg:</strong> ${score}/10</p>
      ${img ? `<img src="${img}" width="120" alt="Bokomslag">` : ""}
    `;
    ratedBooksContainer.appendChild(card);
  });
};

/* Sortering */
const sortBooks = (books, sortBy) => {
  const sorted = [...books];
  if (sortBy === "title") return sorted.sort((a, b) => a.title.localeCompare(b.title));
  if (sortBy === "author") return sorted.sort((a, b) => a.author.localeCompare(b.author));
  if (sortBy === "latest") return sorted.reverse();
  return sorted;
};

const sortRatings = (ratings, sortBy) => {
  const sorted = [...ratings];
  if (sortBy === "title") return sorted.sort((a, b) => a.book.title.localeCompare(b.book.title));
  if (sortBy === "author") return sorted.sort((a, b) => a.book.author.localeCompare(b.book.author));
  if (sortBy === "score") return sorted.sort((a, b) => b.score - a.score);
  if (sortBy === "latest") return sorted.reverse();
  return sorted;
};

/*Ta bort sparad bok */
const bindRemoveButtons = () => {
  document.querySelectorAll(".remove-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const bookId = btn.dataset.id;
      await removeBook(bookId);
    });
  });
};

/* Ta bort bok från toReadList */
const removeBook = async (bookId) => {
  const token = sessionStorage.getItem("token");
  const userId = sessionStorage.getItem("userId");

  try {
    const res = await axios.get(`${BASE_URL}/api/users/${userId}?pLevel`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const currentList = res.data.toReadList.map((book) => book.id);
    const updatedList = currentList.filter((id) => id !== Number(bookId));

    await axios.put(`${BASE_URL}/api/users/${userId}`, {
      toReadList: updatedList
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    alert("Boken togs bort.");
    fetchProfileData();
  } catch {
    alert("Kunde inte ta bort.");
  }
};

/* Logga ut */
const logout = () => {
  sessionStorage.clear();
  window.location.href = "index.html";
};

/* Starta sidan */
const init = async () => {
  await loadTheme();
  const username = sessionStorage.getItem("username");
    userInfo.textContent = `${username + "s"} Profil `
  logoutBtn.addEventListener("click", logout);

  sortSelect.addEventListener("change", () => {
    const sorted = sortBooks(savedBooks, sortSelect.value);
    renderSavedBooks(sorted);
    bindRemoveButtons();
  });

  ratingSortSelect.addEventListener("change", () => {
    const sorted = sortRatings(ratedBooks, ratingSortSelect.value);
    renderRatedBooks(sorted);
  });

  fetchProfileData();
};

document.addEventListener("DOMContentLoaded", init);




