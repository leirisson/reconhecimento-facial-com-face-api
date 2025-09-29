// // retorna uma processa de listar as webcam do computador

// async function CapturarCamerasDoPc() {
//   // essa função vai retorna um array com as cameras, audios, de um camputador
//   // exemplo: [camer1, camera2,etc...]
//   navigator.mediaDevices.enumerateDevices().then((todosOsdispositivos) => {
//     console.log({todosOsdispositivos})
//     if (Array.isArray(todosOsdispositivos)) {
//       todosOsdispositivos.forEach((dispositivos) => {
//         if (dispositivos.kind === "videoinput") {
//             console.log(dispositivos)
//             navigator.med
//         }
//       });
//     }
//   });
// }

// CapturarCamerasDoPc();

// ============================================
// PARTE 1: VARIÁVEIS GLOBAIS E ELEMENTOS DOM
// ============================================

// Elementos HTML
const video = document.getElementById("video");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const status = document.getElementById("status");

// Variáveis de controle
let stream = null;

// ============================================
// PARTE: INICIAR CÂMERA (getUserMedia)
// ============================================

// Função para INICIAR a câmera
async function startCamera() {
  try {
    status.textContent = "⏳ Aguarde, acessando câmera...";

    // Solicita acesso à webcam
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    });

    // Conecta o stream ao elemento <video>
    video.srcObject = stream;

    // Mostra o vídeo
    video.classList.add("active");

    // Atualiza interface
    status.textContent = "✅ Câmera ativa!";
    startBtn.style.display = "none";
    stopBtn.style.display = "inline-block";

    console.log("✅ Câmera iniciada com sucesso!");
  } catch (error) {
    console.error("❌ Erro:", error);
    status.textContent = "❌ Erro ao acessar a câmera!";

    alert(
      "Não foi possível acessar a câmera!\n\n" +
        "Verifique se:\n" +
        "✓ Você permitiu o acesso à câmera\n" +
        "✓ A câmera não está sendo usada por outro programa\n" +
        "✓ Está usando HTTPS ou localhost"
    );
  }
}

// Função para PARAR a câmera
function stopCamera() {
  if (stream) {
    // Para todas as tracks (vídeo)
    stream.getTracks().forEach((track) => track.stop());

    // Remove o stream do vídeo
    video.srcObject = null;

    // Esconde o vídeo
    video.classList.remove("active");

    // Atualiza interface
    status.textContent = "⏹️ Câmera parada";
    startBtn.style.display = "inline-block";
    stopBtn.style.display = "none";

    stream = null;
    console.log("📷 Câmera parada");
  }
}

// Event Listeners (cliques nos botões)
startBtn.addEventListener("click", startCamera);
stopBtn.addEventListener("click", stopCamera);
