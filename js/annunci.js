// 🔹 URL del JSON esterno
const API_URL = "https://aulab-hackademy.s3.eu-south-1.amazonaws.com/lessons/tXasAV97Cu9XyP8rdiT1H28fWdGfuVC4sBRaMlIE.json";

// 🔹 Contenitore dove verranno mostrati gli annunci
const lista = document.getElementById("lista-annunci");

// 🔹 Funzione asincrona
async function caricaAnnunci() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("Errore nella risposta HTTP");

    const dati = await res.json();

    lista.innerHTML = dati.map(item => `
      <div class="col-12 col-md-6">
        <div class="card shadow-sm border-0 rounded-4 h-100">
          <div class="card-body">
            <h5 class="card-title">${item.title || "Annuncio"}</h5>
            <p class="card-text">${item.description || "Contenuto non disponibile"}</p>
          </div>
        </div>
      </div>
    `).join('');

  } catch (err) {
    console.error("Errore fetch:", err);
    lista.innerHTML = `<p class="text-danger"></p>`;
  }
}

// 🔹 Esegui al caricamento della pagina
caricaAnnunci();
