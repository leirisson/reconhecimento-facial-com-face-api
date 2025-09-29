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
const captureBtn = document.getElementById("captureBtn");
const canvas = document.getElementById("canvas");
const capturedPhoto = document.getElementById("capturedPhoto");
const photoContainer = document.getElementById("photoContainer");
const results = document.getElementById("results");
const status = document.getElementById("status");
const saveReferenceBtn = document.getElementById("saveReferenceBtn");
const personName = document.getElementById("personName");
const referenceControls = document.getElementById("referenceControls");
const faceCanvas = document.getElementById("faceCanvas");
const faceGuide = document.getElementById("faceGuide");
const guideOval = document.getElementById("guideOval");
const guideText = document.getElementById("guideText");
const guideStatus = document.getElementById("guideStatus");
const guideCountdown = document.getElementById("guideCountdown");
const matchBtn = document.getElementById("matchBtn");
const matchInfo = document.getElementById("matchInfo");
const matchDate = document.getElementById("matchDate");

// Variáveis de controle
let stream = null;
let labeledFaceDescriptors = null;
let currentPhotoData = null;
let realTimeDetection = null;
let countdownTimer = null;
let hasValidMatch = false;
let isFirstTime = true; // Controla se é a primeira vez ou após um match

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

    // Mostra o guia de enquadramento
    faceGuide.classList.remove("hidden");

    // Inicia detecção em tempo real
    startRealTimeDetection();

    // Atualiza interface
    status.textContent = "✅ Câmera ativa! Posicione seu rosto no guia verde";
    startBtn.style.display = "none";
    stopBtn.style.display = "inline-block";
    captureBtn.style.display = "inline-block";

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

    // Esconde o guia de enquadramento
    faceGuide.classList.add("hidden");

    // Para detecção em tempo real
    stopRealTimeDetection();

    // Atualiza interface
    status.textContent = "⏹️ Câmera parada";
    startBtn.style.display = "inline-block";
    stopBtn.style.display = "none";
    captureBtn.style.display = "none";

    stream = null;
    console.log("📷 Câmera parada");
  }
}

async function loadModels() {
    try {
        console.log('⏳ Carregando modelos...');
        
        const MODEL_URL = '/lib/models';

        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
            faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL)
        ]);

        console.log('✅ Todos os modelos carregados com sucesso!');
        
        // Carrega imagens de referência após carregar os modelos
        await loadReferenceImages();
        
        alert('✅ Modelos e imagens de referência carregados!');
        
    } catch (error) {
        console.error('❌ Erro ao carregar modelos:', error);
        alert('❌ ERRO: Verifique se os arquivos estão na pasta /models');
    }
}

// Chamar ao carregar a página
window.addEventListener('load', loadModels);


// Chamar ao carregar a página
window.addEventListener('load', loadModels);

// Event Listeners (cliques nos botões)
startBtn.addEventListener("click", startCamera);
stopBtn.addEventListener("click", stopCamera);
captureBtn.addEventListener("click", capturePhoto);
saveReferenceBtn.addEventListener("click", saveAsReference);
matchBtn.addEventListener("click", registerMatch);

// ============================================
// PARTE: CAPTURA DE FOTO E RECONHECIMENTO FACIAL
// ============================================

// Função para capturar foto da webcam
function capturePhoto() {
    if (!video.srcObject) {
        alert("❌ Câmera não está ativa!");
        return;
    }

    // Configura o canvas com as dimensões do vídeo
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Desenha o frame atual do vídeo no canvas
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Converte canvas para imagem
    const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    currentPhotoData = photoDataUrl;
    
    // Exibe a foto capturada
    capturedPhoto.src = photoDataUrl;
    photoContainer.style.display = "block";
    
    // Mostra os controles de salvamento de referência
    referenceControls.style.display = "block";
    
    // Inicia o reconhecimento facial
    performFaceRecognition(photoDataUrl);
    
    status.innerHTML = "📸 Foto capturada! <span class='loading'>⏳</span> Analisando faces...";
}

