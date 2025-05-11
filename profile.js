const BASE_URL = "http://localhost:1337";
const savedBooksContainer = document.querySelector("#saved-books");

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

    const books = res.data.toReadList || [];

    if (books.length === 0) {
      savedBooksContainer.innerHTML = "<p>Du har inga sparade böcker ännu.</p>";
      return;
    }

    savedBooksContainer.innerHTML = "";

    books.forEach(book => {
      const img = book.cover?.formats?.thumbnail?.url
        ? `${BASE_URL}${book.cover.formats.thumbnail.url}`
        : "";

      const card = document.createElement("div");
      card.classList.add("book-card");
      card.innerHTML = `
        <h3>${book.title}</h3>
        <p>Författare: ${book.author}</p>
        <p>Sidor: ${book.pages}</p>
        <p>Utgiven: ${book.published}</p>
        ${img ? `<img src="${img}" width="120" />` : ""}
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

  } catch (err) {
    console.error("❌ Kunde inte hämta sparade böcker:", err);
    alert("Fel vid hämtning av sparade böcker.");
  }
};

const removeBook = async (bookId) => {
  const token = sessionStorage.getItem("token");
  const userId = sessionStorage.getItem("userId");

  try {
    // Hämta användarens nuvarande lista
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
    fetchSavedBooks(); // Uppdatera vyn

  } catch (err) {
    console.error("❌ Kunde inte ta bort bok:", err);
    alert("Något gick fel vid borttagning.");
  }
};

const logout = () => {
  sessionStorage.clear();
  window.location.href = "index.html";
};

document.querySelector("#logout-btn").addEventListener("click", logout);
document.addEventListener("DOMContentLoaded", fetchSavedBooks);
