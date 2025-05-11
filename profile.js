const BASE_URL = "http://localhost:1337";
const savedBooksContainer = document.querySelector("#saved-books");
const sortSelect = document.querySelector("#sort-select");

const fetchSavedBooks = async () => {
  const token = sessionStorage.getItem("token");
  const userId = sessionStorage.getItem("userId");

  if (!token || !userId) {
    alert("Du måste vara inloggad.");
    window.location.href = "index.html";
    return;
  }

  try {
    const res = await axios.get(`${BASE_URL}/api/users/${userId}?populate=toReadList.cover`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    let books = res.data.toReadList || [];

    // Sortering
    const sortBy = sortSelect.value;
    if (sortBy === "title") {
      books.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "author") {
      books.sort((a, b) => a.author.localeCompare(b.author));
    }

    if (books.length === 0) {
      savedBooksContainer.innerHTML = "<p>Du har inga sparade böcker ännu.</p>";
      return;
    }

    savedBooksContainer.innerHTML = "";
    const latest = document.querySelector("#sort-select")?.value || "";
    if (!latest) {
    books.reverse(); // Nyaste sist i listan → först på sidan
    }
    books.forEach(book => {
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
        ${img ? `<img src="${img}" width="120" alt="Bokomslag" />` : ""}
        <button class="remove-btn" data-id="${book.id}">❌ Ta bort</button>
      `;
      savedBooksContainer.appendChild(card);
    });

    document.querySelectorAll(".remove-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const bookId = btn.dataset.id;
        await removeBook(bookId);
      });
    });

  } catch {
    alert("Fel vid hämtning av sparade böcker.");
  }
};

const removeBook = async (bookId) => {
  const token = sessionStorage.getItem("token");
  const userId = sessionStorage.getItem("userId");

  try {
    const res = await axios.get(`${BASE_URL}/api/users/${userId}?populate=toReadList`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const currentList = res.data.toReadList.map(book => book.id);
    const updatedList = currentList.filter(id => id !== Number(bookId));

    await axios.put(`${BASE_URL}/api/users/${userId}`, {
      toReadList: updatedList
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    alert("Bok borttagen från listan.");
    fetchSavedBooks();

  } catch {
    alert("Kunde inte ta bort bok.");
  }
};

const logout = () => {
  sessionStorage.clear();
  window.location.href = "index.html";
};

document.querySelector("#logout-btn").addEventListener("click", logout);
sortSelect.addEventListener("change", fetchSavedBooks);
document.addEventListener("DOMContentLoaded", fetchSavedBooks);