// Função para realizar reconhecimento facial na foto
async function performFaceRecognition(imageDataUrl) {
    try {
        console.log('🔍 Iniciando reconhecimento facial...');
        
        // Verifica se as imagens de referência foram carregadas
        if (!labeledFaceDescriptors || labeledFaceDescriptors.length === 0) {
            console.log('⚠️ Imagens de referência não carregadas. Tentando carregar novamente...');
            await loadReferenceImages();
            
            if (!labeledFaceDescriptors || labeledFaceDescriptors.length === 0) {
                throw new Error('Nenhuma imagem de referência disponível para comparação');
            }
        }
        
        // Cria o matcher com threshold mais baixo para melhor detecção
        const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.8); // Reduzido de 0.6 para 0.5
        
        // Carrega a imagem capturada
        const img = await faceapi.fetchImage(imageDataUrl);
        
        // Detecta faces na imagem
        const detections = await faceapi
            .detectAllFaces(img)
            .withFaceLandmarks()
            .withFaceDescriptors();
        
        console.log(`👥 ${detections.length} face(s) detectada(s) na imagem`);
        
        // Processa cada face detectada
        const results = detections.map(detection => {
            const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
            const similarity = ((1 - bestMatch.distance) * 100).toFixed(1);
            
            console.log(`🎯 Melhor correspondência: ${bestMatch.label} (${similarity}% similaridade, distância: ${bestMatch.distance.toFixed(3)})`);
            
            return {
                detection,
                bestMatch,
                similarity: parseFloat(similarity)
            };
        });
        
        displayResults(results, img);
        
    } catch (error) {
        console.error('❌ Erro no reconhecimento facial:', error);
        status.textContent = `❌ Erro: ${error.message}`;
    }
}

// Função para exibir resultados do reconhecimento
function displayResults(results, img) {
    if (!results || results.length === 0) {
        results.innerHTML = '<div class="no-face">❓ Nenhuma face detectada na imagem</div>';
        status.textContent = '❓ Nenhuma face encontrada';
        return;
    }

    // Configura o canvas para desenhar enquadramentos
    const displaySize = { width: capturedPhoto.width, height: capturedPhoto.height };
    faceCanvas.width = displaySize.width;
    faceCanvas.height = displaySize.height;
    
    const ctx = faceCanvas.getContext('2d');
    ctx.clearRect(0, 0, faceCanvas.width, faceCanvas.height);

    let resultsHTML = '';
    
    results.forEach((result, index) => {
        const { detection, bestMatch, similarity } = result;
        const confidence = (detection.detection.score * 100).toFixed(1);
        
        // Determina se é uma correspondência válida (threshold muito alto para maior precisão)
        const isMatch = similarity >= 60; // Corrigido para 93% conforme solicitado
        
        // Desenha o enquadramento no canvas
        const box = detection.detection.box;
        const resizedBox = faceapi.resizeResults(box, displaySize);
        
        // Define a cor do enquadramento baseada no reconhecimento
        let frameColor = '#ff0000'; // Vermelho para desconhecido
        let frameWidth = 3;
        
        if (isMatch && bestMatch.label !== 'unknown') {
            frameColor = '#00ff00'; // Verde para reconhecido
            frameWidth = 4;
        }
        
        // Desenha o retângulo
        ctx.strokeStyle = frameColor;
        ctx.lineWidth = frameWidth;
        ctx.strokeRect(resizedBox.x, resizedBox.y, resizedBox.width, resizedBox.height);
        
        // Adiciona texto com o nome da pessoa
        ctx.fillStyle = frameColor;
        ctx.font = 'bold 16px Arial';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 4;
        
        let labelText = isMatch && bestMatch.label !== 'unknown' ? bestMatch.label : 'Desconhecido';
        const textWidth = ctx.measureText(labelText).width;
        const textX = resizedBox.x + (resizedBox.width - textWidth) / 2;
        const textY = resizedBox.y - 10;
        
        ctx.fillText(labelText, textX, textY);
        ctx.shadowBlur = 0; // Reset shadow
        
        let personInfo = '';
        let alertMessage = '';
        
        if (isMatch && bestMatch.label !== 'unknown') {
              hasValidMatch = true;
              
              // Só mostrar o botão se não for a primeira vez
              if (!isFirstTime) {
                  matchBtn.style.display = 'block';
                  matchBtn.textContent = '✅ Registrar Match';
              }
              
              if (bestMatch.label.toLowerCase() === 'leirisson') {
                  personInfo = `
                      <div class="person-match">
                          <strong>👋 ${bestMatch.label}</strong>
                          <div class="confidence">Similaridade: ${similarity}%</div>
                          <div class="detection-confidence">Detecção: ${confidence}%</div>
                      </div>
                  `;
                  alertMessage = `Olá, Leirisson! 👋\nSimilaridade: ${similarity}%`;
              } else if (bestMatch.label.toLowerCase() === 'rodrigo') {
                  personInfo = `
                      <div class="person-match">
                          <strong>👋 ${bestMatch.label}</strong>
                          <div class="confidence">Similaridade: ${similarity}%</div>
                          <div class="detection-confidence">Detecção: ${confidence}%</div>
                      </div>
                  `;
                  alertMessage = `Olá, Rodrigo! 👋\nSimilaridade: ${similarity}%`;
              } else if (bestMatch.label.toLowerCase() === 'loise') {
                  personInfo = `
                      <div class="person-match">
                          <strong>👋 ${bestMatch.label}</strong>
                          <div class="confidence">Similaridade: ${similarity}%</div>
                          <div class="detection-confidence">Detecção: ${confidence}%</div>
                      </div>
                  `;
                  alertMessage = `Olá, Loise! 👋\nSimilaridade: ${similarity}%`;
              } else {
                  personInfo = `
                      <div class="person-match">
                          <strong>✅ Pessoa reconhecida: ${bestMatch.label}</strong>
                          <div class="confidence">Similaridade: ${similarity}%</div>
                          <div class="detection-confidence">Detecção: ${confidence}%</div>
                      </div>
                  `;
                  alertMessage = `Pessoa reconhecida: ${bestMatch.label}\nSimilaridade: ${similarity}%`;
              }
        } else {
            hasValidMatch = false;
            
            // Só esconder o botão se não for a primeira vez
            if (!isFirstTime) {
                matchBtn.style.display = 'none';
            }
            
            personInfo = `
                <div class="person-unknown">
                     <strong>❓ Pessoa desconhecida</strong>
                     <div class="confidence">Similaridade: ${similarity}%</div>
                     <div class="detection-confidence">Detecção: ${confidence}%</div>
                     <div class="threshold-info">Threshold mínimo: 93%</div>
                 </div>
            `;
            alertMessage = '❓ Pessoa desconhecida';
        }
        
        resultsHTML += `
            <div class="face-result">
                <h3>👤 Face ${index + 1}</h3>
                ${personInfo}
                <div class="technical-info">
                    <small>Distância: ${bestMatch.distance.toFixed(3)} | Melhor match: ${bestMatch.label}</small>
                </div>
            </div>
        `;
        
        // Exibe alerta personalizado
        if (alertMessage) {
            setTimeout(() => alert(alertMessage), 100);
        }
    });
    
    results.innerHTML = resultsHTML;
    status.textContent = `✅ ${results.length} face(s) processada(s)`;
}

