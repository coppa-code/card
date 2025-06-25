// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBH_R7JmD_PYwDkmTdASmzPr4VlZRxSrq0",
  authDomain: "agenda-de-cards.firebaseapp.com",
  projectId: "agenda-de-cards",
  storageBucket: "agenda-de-cards.firebasestorage.app",
  messagingSenderId: "279512588811",
  appId: "1:279512588811:web:927e5c8e77fdc6e5029d0e",
  measurementId: "G-YECM3RD4WR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Global variables
let currentDate = new Date();
let events = [];
const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const weekdays = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

// Utility functions
function createLocalDate(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTodayDate() {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

function showLoading(message = '💾 Salvando...') {
  const loading = document.getElementById('loading');
  loading.textContent = message;
  loading.classList.add('show');
  setTimeout(() => loading.classList.remove('show'), 2000);
}

function updateStatus(online) {
  const indicator = document.getElementById('statusIndicator');
  if (online) {
    indicator.textContent = '🟢 Online';
    indicator.className = 'status-indicator status-online';
  } else {
    indicator.textContent = '🔴 Offline';
    indicator.className = 'status-indicator status-offline';
  }
}

// Firebase functions
async function loadEventsFromFirebase() {
  try {
    showLoading('📥 Carregando dados...');
    const querySnapshot = await getDocs(collection(db, "events"));
    events = [];
    querySnapshot.forEach((doc) => {
      events.push({
        id: doc.id,
        ...doc.data()
      });
    });
    updateStatus(true);
    renderCalendar();
    renderEvents();
  } catch (error) {
    console.error("Erro ao carregar eventos:", error);
    updateStatus(false);
    loadFromLocalStorage();
  }
}

async function saveEventToFirebase(eventData) {
  try {
    showLoading('💾 Salvando evento...');
    const docRef = await addDoc(collection(db, "events"), eventData);
    eventData.id = docRef.id;
    events.push(eventData);
    updateStatus(true);
    return docRef.id;
  } catch (error) {
    console.error("Erro ao salvar evento:", error);
    updateStatus(false);
    events.push(eventData);
    saveToLocalStorage();
    throw error;
  }
}

async function updateEventInFirebase(eventId, eventData) {
  try {
    showLoading('✏️ Atualizando evento...');
    await updateDoc(doc(db, "events", eventId), eventData);
    updateStatus(true);
    return true;
  } catch (error) {
    console.error("Erro ao atualizar evento:", error);
    updateStatus(false);
    throw error;
  }
}

async function deleteEventFromFirebase(eventId, index) {
  try {
    showLoading('🗑️ Excluindo evento...');
    if (eventId) {
      await deleteDoc(doc(db, "events", eventId));
    }
    events.splice(index, 1);
    updateStatus(true);
  } catch (error) {
    console.error("Erro ao excluir evento:", error);
    updateStatus(false);
    events.splice(index, 1);
    saveToLocalStorage();
    throw error;
  }
}

function setupRealtimeListener() {
  try {
    const unsubscribe = onSnapshot(collection(db, "events"), (snapshot) => {
      events = [];
      snapshot.forEach((doc) => {
        events.push({
          id: doc.id,
          ...doc.data()
        });
      });
      renderCalendar();
      renderEvents();
      updateStatus(true);
    });
    return unsubscribe;
  } catch (error) {
    console.error("Erro ao configurar listener:", error);
    updateStatus(false);
  }
}

// Local storage functions
function loadFromLocalStorage() {
  const saved = localStorage.getItem('agendaEvents');
  if (saved) {
    events = JSON.parse(saved);
  } else {
    events = [
      {date: '2025-07-08', title: 'Visita à COPPA', time: '09h', description: 'Projeto Adolecer +'},
      {date: '2025-07-09', title: 'Escola Maringuela', time: '08h às 12h', description: ''},
      {date: '2025-07-22', title: 'Educação ambiental para surdos', time: '', description: 'Manter contato com CB PM Teles - 71988941109'}
    ];
    saveToLocalStorage();
  }
  renderCalendar();
  renderEvents();
}

function saveToLocalStorage() {
  localStorage.setItem('agendaEvents', JSON.stringify(events));
}

// Render functions
function renderCalendar() {
  const calendar = document.getElementById('calendar');
  const monthYear = document.getElementById('monthYear');
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  monthYear.textContent = `${months[month]} ${year}`;
  calendar.innerHTML = '';
  // Add weekday headers
  weekdays.forEach(day => {
    const div = document.createElement('div');
    div.className = 'weekday';
    div.textContent = day;
    calendar.appendChild(div);
  });
  // Calculate first day of month and start date
  const firstDay = new Date(year, month, 1);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  const today = getTodayDate();
  // Generate calendar days
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const dayEl = document.createElement('div');
    dayEl.className = 'day';
    const dayNum = document.createElement('div');
    dayNum.textContent = date.getDate();
    dayEl.appendChild(dayNum);
    // Style different month days
    if (date.getMonth() !== month) {
      dayEl.classList.add('other-month');
    }
    // Mark today
    if (date.getTime() === today.getTime()) {
      dayEl.classList.add('today');
    }
    // Add event indicators
    const dateStr = formatDateString(date);
    const dayEvents = events.filter(e => e.date === dateStr);
    if (dayEvents.length > 0) {
      dayEl.classList.add('has-event');
      const dots = document.createElement('div');
      dots.className = 'event-dots';
      dayEvents.forEach(() => {
        const dot = document.createElement('div');
        dot.className = 'dot';
        dots.appendChild(dot);
      });
      dayEl.appendChild(dots);
    }
    // Add click event
    dayEl.addEventListener('click', () => {
      document.querySelectorAll('.day.selected').forEach(el => el.classList.remove('selected'));
      dayEl.classList.add('selected');
      document.getElementById('eventDate').value = dateStr;
    });
    calendar.appendChild(dayEl);
  }
}

function renderEvents() {
  const list = document.getElementById('eventsList');
  if (events.length === 0) {
    list.innerHTML = '<div class="no-events">✨ Nenhum evento cadastrado</div>';
    return;
  }
  const today = getTodayDate();
  const sorted = [...events].sort((a, b) => {
    const dateA = createLocalDate(a.date);
    const dateB = createLocalDate(b.date);
    const aFuture = dateA >= today;
    const bFuture = dateB >= today;
    if (aFuture && !bFuture) return -1;
    if (!aFuture && bFuture) return 1;
    return aFuture ? dateA - dateB : dateB - dateA;
  });
  list.innerHTML = '';
  sorted.forEach((event, sortedIndex) => {
    const eventDate = createLocalDate(event.date);
    const isToday = eventDate.getTime() === today.getTime();
    const isPast = eventDate < today;
    const formattedDate = eventDate.toLocaleDateString('pt-BR', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const diffDays = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
    let statusText = '';
    let statusClass = '';
    if (isToday) {
      statusText = '🔥 HOJE';
      statusClass = 'status-today';
    } else if (diffDays === 1) {
      statusText = '⚡ AMANHÃ';
      statusClass = 'status-future';
    } else if (diffDays > 0) {
      statusText = `📅 Em ${diffDays} dias`;
      statusClass = 'status-future';
    } else {
      statusText = `📜 Há ${Math.abs(diffDays)} dias`;
      statusClass = 'status-past';
    }
    const originalIndex = events.findIndex(e => e === event);
    const eventEl = document.createElement('div');
    eventEl.className = `event-item ${isToday ? 'event-today' : ''} ${isPast ? 'event-past' : ''}`;
    eventEl.innerHTML = `
      <div class="event-header">
        <div style="font-size: 14px; font-weight: 700; color: #4facfe; text-transform: uppercase;">${formattedDate}</div>
        <span class="event-status ${statusClass}">${statusText}</span>
      </div>
      <div style="font-size: 20px; font-weight: 700; color: #2d3748; margin-bottom: 10px;">${event.title}</div>
      ${event.time ? `<div style="font-size: 16px; color: #4a5568; margin-bottom: 10px;">⏰ ${event.time}</div>` : ''}
      ${event.description ? `<div style="font-size: 14px; color: #718096; line-height: 1.6;">${event.description}</div>` : ''}
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px;">
        <button class="btn-secondary edit-btn" onclick="editarEvento(${originalIndex})">✏️ Editar</button>
        <button class="delete-btn" onclick="deleteEvent(${originalIndex})">×</button>
      </div>
    `;
    list.appendChild(eventEl);
  });
}

// Event handlers
window.addEvent = async function addEvent(e) {
  e.preventDefault();
  const form = document.getElementById('eventForm');
  const editingIndex = form.dataset.editingIndex;

  const date = document.getElementById('eventDate').value;
  const title = document.getElementById('eventTitle').value;
  const time = document.getElementById('eventTime').value;
  const description = document.getElementById('eventDescription').value;

  if (!date || !title) {
    alert('Preencha pelo menos a data e o título!');
    return;
  }

  const eventData = { date, title, time, description };

  try {
    if (editingIndex !== undefined) {
      // Editar evento existente
      const oldEvent = events[editingIndex];
      
      if (oldEvent.id) {
        // Se o evento tem ID (veio do Firebase), atualizar no Firebase
        await updateEventInFirebase(oldEvent.id, eventData);
        // Atualizar no array local
        events[editingIndex] = { ...oldEvent, ...eventData };
      } else {
        // Se não tem ID (evento local), apenas atualizar no array
        events[editingIndex] = eventData;
        saveToLocalStorage();
      }
      
      // Limpar o estado de edição
      delete form.dataset.editingIndex;
      alert("✅ Evento atualizado!");
      
    } else {
      // Cadastrar novo evento
      await saveEventToFirebase(eventData);
      alert("🚀 Evento criado!");
    }

    // Limpar formulário
    document.getElementById('eventForm').reset();
    document.getElementById('eventDate').value = formatDateString(new Date());
    
    // Atualizar interface
    renderCalendar();
    renderEvents();

    // Feedback visual no botão
    const btn = document.querySelector('.btn-primary');
    const orig = btn.textContent;
    btn.textContent = editingIndex !== undefined ? '✅ Atualizado!' : '✅ Salvo!';
    setTimeout(() => btn.textContent = orig, 2000);

  } catch (error) {
    console.error('Erro ao processar evento:', error);
    
    if (editingIndex !== undefined) {
      // Se foi uma edição que falhou, tentar salvar localmente
      const oldEvent = events[editingIndex];
      events[editingIndex] = { ...oldEvent, ...eventData };
      saveToLocalStorage();
      alert('Evento atualizado localmente. Sincronize quando estiver online.');
    } else {
      // Se foi uma criação que falhou
      events.push(eventData);
      saveToLocalStorage();
      alert('Erro ao salvar no servidor. Evento salvo localmente.');
    }
    
    renderCalendar();
    renderEvents();
  }
};

window.editarEvento = function editarEvento(index) {
  const event = events[index];

  if (!event) return alert("Evento não encontrado.");

  // Preencher campos do formulário
  document.getElementById('eventDate').value = event.date;
  document.getElementById('eventTitle').value = event.title;
  document.getElementById('eventTime').value = event.time || '';
  document.getElementById('eventDescription').value = event.description || '';

  // Armazenar índice do evento sendo editado
  document.getElementById('eventForm').dataset.editingIndex = index;

  // Rolar até o formulário
  document.getElementById('eventForm').scrollIntoView({ behavior: 'smooth' });
};

window.deleteEvent = async function deleteEvent(index) {
  if (confirm('Excluir este evento?')) {
    const event = events[index];
    try {
      await deleteEventFromFirebase(event.id, index);
    } catch (error) {
      alert('Erro ao excluir evento. Removido localmente.');
    }
    renderCalendar();
    renderEvents();
  }
};

window.exportEvents = function exportEvents() {
  const data = JSON.stringify(events, null, 2);
  const blob = new Blob([data], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `agenda_${formatDateString(new Date())}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

window.importEvents = function importEvents() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = async function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async function(e) {
      try {
        const loaded = JSON.parse(e.target.result);
        if (Array.isArray(loaded)) {
          showLoading('📤 Importando eventos...');
          for (const event of loaded) {
            try {
              await saveEventToFirebase(event);
            } catch (err) {
              console.error('Erro ao importar:', err);
            }
          }
          alert(`✅ ${loaded.length} eventos importados!`);
        } else {
          alert('❌ Formato inválido!');
        }
      } catch (error) {
        alert('❌ Erro: ' + error.message);
      }
    };
    reader.readAsText(file);
  };
  input.click();
};

window.syncData = async function syncData() {
  try {
    await loadEventsFromFirebase();
    showLoading('🔄 Dados sincronizados!');
  } catch (error) {
    alert('Erro ao sincronizar dados');
  }
};

window.prevMonth = function prevMonth() {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
};

window.nextMonth = function nextMonth() {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
};

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('eventForm').addEventListener('submit', addEvent);
  document.getElementById('eventDate').value = formatDateString(new Date());
  loadEventsFromFirebase().catch(() => {
    console.log('Firebase não disponível, usando localStorage');
    loadFromLocalStorage();
  });
  setupRealtimeListener();
  window.addEventListener('online', () => {
    updateStatus(true);
    syncData();
  });
  window.addEventListener('offline', () => updateStatus(false));
});

// Função para importar eventos ambientais
window.importEnvironmentalEvents = async function importEnvironmentalEvents() {
  const savedEvents = JSON.parse(localStorage.getItem('environmentalEventsToImport') || '[]');
  
  if (savedEvents.length === 0) {
    alert('Nenhum evento ambiental para importar.');
    return;
  }
  
  if (!confirm(`Importar ${savedEvents.length} eventos do calendário ambiental?`)) {
    return;
  }
  
  showLoading('🌍 Importando eventos ambientais...');
  
  let imported = 0;
  let errors = 0;
  
  for (const eventData of savedEvents) {
    try {
      await saveEventToFirebase(eventData);
      imported++;
    } catch (error) {
      console.error('Erro ao importar evento:', error);
      errors++;
    }
  }
  
  if (errors === 0) {
    alert(`✅ ${imported} eventos ambientais importados com sucesso!`);
  } else {
    alert(`⚠️ ${imported} eventos importados, ${errors} com erro.`);
  }
  
  // Limpar eventos salvos após importação
  localStorage.removeItem('environmentalEventsToImport');
  
  // Recarregar calendário
  renderCalendar();
  renderEvents();
};

// Função para preparar eventos ambientais para importação
window.prepareEnvironmentalEvents = function prepareEnvironmentalEvents() {
  // Dados dos eventos ambientais (do calendário ambiental)
  const environmentalDates = {
  'Janeiro': [
    {
      date: '2025-01-11',
      title: 'Dia do Controle da Poluição por Agrotóxicos',
      description: 'Data para conscientização sobre o uso responsável de agrotóxicos',
      category: 'brasil',
      tags: ['Agricultura', 'Poluição']
    },
    {
      date: '2025-01-31',
      title: 'Dia do Engenheiro Ambiental',
      description: 'Valorização dos profissionais que trabalham com soluções ambientais',
      category: 'brasil',
      tags: ['Profissões', 'Engenharia Ambiental']
    }
  ],
  'Fevereiro': [
    {
      date: '2025-02-02',
      title: 'Dia Mundial das Zonas Úmidas',
      description: 'Proteção de pântanos, brejos e outros ecossistemas aquáticos',
      category: 'mundial',
      tags: ['Biodiversidade', 'Água']
    },
    {
      date: '2025-02-06',
      title: 'Dia do Pantanal',
      description: 'Celebração da maior planície alagável do mundo',
      category: 'brasil',
      tags: ['Pantanal', 'Biodiversidade']
    }
  ],
  'Março': [
    {
      date: '2025-03-01',
      title: 'Dia do Turismo Ecológico',
      description: 'Promoção do turismo sustentável e consciente',
      category: 'brasil',
      tags: ['Turismo', 'Sustentabilidade']
    },
    {
      date: '2025-03-14',
      title: 'Dia Mundial de Luta dos Atingidos por Barragens',
      description: 'Conscientização sobre impactos socioambientais de grandes barragens',
      category: 'mundial',
      tags: ['Recursos Hídricos', 'Direitos Humanos']
    },
    {
      date: '2025-03-21',
      title: 'Dia Mundial das Florestas',
      description: 'Conscientização sobre a importância das florestas para o planeta',
      category: 'mundial',
      tags: ['Florestas', 'Biodiversidade']
    },
    {
      date: '2025-03-22',
      title: 'Dia Mundial da Água',
      description: 'Sensibilização para a conservação dos recursos hídricos',
      category: 'mundial',
      tags: ['Água', 'Conservação']
    },
    {
      date: '2025-03-23',
      title: 'Dia Mundial da Meteorologia',
      description: 'Importância da meteorologia para o meio ambiente',
      category: 'mundial',
      tags: ['Clima', 'Meteorologia']
    }
  ],
  'Abril': [
    {
      date: '2025-04-07',
      title: 'Dia Mundial da Saúde',
      description: 'Relação entre saúde humana e meio ambiente',
      category: 'mundial',
      tags: ['Saúde', 'Meio Ambiente']
    },
    {
      date: '2025-04-15',
      title: 'Dia Nacional da Conservação do Solo',
      description: 'Preservação e manejo sustentável do solo brasileiro',
      category: 'brasil',
      tags: ['Solo', 'Agricultura']
    },
    {
      date: '2025-04-19',
      title: 'Dia do Índio',
      description: 'Reconhecimento dos povos indígenas e sua relação com a natureza',
      category: 'brasil',
      tags: ['Povos Indígenas', 'Cultura']
    },
    {
      date: '2025-04-22',
      title: 'Dia Mundial da Terra',
      description: 'Maior evento ambiental do mundo, celebrado globalmente',
      category: 'mundial',
      tags: ['Terra', 'Sustentabilidade']
    }
  ],
  'Maio': [
    {
      date: '2025-05-03',
      title: 'Dia do Sol',
      description: 'Importância da energia solar e fontes renováveis',
      category: 'mundial',
      tags: ['Energia Solar', 'Renovável']
    },
    {
      date: '2025-05-15',
      title: 'Dia do Gari',
      description: 'Valorização dos profissionais de limpeza urbana',
      category: 'brasil',
      tags: ['Limpeza', 'Urbano']
    },
    {
      date: '2025-05-22',
      title: 'Dia Internacional da Biodiversidade',
      description: 'Conservação da diversidade biológica mundial',
      category: 'mundial',
      tags: ['Biodiversidade', 'Conservação']
    },
    {
      date: '2025-05-27',
      title: 'Dia da Mata Atlântica',
      description: 'Proteção do bioma mais ameaçado do Brasil',
      category: 'brasil',
      tags: ['Mata Atlântica', 'Bioma']
    }
  ],
  'Junho': [
    {
      date: '2025-06-03',
      title: 'Dia Nacional da Educação Ambiental',
      description: 'Promoção da consciência ecológica através da educação',
      category: 'brasil',
      tags: ['Educação Ambiental', 'Consciência Ecológica']
    },
    {
      date: '2025-06-05',
      title: 'Dia Mundial do Meio Ambiente',
      description: 'Principal data do calendário ambiental mundial',
      category: 'mundial',
      tags: ['Meio Ambiente', 'Sustentabilidade']
    },
    {
      date: '2025-06-07',
      title: 'Dia Nacional do Catador(a) de Material Reciclável',
      description: 'Valorização dos profissionais da reciclagem e economia circular',
      category: 'brasil',
      tags: ['Reciclagem', 'Economia Circular']
    },
    {
      date: '2025-06-08',
      title: 'Dia Mundial dos Oceanos',
      description: 'Preservação dos ecossistemas marinhos',
      category: 'mundial',
      tags: ['Oceanos', 'Vida Marinha']
    },
    {
      date: '2025-06-16',
      title: 'Dia Mundial da Tartaruga Marinha',
      description: 'Conservação das tartarugas marinhas e seus habitats',
      category: 'mundial',
      tags: ['Tartarugas', 'Vida Marinha', 'Conservação']
    },
    {
      date: '2025-06-17',
      title: 'Dia Mundial de Combate à Desertificação',
      description: 'Prevenção da degradação do solo',
      category: 'mundial',
      tags: ['Desertificação', 'Solo']
    },
    {
      date: '2025-06-17',
      title: 'Dia do Gestor Ambiental',
      description: 'Reconhecimento dos profissionais de gestão ambiental',
      category: 'brasil',
      tags: ['Gestão Ambiental', 'Profissões']
    }
  ],
  'Julho': [
    {
      date: '2025-07-11',
      title: 'Dia Mundial da População',
      description: 'Relação entre crescimento populacional e recursos naturais',
      category: 'mundial',
      tags: ['População', 'Recursos']
    },
    {
      date: '2025-07-17',
      title: 'Dia de Proteção às Florestas',
      description: 'Conservação das florestas brasileiras',
      category: 'brasil',
      tags: ['Florestas', 'Proteção']
    },
    {
      date: '2025-07-23',
      title: 'Dia da Criação do IBAMA',
      description: 'Reconhecimento do papel do IBAMA na proteção ambiental',
      category: 'brasil',
      tags: ['IBAMA', 'Fiscalização Ambiental']
    }
  ],
  'Agosto': [
    {
      date: '2025-08-09',
      title: 'Dia Internacional dos Povos Indígenas',
      description: 'Reconhecimento dos guardiões ancestrais da natureza',
      category: 'mundial',
      tags: ['Povos Indígenas', 'Tradição']
    },
    {
      date: '2025-08-24',
      title: 'Dia da Infância',
      description: 'Educação ambiental para as futuras gerações',
      category: 'brasil',
      tags: ['Educação', 'Infância']
    }
  ],
  'Setembro': [
    {
      date: '2025-09-05',
      title: 'Dia da Amazônia',
      description: 'Maior floresta tropical do mundo',
      category: 'brasil',
      tags: ['Amazônia', 'Floresta Tropical']
    },
    {
      date: '2025-09-16',
      title: 'Dia Internacional para Preservação da Camada de Ozônio',
      description: 'Proteção da camada de ozônio',
      category: 'mundial',
      tags: ['Ozônio', 'Atmosfera']
    },
    {
      date: '2025-09-21',
      title: 'Dia da Árvore',
      description: 'Importância das árvores para o meio ambiente',
      category: 'brasil',
      tags: ['Árvores', 'Reflorestamento']
    },
    {
      date: '2025-09-22',
      title: 'Dia Mundial Sem Carros',
      description: 'Redução da poluição do ar e incentivo ao transporte sustentável',
      category: 'mundial',
      tags: ['Transporte', 'Poluição do Ar']
    }
  ],
    
  'Outubro': [
    {
      date: '2025-10-04',
      title: 'Dia Mundial dos Animais',
      description: 'Proteção e bem-estar animal',
      category: 'mundial',
      tags: ['Animais', 'Bem-estar']
    },
    {
      date: '2025-10-12',
      title: 'Dia do Mar',
      description: 'Preservação dos ecossistemas marinhos brasileiros',
      category: 'brasil',
      tags: ['Mar', 'Ecossistemas Marinhos']
    },
    {
      date: '2025-10-15',
      title: 'Dia do Professor',
      description: 'Educadores ambientais e sua importância',
      category: 'brasil',
      tags: ['Educação', 'Professores']
    }
  ],
  'Novembro': [
    {
      date: '2025-11-01',
      title: 'Dia Nacional da Espeleologia',
      description: 'Estudo e preservação de cavernas e grutas',
      category: 'brasil',
      tags: ['Espeleologia', 'Cavernas']
    },
    {
      date: '2025-11-01',
      title: 'Dia Mundial do Veganismo',
      description: 'Conscientização sobre impactos ambientais da alimentação',
      category: 'mundial',
      tags: ['Veganismo', 'Sustentabilidade Alimentar']
    },
    {
      date: '2025-11-14',
      title: 'Dia Nacional da Alfabetização Ecológica',
      description: 'Educação ambiental e consciência ecológica',
      category: 'brasil',
      tags: ['Educação Ambiental', 'Alfabetização']
    },
    {
      date: '2025-11-19',
      title: 'Dia Nacional de Combate à Dengue',
      description: 'Prevenção e controle de doenças transmitidas por vetores',
      category: 'brasil',
      tags: ['Saúde Pública', 'Dengue']
    },
    {
      date: '2025-11-24',
      title: 'Dia do Rio',
      description: 'Preservação dos recursos hídricos e ecossistemas aquáticos',
      category: 'brasil',
      tags: ['Rios', 'Recursos Hídricos']
    },
    {
      date: '2025-11-29',
      title: 'Dia Nacional da Onça-Pintada',
      description: 'Conservação do maior felino das Américas',
      category: 'brasil',
      tags: ['Onça-Pintada', 'Fauna Brasileira']
    },
    {
      date: '2025-11-30',
      title: 'Dia Nacional de Luta contra o Uso de Agrotóxicos',
      description: 'Agricultura sustentável e segura',
      category: 'brasil',
      tags: ['Agrotóxicos', 'Agricultura Sustentável']
    }
  ],
  'Dezembro': [
    {
      date: '2025-12-05',
      title: 'Dia Mundial do Solo',
      description: 'Importância do solo para a vida no planeta',
      category: 'mundial',
      tags: ['Solo', 'Agricultura']
    },
    {
      date: '2025-12-05',
      title: 'Dia Internacional do Voluntariado',
      description: 'Promoção do voluntariado em projetos ambientais',
      category: 'mundial',
      tags: ['Voluntariado', 'Participação Social']
    },
    {
      date: '2025-12-11',
      title: 'Dia Internacional das Montanhas',
      description: 'Preservação dos ecossistemas montanhosos',
      category: 'mundial',
      tags: ['Montanhas', 'Ecossistemas']
    }
  ]
};

  // Converter para formato da agenda
  const eventsToImport = [];
  const currentYear = new Date().getFullYear();
  
  Object.values(environmentalDates).forEach(monthEvents => {
    monthEvents.forEach(event => {
      const [day, month] = event.date.split('/');
      const eventDate = new Date(currentYear, parseInt(month) - 1, parseInt(day));
      
      eventsToImport.push({
        id: `env_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: event.title,
        description: event.description,
        date: eventDate.toISOString().split('T')[0],
        time: '09:00',
        endTime: '17:00',
        category: 'ambiental',
        priority: 'normal',
        tags: event.tags.join(', '),
        recurring: 'yearly',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    });
  });
  
  // Salvar eventos para importação
  localStorage.setItem('environmentalEventsToImport', JSON.stringify(eventsToImport));
  
  return eventsToImport.length;
};

// Função para adicionar botão de importação (chame onde for apropriado)
window.addEnvironmentalImportButton = function addEnvironmentalImportButton(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const button = document.createElement('button');
  button.className = 'btn btn-success me-2 mb-2';
  button.innerHTML = '🌍 Importar Calendário Ambiental';
  button.onclick = async function() {
    const count = prepareEnvironmentalEvents();
    if (count > 0) {
      await importEnvironmentalEvents();
    }
  };
  
  container.appendChild(button);
};

// Auto-executar se estiver na página principal da agenda
document.addEventListener('DOMContentLoaded', function() {
  // Adicionar botão se existir um container apropriado
  const buttonContainer = document.querySelector('.d-flex.gap-2.mb-3') || 
                          document.querySelector('.btn-group') ||
                          document.querySelector('.header-buttons');
  
  if (buttonContainer) {
    const button = document.createElement('button');
    button.className = 'btn btn-outline-success';
    button.innerHTML = '🌍 Calendário Ambiental';
    button.onclick = async function() {
      const count = prepareEnvironmentalEvents();
      if (count > 0) {
        await importEnvironmentalEvents();
      }
    };
    buttonContainer.appendChild(button);
  }
});

console.log('✅ Módulo de importação de eventos ambientais carregado!');
