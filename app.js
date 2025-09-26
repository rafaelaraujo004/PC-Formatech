// app.js - PWA frontend logic for PC Formatech
const DEFAULT_SERVICES = [
  { id: 'f-windows', name: 'Formatação + Instalação do Windows', desc: 'Formatação completa do sistema, instalação do Windows atualizado, drivers e ajustes essenciais para desempenho máximo.', price: 120.00 },
  { id: 'office-basic', name: 'Instalação Kit Office 365 - Vitalício', desc: 'Instalação e configuração do pacote Office (Word, Excel, PowerPoint) pronto para uso.', price: 50.00 },
  { id: 'office-pro', name: 'Instalação Kit Office 365 - Versão Premium', desc: 'Instalação com suporte estendido e configuração personalizada para produtividade profissional.', price: 120.00 },
  { id: 'utilitarios', name: 'Instalação de utilitários', desc: 'Pacote de programas essenciais: navegador, leitor de PDF, compactador, antivírus básico e ferramentas úteis.', price: 60.00 },
  { id: 'clean-full', name: 'Limpeza completa (interna + externa premium)', desc: 'Higienização completa do equipamento, remoção de poeira interna, limpeza externa detalhada e verificação de ventilação. Aplicação de pasta térmica quando necessário (custo da pasta à parte).', price: 50.00 },
  { id: 'clean-ext', name: 'Limpeza simples Externa', desc: 'Limpeza da carcaça, teclado e partes externas para melhorar aparência e higiene.', price: 25.00 },
  { id: 'clean-int', name: 'Limpeza simples interna', desc: 'Remoção básica de poeira interna para ajudar na refrigeração e prevenir superaquecimento.', price: 25.00 },
  { id: 'upgrades', name: 'Mão de obra instalação Memória + SSD', desc: 'Instalação física e configuração de memória RAM e SSD (não inclui peças), testes e otimizações para melhor performance.', price: 80.00 }
];

const storageKey = 'pcformatech_services_v1';

// === Configure aqui o número da sua empresa (formato internacional, sem "+"):
// Exemplo para Brasil (São Paulo): "5511999999999"
const BUSINESS_PHONE = '5511999999999'; // <--- SUBSTITUA pelo seu número real

function getServices(){
  const raw = localStorage.getItem(storageKey);
  if(!raw) {
    localStorage.setItem(storageKey, JSON.stringify(DEFAULT_SERVICES));
    return [...DEFAULT_SERVICES];
  }
  try {
    return JSON.parse(raw);
  } catch {
    localStorage.setItem(storageKey, JSON.stringify(DEFAULT_SERVICES));
    return [...DEFAULT_SERVICES];
  }
}
function saveServices(list){
  localStorage.setItem(storageKey, JSON.stringify(list));
}

const servicesListEl = document.getElementById('servicesList');
const searchEl = document.getElementById('search');
const addServiceBtn = document.getElementById('addServiceBtn');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const svcName = document.getElementById('svc-name');
const svcDesc = document.getElementById('svc-desc');
const svcPrice = document.getElementById('svc-price');
const saveSvcBtn = document.getElementById('saveSvcBtn');
const cancelSvcBtn = document.getElementById('cancelSvcBtn');
const whatsappAllBtn = document.getElementById('whatsappAllBtn');
const installBtn = document.getElementById('installBtn');

let services = getServices();
let editingId = null;

function formatPrice(n){ return 'R$ ' + Number(n).toFixed(2).replace('.', ','); }

function renderServices(filter=''){
  servicesListEl.innerHTML = '';
  const tpl = document.getElementById('serviceItemTpl');
  const filtered = services.filter(s => (s.name + ' ' + s.desc).toLowerCase().includes(filter.toLowerCase()));
  if(filtered.length === 0){
    servicesListEl.innerHTML = '<li class="service-item"><div class="left"><div class="svc-title">Nenhum serviço encontrado</div><div class="svc-desc">Tente outro termo</div></div></li>';
    return;
  }
  filtered.forEach(s => {
    const clone = tpl.content.cloneNode(true);
    clone.querySelector('.svc-title').textContent = s.name;
    clone.querySelector('.svc-desc').textContent = s.desc;
    clone.querySelector('.svc-price').textContent = formatPrice(s.price);
    const btnWhats = clone.querySelector('.whatsapp');
    btnWhats.addEventListener('click', () => openWhatsAppForService(s));
    clone.querySelector('.edit').addEventListener('click', () => openEditService(s));
    clone.querySelector('.delete').addEventListener('click', () => deleteService(s.id));
    servicesListEl.appendChild(clone);
  });
}

function openWhatsAppForService(s){
  const phone = BUSINESS_PHONE; // use the business phone set above
  const text = encodeURIComponent(`Olá! Gostaria de solicitar o serviço: *${s.name}* (${formatPrice(s.price)})\nDescrição: ${s.desc}\n\nNome: \nTelefone: \nEndereço: `);
  const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://api.whatsapp.com/send?text=${text}`;
  window.open(url, '_blank');
}

function openEditService(s){
  editingId = s.id;
  modalTitle.textContent = 'Editar Serviço';
  svcName.value = s.name;
  svcDesc.value = s.desc;
  svcPrice.value = s.price;
  modal.classList.remove('hidden');
}

function deleteService(id){
  if(!confirm('Apagar este serviço?')) return;
  services = services.filter(s => s.id !== id);
  saveServices(services);
  renderServices(searchEl.value);
}

function openNewService(){
  editingId = null;
  modalTitle.textContent = 'Novo Serviço';
  svcName.value = '';
  svcDesc.value = '';
  svcPrice.value = '';
  modal.classList.remove('hidden');
}

saveSvcBtn.addEventListener('click', () => {
  const name = svcName.value.trim();
  const desc = svcDesc.value.trim();
  const price = Number(svcPrice.value);
  if(!name || !desc || isNaN(price)){
    alert('Preencha todos os campos corretamente.');
    return;
  }
  if(editingId){
    services = services.map(s => s.id === editingId ? {...s, name, desc, price} : s);
  } else {
    const id = name.toLowerCase().replace(/\s+/g,'-') + '-' + Date.now();
    services.push({ id, name, desc, price });
  }
  saveServices(services);
  modal.classList.add('hidden');
  renderServices(searchEl.value);
});

cancelSvcBtn.addEventListener('click', () => modal.classList.add('hidden'));
addServiceBtn.addEventListener('click', openNewService);
searchEl.addEventListener('input', e => renderServices(e.target.value));

// enviar mensagem genérica com lista resumida
whatsappAllBtn.addEventListener('click', () => {
  const phone = BUSINESS_PHONE;
  const summary = services.map(s => `${s.name} - ${formatPrice(s.price)}`).join('\n');
  const text = encodeURIComponent(`Olá! Gostaria de informações sobre os serviços do PC Formatech:\n\n${summary}\n\nNome: \nTelefone: \nEndereço: `);
  const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://api.whatsapp.com/send?text=${text}`;
  window.open(url, '_blank');
});

// install prompt handling
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.classList.remove('hidden');
});
installBtn.addEventListener('click', async () => {
  if(!deferredPrompt) return;
  deferredPrompt.prompt();
  const choice = await deferredPrompt.userChoice;
  if(choice.outcome === 'accepted') console.log('App instalado');
  deferredPrompt = null;
  installBtn.classList.add('hidden');
});

// initial render
renderServices();