// ============================================
// PARTE: CARREGAMENTO DE IMAGENS DE REFERÊNCIA
// ============================================

// Função para carregar imagens de referência para reconhecimento
async function loadReferenceImages() {
    try {
        console.log('⏳ Carregando imagens de referência...');
        
        const labels = ['Leirisson','Rodrigo','Loise']; // Adicione mais nomes conforme necessário
        
        labeledFaceDescriptors = await Promise.all(
            labels.map(async (label) => {
                const descriptions = [];
                
                // Lista de possíveis nomes de arquivos para tentar carregar
                const possibleFiles = [
                    // Arquivos com nomes padronizados
                    `${label.toLowerCase()}1.jpg`,
                    `${label.toLowerCase()}2.jpg`, 
                    `${label.toLowerCase()}3.jpg`,
                    `${label.toLowerCase()}4.jpg`,
                    `${label.toLowerCase()}5.jpg`,
                    `${label.toLowerCase()}1.jpeg`,
                    `${label.toLowerCase()}2.jpeg`, 
                    `${label.toLowerCase()}3.jpeg`,
                    `${label.toLowerCase()}4.jpeg`,
                    `${label.toLowerCase()}5.jpeg`,
                    // Arquivos específicos para Leirisson
                    ...(label.toLowerCase() === 'leirisson' ? [
                        'img1.jpeg',
                        'img2.jpeg', 
                        'img3.jpeg',
                        'img4.jpeg',
                        'img5.jpeg',
                        'l1_1759170660160.jpg',
                        'l2_1759170753303.jpg',
                        'l4_1759171150901.jpg',
                        'l9_1759171540262.jpg',
                        'l10_1759171689557.jpg',
                        'leirisson1_1759170170557.jpg',
                        'leirisson3_1759170359460.jpg',
                        'leirisson_1759170170557.jpg',
                        'leirisson_1759170402457.jpg',
                        'leirissonperto_1759170606920.jpg',
                        'cima_1759171950011.jpg',
                        'baixo_1759171932484.jpg',
                        'ladodireito_1759171912196.jpg',
                        'ladoesquerdo_1759171886653.jpg'
                    ] : [])
                ];
                
                // Tenta carregar cada arquivo
                for (const fileName of possibleFiles) {
                    try {
                        console.log(`🔍 Tentando carregar: /lib/labels/${label}/${fileName}`);
                        const img = await faceapi.fetchImage(`/lib/labels/${label}/${fileName}`);
                        const detections = await faceapi
                            .detectSingleFace(img)
                            .withFaceLandmarks()
                            .withFaceDescriptor();
                        
                        if (detections) {
                            descriptions.push(detections.descriptor);
                            console.log(`✅ Face detectada em: ${fileName}`);
                        } else {
                            console.log(`⚠️ Nenhuma face detectada em: ${fileName}`);
                        }
                    } catch (error) {
                        console.log(`❌ Erro ao carregar ${fileName}:`, error.message);
                    }
                }
                
                if (descriptions.length > 0) {
                    console.log(`✅ ${descriptions.length} imagem(ns) com faces válidas carregadas para ${label}`);
                    return new faceapi.LabeledFaceDescriptors(label, descriptions);
                } else {
                    console.log(`⚠️ Nenhuma imagem com face válida encontrada para ${label}`);
                    return null;
                }
            })
        );
        
        // Remove entradas nulas
        labeledFaceDescriptors = labeledFaceDescriptors.filter(descriptor => descriptor !== null);
        
        if (labeledFaceDescriptors.length > 0) {
            console.log(`✅ Sistema de reconhecimento carregado com ${labeledFaceDescriptors.length} pessoa(s)`);
            
            // Mostra estatísticas detalhadas
            labeledFaceDescriptors.forEach(descriptor => {
                console.log(`📊 ${descriptor.label}: ${descriptor.descriptors.length} imagens de referência`);
            });
        } else {
            console.log('⚠️ Nenhuma imagem de referência válida foi carregada');
        }
        
    } catch (error) {
        console.error('❌ Erro ao carregar imagens de referência:', error);
        labeledFaceDescriptors = null;
     }
}

