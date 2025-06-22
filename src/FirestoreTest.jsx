import { useState, useEffect } from "react";
import { db } from "./firebase/config.js";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc
} from "firebase/firestore";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval
} from "date-fns";

function CalendarioLateral({ onSeleccionarFecha }) {
  const dias = eachDayOfInterval({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date())
  });

  return (
    <div style={{ background: "#2c2c2c", color: "#fff", padding: "20px", borderRadius: "8px", fontSize: "14px" }}>
      <h3>🗕️ Calendario</h3>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gap: "4px",
        marginTop: "10px"
      }}>
        {dias.map((dia) => (
          <div
            key={dia.toISOString()}
            onClick={() => onSeleccionarFecha(format(dia, "yyyy-MM-dd"))}
            style={{
              padding: "6px",
              background: "#3a3a3a",
              textAlign: "center",
              borderRadius: "4px",
              cursor: "pointer"
            }}
            title="Haz clic para marcar esta fecha"
          >
            {format(dia, "d")}
          </div>
        ))}
      </div>
    </div>
  );
}

function FirestoreTest() {
  const [nombre, setNombre] = useState("");
  const [profesor, setProfesor] = useState("");
  const [horario, setHorario] = useState("");
  const [asistencia, setAsistencia] = useState("");
  const [materias, setMaterias] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editNombre, setEditNombre] = useState("");
  const [materiaSeleccionada, setMateriaSeleccionada] = useState(null);
  const [nuevaNota, setNuevaNota] = useState("");
  const [notaTemp, setNotaTemp] = useState("");
  const [porcentajeTemp, setPorcentajeTemp] = useState("");
  const [notasPonderadas, setNotasPonderadas] = useState([]);
  const [resultadoFinal, setResultadoFinal] = useState(null);
  const [notaRapida, setNotaRapida] = useState("");
  const [listaNotasRapidas, setListaNotasRapidas] = useState([]);
  const [objetivos, setObjetivos] = useState([
    { texto: "Aprobar todas las materias", completado: false },
    { texto: "Asistencia superior al 90%", completado: false },
    { texto: "Estudiar 5 horas por semana", completado: false }
  ]);
  const [fechasImportantes, setFechasImportantes] = useState([]);


const agregarFechaImportante = (fecha) => {
  if (!fechasImportantes.includes(fecha)) {
    setFechasImportantes([...fechasImportantes, fecha]);
  }
};


const obtenerMaterias = async () => {
  const querySnapshot = await getDocs(collection(db, "materias"));
  const docs = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  }));
  setMaterias(docs);
};

useEffect(() => {
  obtenerMaterias();
}, []);


const guardarMateria = async () => {
  if (!nombre) return;
  try {
    await addDoc(collection(db, "materias"), {
      nombre,
      profesor,
      horario,
      asistencia: Number(asistencia),
      notas: [],
      creada: new Date()
    });
    setNombre("");
    setProfesor("");
    setHorario("");
    setAsistencia("");
    obtenerMaterias();
  } catch (e) {
    console.error("Error al guardar:", e);
  }
};


const agregarNotaPonderada = () => {
  const nota = parseFloat(notaTemp);
  const porcentaje = parseFloat(porcentajeTemp);
  const sumaPorcentajes = notasPonderadas.reduce((acc, n) => acc + n.porcentaje, 0);

  if (isNaN(nota) || isNaN(porcentaje) || nota < 0 || nota > 100 || porcentaje <= 0 || porcentaje > 100) {
    alert("Ingresa valores válidos.");
    return;
  }

  if (sumaPorcentajes + porcentaje > 100) {
    alert("La suma total de porcentajes no puede superar 100%.");
    return;
  }

  setNotasPonderadas([...notasPonderadas, { nota, porcentaje }]);
  setNotaTemp("");
  setPorcentajeTemp("");
};


const toggleObjetivo = (index) => {
  const nuevosObjetivos = [...objetivos];
  nuevosObjetivos[index].completado = !nuevosObjetivos[index].completado;
  setObjetivos(nuevosObjetivos);
};


const agregarNotaRapida = () => {
  if (notaRapida.trim()) {
    setListaNotasRapidas([...listaNotasRapidas, notaRapida.trim()]);
    setNotaRapida("");
  }
};



