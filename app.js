
// Configuración
const SHEET_ID = "18wi9tMsuE-vjOo--FCJFQUtifgLxcwFGZ-VKvvO99vM";
const URL_SHEET = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;

// REEMPLAZA ESTO CON TU URL DE "EJECUTAR" (LA QUE TERMINA EN /exec)
const IMPL_ID = "AKfycbw8JxobKOMlDbIQuD55xdYXTWCcGh0apyj6nnQq8pDIGCXpBR4b2b4a7eq72wk8uD2ZxQ";
const URL_SCRIPT_GOOGLE = `https://script.google.com/macros/s/${IMPL_ID}/exec`;

const CICLO_ESTADOS = ["Disponible", "No Disponible", "Incompleto"];

async function readSheet() {
  try {
    // CORRECCIÓN: Ahora usamos URL_SHEET
    const response = await fetch(URL_SHEET);
    if (!response.ok) throw new Error("No se pudo obtener respuesta de Google");

    const text = await response.text();
    console.log(text);
    const inicio = text.indexOf("{");
    console.log(inicio);
    const fin = text.lastIndexOf("}") + 1;
    console.log(fin);
    const jsonString = text.substring(inicio, fin);
    console.log(jsonString);
    const jsonData = JSON.parse(jsonString);
    console.log(jsonData);
    const filas = jsonData.table.rows;

    const contenedor = document.getElementById("contenedor-objetos");
    if (!contenedor) return;

    contenedor.innerHTML = "";

    filas.forEach((fila) => {
      const nombre = fila.c && fila.c[0] ? fila.c[0].v : "Sin nombre";
      const estadoActual = fila.c && fila.c[1] ? fila.c[1].v : "Desconocido";

      // Verificamos si es un título (ignorando mayúsculas/minúsculas y espacios)
      if (String(estadoActual).toLowerCase().trim() === "titulo") {
        const encabezado = document.createElement("h2");
        encabezado.className = "titulo-seccion";
        encabezado.textContent = nombre;
        contenedor.appendChild(encabezado);
      } else {
        // Si no es título, se crea la fila normal con botón
        const div = document.createElement("div");
        div.className = "fila-objeto";
        const claseEstado = changeState(String(estadoActual));

        div.innerHTML = `
                    <span class="nombre">${nombre}</span>
                    <div class="estado-container">
                        <button class="btn-accion ${claseEstado}" 
                            onclick="rotarEstado('${nombre}', '${estadoActual}', this)">
                            ${estadoActual}
                        </button>
                    </div>
                `;
        contenedor.appendChild(div);
      }
    });
  } catch (error) {
    console.error("Error cargando la hoja:", error);
  }
}

/* FUNCIÓN NUEVA: Cambia el estado en la web y lo envía a Google */

async function rotarEstado(nombre, estadoActual, boton) {
  // 1. Encontrar el siguiente estado en el array
  let indice = CICLO_ESTADOS.indexOf(estadoActual);
  if (indice === -1) indice = 0;
  const nuevoEstado = CICLO_ESTADOS[(indice + 1) % CICLO_ESTADOS.length];

  // 2. Cambio Visual "Optimista" (se ve el cambio antes de que Google responda)
  boton.textContent = "...";
  boton.className = `btn-accion ${changeState(nuevoEstado)}`;

  // 3. Envío de datos al Script de Google
  try {
    const urlFinal = `${URL_SCRIPT_GOOGLE}?nombre=${encodeURIComponent(
      nombre
    )}&estado=${encodeURIComponent(nuevoEstado)}`;

    // El modo 'no-cors' es vital para evitar errores de seguridad de Google Apps Script
    await fetch(urlFinal, { mode: "no-cors" });

    // Actualizamos el botón con el texto final y el nuevo evento onclick
    boton.textContent = nuevoEstado;
    boton.setAttribute(
      "onclick",
      `rotarEstado('${nombre}', '${nuevoEstado}', this)`
    );
  } catch (e) {
    console.error("Error al actualizar:", e);
    alert("No se pudo guardar el cambio. Reintenta.");
    readSheet(); // Recargar para mostrar el estado real de la hoja
  }
}

function changeState(texto) {
  if (!texto || typeof texto !== "string") return "desconocido";
  const t = texto.toLowerCase().trim();
  if (t.includes("no disponible")) return "no-disponible";
  if (t.includes("disponible")) return "disponible";
  if (t.includes("incompleto")) return "incompleto";
  return "desconocido";
}

readSheet();
setInterval(readSheet, 1000);