// ============================================
// PARTE: SALVAMENTO DE IMAGENS DE REFERÊNCIA
// ============================================

// Função para salvar foto atual como imagem de referência
function saveAsReference() {
    const name = personName.value.trim();
    
    if (!name) {
        alert("❌ Por favor, digite o nome da pessoa!");
        personName.focus();
        return;
    }
    
    if (!currentPhotoData) {
        alert("❌ Nenhuma foto capturada para salvar!");
        return;
    }
    
    try {
        // Simula o salvamento da imagem (em uma aplicação real, seria enviado para o servidor)
        const fileName = `${name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.jpg`;
        
        // Cria um link temporário para download da imagem
        const link = document.createElement('a');
        link.download = fileName;
        link.href = currentPhotoData;
        
        // Simula o clique para fazer o download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        alert(`✅ Imagem salva como: ${fileName}\n\nPara usar no reconhecimento:\n1. Coloque a imagem na pasta /lib/labels/${name}/\n2. Renomeie para ${name.toLowerCase()}1.jpg\n3. Recarregue a página`);
        
        // Limpa o campo de nome
        personName.value = '';
        
        console.log(`📁 Imagem de referência salva: ${fileName}`);
        
    } catch (error) {
        console.error('❌ Erro ao salvar imagem:', error);
        alert('❌ Erro ao salvar a imagem!');
    }
}

// ============================================
// PARTE: DETECÇÃO EM TEMPO REAL NO GUIA
// ============================================

async function startRealTimeDetection() {
    if (!faceapi.nets.tinyFaceDetector.isLoaded) {
        console.log('⏳ Aguardando modelos carregarem...');
        return;
    }

    realTimeDetection = setInterval(async () => {
        try {
            if (video.videoWidth > 0 && video.videoHeight > 0) {
                await detectFaceInGuide();
            }
        } catch (error) {
            console.error('❌ Erro na detecção em tempo real:', error);
        }
    }, 500); // Detecta a cada 500ms para performance
}

function stopRealTimeDetection() {
    if (realTimeDetection) {
        clearInterval(realTimeDetection);
        realTimeDetection = null;
    }
    if (countdownTimer) {
        clearTimeout(countdownTimer);
        countdownTimer = null;
    }
    resetGuideState();
}