const calcularResultado = () => {
  const resultado = notasPonderadas.reduce((acc, n) => acc + (n.nota * n.porcentaje / 100), 0);
  setResultadoFinal(resultado.toFixed(2));
};

  const agregarNota = async () => {
  if (!nuevaNota.trim() || !materiaSeleccionada) return;
  try {
    const ref = doc(db, "materias", materiaSeleccionada);
    const materiaActual = materias.find((m) => m.id === materiaSeleccionada);
    const nuevasNotas = [...(materiaActual.notas || []), nuevaNota.trim()];
    await updateDoc(ref, { notas: nuevasNotas });
    setNuevaNota("");
    obtenerMaterias();
  } catch (e) {
    console.error("Error al agregar nota:", e);
  }
};


  const eliminarMateria = async (id) => {
    try {
      await deleteDoc(doc(db, "materias", id));
      if (materiaSeleccionada === id) {
        setMateriaSeleccionada(null);
      }
      obtenerMaterias();
    } catch (e) {
      console.error("Error al eliminar:", e);
    }
  };

  const iniciarEdicion = (materia) => {
    setEditingId(materia.id);
    setEditNombre(materia.nombre);
  };

  const guardarEdicion = async (id) => {
    try {
      const ref = doc(db, "materias", id);
      await updateDoc(ref, { nombre: editNombre });
      setEditingId(null);
      obtenerMaterias();
    } catch (e) {
      console.error("Error al editar:", e);
    }
  };

  const materia = materias.find((m) => m.id === materiaSeleccionada);

  return (
    <div style={{
      position: "relative",
      backgroundImage: "url('https://images.unsplash.com/photo-1557682224-5b8590cd9ec5')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      minHeight: "100vh",
      padding: "40px 16px",
      boxSizing: "border-box"
    }}>

      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        zIndex: 0
      }} />


      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          gap: "50px"
        }}>

         <div style={{ width: "220px", display: "flex", flexDirection: "column", gap: "20px" }}>
            <CalendarioLateral onSeleccionarFecha={agregarFechaImportante} />

<div style={{
  background: "#2c2c2c",
  color: "#fff",
  padding: "16px",
  borderRadius: "8px",
  fontSize: "14px"
}}>
  <h4>📅 Fechas importantes</h4>
  {fechasImportantes.length === 0 ? (
    <p style={{ fontSize: "13px", marginTop: "6px" }}>Haz clic en una fecha del calendario para agregarla aquí.</p>
  ) : (
    <ul style={{ marginTop: "10px", paddingLeft: "18px", listStyle: "disc" }}>
      {fechasImportantes.map((fecha, idx) => (
        <li key={idx} style={{ marginBottom: "6px" }}>
          {fecha}
        </li>
      ))}
    </ul>
  )}
</div>


  <div style={{
    background: "#2c2c2c",
    color: "#fff",
    padding: "16px",
    borderRadius: "8px",
    fontSize: "14px"
  }}>
    <h4>🧮 Calculadora de Notas</h4>
    <input
      type="number"
      value={notaTemp}
      onChange={(e) => setNotaTemp(e.target.value)}
      placeholder="Nota"
      min="0"
      max="10"
      style={{ width: "100%", marginBottom: "8px", padding: "6px", borderRadius: "4px" }}
    />
    <input
      type="number"
      value={porcentajeTemp}
      onChange={(e) => setPorcentajeTemp(e.target.value)}
      placeholder="% Ponderado"
      min="1"
      max="100"
      style={{ width: "100%", marginBottom: "8px", padding: "6px", borderRadius: "4px" }}
    />
    <button onClick={agregarNotaPonderada} style={{ width: "100%", marginBottom: "10px" }}>
      Agregar
    </button>

    <ul style={{ paddingLeft: "16px" }}>
      {notasPonderadas.map((item, idx) => (
        <li key={idx}>Nota {item.nota} - {item.porcentaje}%</li>
      ))}
    </ul>

    <button onClick={calcularResultado} style={{ marginTop: "10px", width: "100%" }}>
      Calcular Resultado
    </button>

    {resultadoFinal !== null && (
      <p style={{ marginTop: "10px", color: "#6cf" }}>
        🎯 Nota Final: <strong>{resultadoFinal}</strong>
      </p>
    )}
  </div>