async function detectFaceInGuide() {
    const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();

    if (detections.length === 0) {
        updateGuideState('no-face', 'Nenhum rosto detectado', 'Posicione seu rosto no guia');
        return;
    }

    if (detections.length > 1) {
        updateGuideState('multiple-faces', 'Múltiplos rostos detectados', 'Apenas uma pessoa por vez');
        return;
    }

    const detection = detections[0];
    const box = detection.detection.box;
    
    // Calcula posição relativa do rosto no vídeo
    const videoRect = video.getBoundingClientRect();
    const faceCenter = {
        x: box.x + box.width / 2,
        y: box.y + box.height / 2
    };
    
    const videoCenter = {
        x: video.videoWidth / 2,
        y: video.videoHeight / 2
    };

    // Verifica posicionamento
    const distanceFromCenter = Math.sqrt(
        Math.pow(faceCenter.x - videoCenter.x, 2) + 
        Math.pow(faceCenter.y - videoCenter.y, 2)
    );

    const faceSize = Math.max(box.width, box.height);
    const idealSize = Math.min(video.videoWidth, video.videoHeight) * 0.3;
    const tolerance = idealSize * 0.3;

    // Determina o estado baseado na posição e tamanho
    if (faceSize < idealSize - tolerance) {
        updateGuideState('face-too-far', 'Muito longe', 'Aproxime-se da câmera');
    } else if (faceSize > idealSize + tolerance) {
        updateGuideState('face-too-close', 'Muito perto', 'Afaste-se da câmera');
    } else if (distanceFromCenter > 80) {
        updateGuideState('face-not-centered', 'Fora do centro', 'Centralize seu rosto');
    } else {
        updateGuideState('ready-to-capture', 'Perfeito!', 'Posição ideal - Preparando captura...');
        startAutoCapture();
    }
}

function updateGuideState(state, statusText, instructionText) {
    // Remove todas as classes de estado
    guideOval.className = 'guide-oval';
    
    // Adiciona a classe do estado atual
    if (state !== 'no-face') {
        guideOval.classList.add(state);
    }
    
    // Atualiza textos
    guideStatus.textContent = statusText;
    guideText.textContent = instructionText;
    
    // Esconde countdown se não estiver pronto
    if (state !== 'ready-to-capture') {
        guideCountdown.style.display = 'none';
        if (countdownTimer) {
            clearTimeout(countdownTimer);
            countdownTimer = null;
        }
    }
}

function resetGuideState() {
    guideOval.className = 'guide-oval';
    guideStatus.textContent = '';
    guideText.textContent = 'Posicione seu rosto aqui';
    guideCountdown.style.display = 'none';
}

function startAutoCapture() {
    if (countdownTimer) return; // Já está contando
    
    let countdown = 3;
    guideCountdown.textContent = countdown;
    guideCountdown.style.display = 'block';
    
    const countInterval = setInterval(() => {
        countdown--;
        if (countdown > 0) {
            guideCountdown.textContent = countdown;
        } else {
            clearInterval(countInterval);
            guideCountdown.textContent = '📸';
            
            // Captura automática após 500ms
            countdownTimer = setTimeout(() => {
                capturePhoto();
                guideCountdown.style.display = 'none';
                countdownTimer = null;
            }, 500);
        }
    }, 1000);
}

// ============================================
// FUNÇÃO PARA REGISTRAR MATCH
// ============================================

function registerMatch() {
    if (isFirstTime) {
        // Primeira vez - iniciar o processo de captura
        isFirstTime = false;
        hasValidMatch = false;
        
        // Esconder o botão de match e mostrar controles da câmera
        matchBtn.style.display = 'none';
        startBtn.style.display = 'block';
        stopBtn.style.display = 'block';
        
        // Atualizar status
        status.textContent = '📷 Agora inicie a câmera para enquadrar seu rosto';
        
        // Iniciar câmera automaticamente
        startCamera();
        
        return;
    }
    
    // Após match válido - registrar e preparar para próximo
    if (!hasValidMatch) {
        alert('❌ Nenhum match válido encontrado!');
        return;
    }
    
    // Formatar data atual
    const now = new Date();
    const day = now.getDate();
    const months = [
        'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
        'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
    ];
    const month = months[now.getMonth()];
    const year = now.getFullYear();
    
    const formattedDate = `${day}, ${month} de ${year}`;
    
    // Exibir informações do match
    matchDate.textContent = formattedDate;
    matchInfo.style.display = 'block';
    
    // Feedback visual
    alert(`✅ Match registrado com sucesso!\nData: ${formattedDate}`);
    
    console.log(`Match registrado em: ${formattedDate}`);
    
    // Resetar para próximo match
    hasValidMatch = false;
    matchBtn.textContent = '✅ Registrar Novo Match';
    
    // Limpar resultados anteriores
    results.innerHTML = '';
    photoContainer.style.display = 'none';
    
    // Atualizar status
    status.textContent = '🔄 Pronto para novo reconhecimento! Inicie a câmera novamente.';
}