</div>


          <div style={{
            width: "100%",
            maxWidth: "600px",
            fontFamily: "sans-serif",
            color: "#fff"
          }}>
            <h1 style={{ textAlign: "center" }}>🎓 Gestor de Estudios</h1>


            <div style={{ marginTop: "20px" }}>
              <h2>Agregar nueva materia</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre de la materia" />
                <input value={profesor} onChange={(e) => setProfesor(e.target.value)} placeholder="Profesor" />
                <input value={horario} onChange={(e) => setHorario(e.target.value)} placeholder="Horario (Ej: Lunes y Miércoles 10-12)" />
                <input type="number" value={asistencia} onChange={(e) => setAsistencia(e.target.value)} placeholder="Asistencia (%)" min="0" max="100" />
                <button onClick={guardarMateria}>Guardar</button>
              </div>
            </div>

  
            <div style={{ marginTop: "30px" }}>
              <h3>Materias registradas</h3>
              <div style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "15px",
                justifyContent: "center"
              }}>
                {materias.map((materia) => (
                  <div
                    key={materia.id}
                    style={{
                      background: "#2a2a2a",
                      color: "#fff",
                      borderRadius: "8px",
                      padding: "15px",
                      minWidth: "180px",
                      boxShadow: "2px 2px 5px rgba(0,0,0,0.5)",
                      cursor: "pointer"
                    }}
                    onClick={() => setMateriaSeleccionada(materia.id)}
                  >
                    {editingId === materia.id ? (
                      <>
                        <input
                          value={editNombre}
                          onChange={(e) => setEditNombre(e.target.value)}
                          style={{ padding: "6px", width: "100%" }}
                        />
                        <div style={{ marginTop: "8px", textAlign: "right" }}>
                          <button onClick={() => guardarEdicion(materia.id)}>📂</button>
                          <button onClick={() => setEditingId(null)}>❌</button>
                        </div>
                      </>
                    ) : (
                      <>
                        <strong>{materia.nombre}</strong>
                        <div style={{ marginTop: "8px", display: "flex", gap: "5px" }}>
                          <button onClick={(e) => { e.stopPropagation(); iniciarEdicion(materia); }}>✏️</button>
                          <button onClick={(e) => { e.stopPropagation(); eliminarMateria(materia.id); }}>❌</button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

<div style={{ marginTop: "40px" }}>
  <h3 style={{ color: "#6cf" }}>📚 Detalles de la materia</h3>
  {materia ? (
    <div style={{ background: "#333", padding: "20px", borderRadius: "8px" }}>
      <p><strong>Materia:</strong> {materia.nombre}</p>
      <p><strong>Profesor:</strong> {materia.profesor}</p>
      <p><strong>Horario:</strong> {materia.horario}</p>
      <p><strong>Asistencia:</strong> {materia.asistencia}%</p>

      <div style={{ marginTop: "20px" }}>
        <h4 style={{ color: "#6cf" }}>📄 Notas</h4>
        {materia.notas && materia.notas.length > 0 ? (
          <ul style={{ paddingLeft: "20px" }}>
            {materia.notas.map((nota, i) => (
              <li key={i}>{nota}</li>
            ))}
          </ul>
        ) : (
          <p style={{ fontSize: "14px" }}>No hay notas registradas.</p>
        )}
        <div style={{ marginTop: "10px", display: "flex", gap: "8px" }}>
          <input
            type="text"
            placeholder="Ej: Parcial 1 - 8"
            value={nuevaNota}
            onChange={(e) => setNuevaNota(e.target.value)}
            style={{
              flex: 1,
              padding: "6px",
              borderRadius: "4px",
              border: "1px solid #ccc"
            }}
          />
          <button onClick={agregarNota}>Agregar nota</button>
        </div>
      </div>
    </div>
  ) : (
    <p>Selecciona una materia para ver los detalles.</p>
  )}
</div>

          </div>

          <div style={{
            width: "600px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
            alignContent: "flex-start"
          }}>
            <div style={{
              background: "#2b2b2b",
              color: "#fff",
              padding: "20px",
              borderRadius: "12px"
            }}>
              <h4>💬 Notas rápidas</h4>
              <textarea
  rows="3"
  placeholder="Escribe una nota rápida..."
  value={notaRapida}
  onChange={(e) => setNotaRapida(e.target.value)}
  style={{
    width: "100%",
    marginTop: "8px",
    borderRadius: "6px",
    padding: "10px"
  }}
/>
<button onClick={agregarNotaRapida} style={{ marginTop: "6px" }}>
  Agregar nota
</button>

            </div>

            <div style={{
              background: "#2b2b2b",
              color: "#fff",
              padding: "20px",
              borderRadius: "12px"
            }}>
              <h4>📊 Progreso</h4>
              <div style={{
                height: "12px",
                background: "#444",
                borderRadius: "6px",
                overflow: "hidden",
                marginTop: "12px"
              }}>
                <div
                  style={{
                    width: `${materia?.asistencia || 0}%`,
                    background: "#6cf",
                    height: "100%"
                  }}
                />
              </div>
              <p style={{ fontSize: "14px", marginTop: "8px" }}>
                {materia?.asistencia || 0}% asistencia
              </p>
            </div>

            <div style={{
              background: "#2b2b2b",
              color: "#fff",
              padding: "20px",
              borderRadius: "12px"
            }}>
              <h4>🎯 Objetivos</h4>
{listaNotasRapidas.length > 0 && (
  <div style={{ marginTop: "20px" }}>
    <h4>📝 Notas rápidas</h4>
    <ul style={{ fontSize: "14px", paddingLeft: "20px" }}>
      {listaNotasRapidas.map((nota, idx) => (
        <li key={idx}>{nota}</li>
      ))}
    </ul>
  </div>
)}

            </div>
            <div style={{
              background: "#2b2b2b",
              color: "#fff",
              padding: "20px",
              borderRadius: "12px"
            }}>
              <h4>🔔 Recordatorios</h4>
              <ul style={{ fontSize: "14px", marginTop: "10px", paddingLeft: "20px" }}>
                <li>Revisión de notas el viernes</li>
                <li>Entrega Historia - 24/06</li>
                <li>Clase extra sábado</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FirestoreTest;
