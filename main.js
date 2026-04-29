document.addEventListener('DOMContentLoaded', () => {
    // Carrossel Hero
    const indicatorsContainer = document.querySelector('.hero-indicators');
    let currentSlide = 0;
    let slideTimer = null;
    const HERO_SLIDE_INTERVAL_MS = 10000;

    function getSlides() {
        return Array.from(document.querySelectorAll('.hero-slide'));
    }

    function getIndicators() {
        return Array.from(document.querySelectorAll('.indicator'));
    }

    function ensureIndicators(slides) {
        if (!indicatorsContainer) {
            return [];
        }

        let indicators = getIndicators();
        if (indicators.length !== slides.length) {
            indicatorsContainer.innerHTML = '';

            slides.forEach((_, index) => {
                const indicator = document.createElement('span');
                indicator.className = `indicator${index === 0 ? ' active' : ''}`;
                indicator.dataset.slide = String(index);
                indicatorsContainer.appendChild(indicator);
            });

            indicators = getIndicators();
        }

        return indicators;
    }

    function normalizeSlideIndex(index) {
        const slides = getSlides();
        if (!slides.length) return 0;
        return (index + slides.length) % slides.length;
    }

    function preloadSlideImage(index) {
        const slides = getSlides();
        const targetSlide = slides[index];
        if (!targetSlide) return;

        const img = targetSlide.querySelector('img');
        if (!img || img.complete) return;

        img.decoding = 'async';
        img.loading = 'eager';

        const src = img.currentSrc || img.src;
        if (src) {
            const preloader = new Image();
            preloader.src = src;
        }
    }

    function showSlide(index) {
        const slides = getSlides();
        if (!slides.length) return;

        const safeIndex = normalizeSlideIndex(index);
        const indicators = ensureIndicators(slides);

        // Remove active de todos
        slides.forEach(slide => slide.classList.remove('active'));
        indicators.forEach(indicator => indicator.classList.remove('active'));
        
        // Adiciona active ao slide atual
        const activeSlide = slides[safeIndex];
        if (activeSlide) {
            activeSlide.classList.add('active');
        }

        const activeIndicator = indicators[safeIndex];
        if (activeIndicator) {
            activeIndicator.classList.add('active');
        }

        currentSlide = safeIndex;
        preloadSlideImage(normalizeSlideIndex(safeIndex + 1));
    }

    function stopSlideshow() {
        if (slideTimer) {
            clearTimeout(slideTimer);
            slideTimer = null;
        }
    }

    function startSlideshow() {
        const slides = getSlides();
        if (slides.length <= 1) return;

        stopSlideshow();
        slideTimer = setTimeout(() => {
            showSlide(currentSlide + 1);
            startSlideshow();
        }, HERO_SLIDE_INTERVAL_MS);
    }

    function bindIndicatorEvents() {
        const indicators = getIndicators();
        indicators.forEach((indicator, index) => {
            if (indicator.dataset.heroBound === '1') {
                return;
            }

            indicator.dataset.heroBound = '1';
            indicator.addEventListener('click', () => {
                showSlide(index);
                startSlideshow();
            });
        });
    }

    function refreshHeroSlider(options = {}) {
        const slides = getSlides();
        if (!slides.length) {
            stopSlideshow();
            return;
        }

        if (options.resetIndex || currentSlide >= slides.length) {
            currentSlide = 0;
        }

        ensureIndicators(slides);
        bindIndicatorEvents();
        showSlide(currentSlide);
        startSlideshow();
    }

    window.refreshHeroSlider = refreshHeroSlider;

    ensureIndicators(getSlides());
    bindIndicatorEvents();

    // Função para mudar slide (usada pelos botões de navegação)
    window.changeSlide = function(direction) {
        if (!getSlides().length) return;
        showSlide(currentSlide + direction);
        startSlideshow();
    };

    // Navegação por teclado (setas)
    document.addEventListener('keydown', (e) => {
        const activeTag = document.activeElement && document.activeElement.tagName;
        if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') {
            return;
        }

        if (e.key === 'ArrowLeft') {
            window.changeSlide(-1);
        } else if (e.key === 'ArrowRight') {
            window.changeSlide(1);
        }
    });

    // Evita drift/travas quando a aba fica em segundo plano
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopSlideshow();
            return;
        }
        startSlideshow();
    });

    refreshHeroSlider();

    // Ocultar header ao rolar para baixo
    let lastScrollTop = 0;
    const header = document.querySelector('.header');
    const scrollToTopBtn = document.getElementById('scrollToTop');
    
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
            if (scrollTop > lastScrollTop && scrollTop > 100) {
                // Rolando para baixo
                header.classList.add('hidden');
            } else {
                // Rolando para cima
                header.classList.remove('hidden');
            }
        
            // Mostrar/ocultar botão de voltar ao topo
            if (scrollTop > 300) {
                scrollToTopBtn.classList.add('show');
            } else {
                scrollToTopBtn.classList.remove('show');
            }
        
            lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
        });

    // Sincronizar valores dos serviços do admin com o formulário de agendamento
    function syncServicePricesWithAdmin() {
        const adminData = localStorage.getItem('pcformatech_services');
        if (!adminData) return;
        const services = JSON.parse(adminData);
        // Mapeamento entre value do formulário e chave do admin
        const serviceMap = {
            'Formatação de Computador': 'formatacao',
            'Instalação de Programas': 'programas',
            'Proteção e Segurança': 'seguranca',
            'Manutenção Preventiva': 'manutencao',
            'Instalação de Drivers': 'drivers',
            'Backup de Dados': 'backup'
        };
        document.querySelectorAll('input[name="service[]"]').forEach(checkbox => {
            const formValue = checkbox.value;
            const adminKey = serviceMap[formValue];
            if (adminKey && services[adminKey] && typeof services[adminKey].price === 'number') {
                checkbox.setAttribute('data-price', services[adminKey].price);
                // Atualiza o texto do label, se necessário
                const span = checkbox.parentElement.querySelector('span');
                if (span) {
                    span.textContent = `${formValue} - R$ ${services[adminKey].price.toFixed(2).replace('.', ',')}`;
                }
            }
        });

        // Sincronizar valores dos cards de serviço na área 'Nossos Serviços'
        const cardMap = {
            'formatacao': 'Formatação de Computadores',
            'programas': 'Instalação de Programas',
            'seguranca': 'Proteção e Segurança',
            'manutencao': 'Manutenção Preventiva',
            'drivers': 'Instalação de Drivers',
            'backup': 'Backup de Dados'
        };
        Object.keys(cardMap).forEach(adminKey => {
            const card = document.querySelector(`.service-card[data-modal="${adminKey}"]`);
            if (card && services[adminKey] && typeof services[adminKey].price === 'number') {
                // Atualiza o valor no price-tag
                const priceTag = card.querySelector('.price-tag span:last-child');
                if (priceTag) {
                    priceTag.textContent = `R$ ${services[adminKey].price.toFixed(2).replace('.', ',')}`;
                }
                // Atualiza o texto do botão, se desejar
                // Atualiza outros locais do card se necessário
            }
        });
    }

    // Sincronizar valores dos serviços do admin com o formulário de agendamento
    syncServicePricesWithAdmin();

    // Funcionalidade do botão voltar ao topo
    if (scrollToTopBtn) {
        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // Controle do anúncio Alelo
    const announcement = document.querySelector('.alelo-announcement');
    if (announcement) {
        setTimeout(() => {
            announcement.addEventListener('animationend', (e) => {
                if (e.animationName === 'slideOut') {
                    announcement.remove();
                }
            });
        }, 3000);
    }

    // Menu Mobile DESABILITADO - Layout desktop sempre visível
    // O menu hamburguer não será utilizado
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    // Remove qualquer comportamento de menu mobile
    if (menuToggle) {
        menuToggle.style.display = 'none';
    }
    
    if (navLinks) {
        navLinks.style.display = 'flex';
        navLinks.classList.remove('active');
    }

    // Funcionalidade dos modais de serviço
    const serviceCards = document.querySelectorAll('.service-card');
    const modals = document.querySelectorAll('.modal');
    const closeButtons = document.querySelectorAll('.close-modal');
    const whatsappButtons = document.querySelectorAll('.whatsapp-btn');

    // Adicionar eventos aos cards de serviço
    serviceCards.forEach(card => {
        const detailsBtn = card.querySelector('.service-details-btn');
        const modalId = card.getAttribute('data-modal');
        
        // Verificar se é o card de link do formulário (não tem modal)
        if (detailsBtn && !modalId && card.classList.contains('service-card-link')) {
            // Este é o card do formulário - deixar o link funcionar normalmente
            return;
        }
        
        if (detailsBtn && modalId) {
            detailsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const modal = document.getElementById(`modal-${modalId}`);
                if (modal) {
                    modal.style.display = 'block';
                    document.body.style.overflow = 'hidden';
                    // Esconder widget do WhatsApp
                    const whatsappWidget = document.querySelector('.whatsapp-widget');
                    if (whatsappWidget) {
                        whatsappWidget.style.display = 'none';
                    }
                }
            });
        }
    });

    // Fechar modal ao clicar no X
    closeButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const modal = button.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
                document.body.style.overflow = '';
                // Mostrar widget do WhatsApp novamente
                const whatsappWidget = document.querySelector('.whatsapp-widget');
                if (whatsappWidget) {
                    whatsappWidget.style.display = 'block';
                }
            }
        });
    });

    // Fechar modal ao clicar fora
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
            document.body.style.overflow = '';
            // Mostrar widget do WhatsApp novamente
            const whatsappWidget = document.querySelector('.whatsapp-widget');
            if (whatsappWidget) {
                whatsappWidget.style.display = 'block';
            }
        }
    });

    // WhatsApp Integration
    whatsappButtons.forEach(button => {
        button.addEventListener('click', () => {
            const service = button.getAttribute('data-service') || 'Atendimento';
            const message = `Olá! Gostaria de mais informações sobre o serviço de ${service}.`;
            const whatsappNumber = '5594984305772';
            const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
        });
    });

    // Sistema de Agendamento com WhatsApp
    const schedulingForm = document.getElementById('scheduling-form');

    if (schedulingForm) {
        // Definir data mínima como hoje
        const dateInput = document.getElementById('schedule-date');
        const timeSelect = document.getElementById('schedule-time');
        const attendanceTypeSelect = document.getElementById('attendance-type');
        const cleaningTypeSelect = document.getElementById('cleaning-type');
        const totalValueDisplay = document.getElementById('total-value');
        const serviceCheckboxes = document.querySelectorAll('input[name="service[]"]');
        
        // Função para calcular o valor total
        function calculateTotal() {
            let total = 0;
            let servicesTotal = 0; // Total apenas dos serviços (sem limpeza)
            
            // Somar valores dos serviços selecionados
            serviceCheckboxes.forEach(checkbox => {
                if (checkbox.checked) {
                    const price = parseFloat(checkbox.getAttribute('data-price'));
                    servicesTotal += price;
                    total += price;
                }
            });
            
            // Adicionar valor da limpeza se selecionada (SEM desconto)
            let cleaningPrice = 0;
            if (cleaningTypeSelect) {
                const selectedCleaningOption = cleaningTypeSelect.options[cleaningTypeSelect.selectedIndex];
                cleaningPrice = parseFloat(selectedCleaningOption.getAttribute('data-price')) || 0;
                total += cleaningPrice;
            }
            
            // Aplicar desconto de 20% APENAS nos serviços (excluindo limpeza)
            const isRemote = attendanceTypeSelect && attendanceTypeSelect.value === 'Remoto (AnyDesk)';
            let discount = 0;
            
            if (isRemote && servicesTotal > 0) {
                discount = servicesTotal * 0.20; // Desconto apenas sobre serviços
                total = total - discount; // Subtrai desconto do total (que inclui limpeza sem desconto)
            }
            
            // Atualizar display
            if (totalValueDisplay) {
                totalValueDisplay.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
                
                // Adicionar badge de desconto se aplicável
                if (isRemote && discount > 0) {
                    const existingBadge = totalValueDisplay.parentElement.querySelector('.discount-badge');
                    if (existingBadge) existingBadge.remove();
                    
                    const badge = document.createElement('span');
                    badge.className = 'discount-badge';
                    badge.textContent = `-20% (R$ ${discount.toFixed(2).replace('.', ',')})`;
                    totalValueDisplay.parentElement.appendChild(badge);
                } else {
                    const existingBadge = totalValueDisplay.parentElement.querySelector('.discount-badge');
                    if (existingBadge) existingBadge.remove();
                }
            }
            
            return total;
        }
        
        // Adicionar listeners aos checkboxes
        serviceCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', calculateTotal);
        });
        
        // Adicionar listener ao tipo de atendimento
        if (attendanceTypeSelect) {
            attendanceTypeSelect.addEventListener('change', calculateTotal);
        }
        
        // Adicionar listener ao tipo de limpeza
        if (cleaningTypeSelect) {
            cleaningTypeSelect.addEventListener('change', calculateTotal);
        }
        
        if (dateInput) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.min = today;
            
            // Atualizar horários disponíveis quando a data mudar
            dateInput.addEventListener('change', function() {
                updateAvailableHours(this.value, timeSelect);
            });
        }
        
        // Função para atualizar horários disponíveis baseado no dia da semana
        function updateAvailableHours(selectedDate, timeSelect) {
            if (!selectedDate || !timeSelect) return;
            
            const date = new Date(selectedDate + 'T00:00:00');
            const dayOfWeek = date.getDay(); // 0 = Domingo, 6 = Sábado
            
            // Limpar opções atuais
            timeSelect.innerHTML = '<option value="">Selecione um horário</option>';
            
            // Domingo - não funcionamos
            if (dayOfWeek === 0) {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'Não funcionamos aos domingos';
                option.disabled = true;
                timeSelect.appendChild(option);
                timeSelect.disabled = true;
                return;
            }
            
            timeSelect.disabled = false;
            
            // Horários padrão: Segunda a Sexta (8h às 18h)
            const weekdayHours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
            
            // Horários sábado: 8h às 12h
            const saturdayHours = ['08:00', '09:00', '10:00', '11:00', '12:00'];
            
            const availableHours = dayOfWeek === 6 ? saturdayHours : weekdayHours;
            
            availableHours.forEach(hour => {
                const option = document.createElement('option');
                option.value = hour;
                option.textContent = hour;
                timeSelect.appendChild(option);
            });
        }

        // Máscara para telefone
        const clientPhone = document.getElementById('client-phone');
        if (clientPhone) {
            clientPhone.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length > 11) value = value.slice(0, 11);
                
                if (value.length > 2) {
                    value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
                }
                if (value.length > 10) {
                    value = `${value.slice(0, 10)}-${value.slice(10)}`;
                }
                
                e.target.value = value;
            });
        }

        schedulingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Coletar dados do formulário
        const name = document.getElementById('client-name').value;
        const phone = document.getElementById('client-phone').value;
        
        // Coletar múltiplos serviços selecionados
        const serviceCheckboxes = document.querySelectorAll('input[name="service[]"]:checked');
        const services = Array.from(serviceCheckboxes).map(cb => cb.value);
        const servicesWithPrice = Array.from(serviceCheckboxes).map(cb => {
            const price = parseFloat(cb.getAttribute('data-price'));
            return { name: cb.value, price: price };
        });
        
        const attendanceType = document.getElementById('attendance-type').value;
        const date = document.getElementById('schedule-date').value;
        const time = document.getElementById('schedule-time').value;
        const address = document.getElementById('client-address').value;
        const notes = document.getElementById('additional-info').value;
        
        // Validação
        if (!name || !phone || services.length === 0 || !date || !time || !attendanceType) {
            alert('Por favor, preencha todos os campos obrigatórios (*) e selecione pelo menos um serviço.');
            return;
        }
        
        // Validar data (não pode ser no passado)
        const selectedDate = new Date(date + 'T00:00:00');
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        
        if (selectedDate < todayDate) {
            alert('Por favor, selecione uma data futura para o agendamento.');
            return;
        }
        
        // Validar se não é domingo
        if (selectedDate.getDay() === 0) {
            alert('Não funcionamos aos domingos. Por favor, selecione outro dia.');
            return;
        }
        
        // Validar horário para sábado
        if (selectedDate.getDay() === 6) {
            const hour = parseInt(time.split(':')[0]);
            if (hour > 12) {
                alert('Aos sábados funcionamos apenas das 8h às 12h. Por favor, selecione outro horário.');
                return;
            }
        }
        
        // Formatar data para português
        const dateFormatted = new Date(date + 'T00:00:00').toLocaleDateString('pt-BR');
        
        // Calcular valor total
        let totalValue = 0;
        servicesWithPrice.forEach(service => {
            totalValue += service.price;
        });
        
        // Adicionar valor da limpeza
        const cleaningType = document.getElementById('cleaning-type');
        const selectedCleaningOption = cleaningType.options[cleaningType.selectedIndex];
        const cleaningPrice = parseFloat(selectedCleaningOption.getAttribute('data-price')) || 0;
        const cleaningName = cleaningType.value;
        
        if (cleaningPrice > 0) {
            totalValue += cleaningPrice;
        }
        
        const isRemote = attendanceType === 'Remoto (AnyDesk)';
        let discount = 0;
        let finalValue = totalValue;
        
        if (isRemote) {
            discount = totalValue * 0.20;
            finalValue = totalValue - discount;
        }
        
        // Montar mensagem para WhatsApp
        let message = String.fromCodePoint(0x1F4CB) + ` *NOVO AGENDAMENTO*\n\n`;
        message += String.fromCodePoint(0x1F464) + ` *Nome:* ${name}\n`;
        message += String.fromCodePoint(0x1F4F1) + ` *Telefone:* ${phone}\n`;
        message += String.fromCodePoint(0x1F4BB) + ` *Serviços Solicitados:*\n`;
        
        // Adicionar cada serviço em uma linha com preço
        servicesWithPrice.forEach((service, index) => {
            message += `   ${index + 1}. ${service.name} - R$ ${service.price.toFixed(2).replace('.', ',')}\n`;
        });
        
        // Adicionar limpeza se selecionada
        if (cleaningPrice > 0) {
            message += `   ${servicesWithPrice.length + 1}. ${cleaningName} - R$ ${cleaningPrice.toFixed(2).replace('.', ',')}\n`;
        }
        
        message += `\n` + String.fromCodePoint(0x1F4B0) + ` *Subtotal:* R$ ${totalValue.toFixed(2).replace('.', ',')}\n`;
        
        if (isRemote && discount > 0) {
            message += String.fromCodePoint(0x1F389) + ` *Desconto (20% Remoto):* -R$ ${discount.toFixed(2).replace('.', ',')}\n`;
            message += String.fromCodePoint(0x1F4B5) + ` *VALOR TOTAL:* R$ ${finalValue.toFixed(2).replace('.', ',')}*\n\n`;
        } else {
            message += String.fromCodePoint(0x1F4B5) + ` *VALOR TOTAL:* R$ ${finalValue.toFixed(2).replace('.', ',')}*\n\n`;
        }
        
        message += String.fromCodePoint(0x1F527) + ` *Tipo de Atendimento:* ${attendanceType}\n`;
        message += String.fromCodePoint(0x1F4C5) + ` *Data:* ${dateFormatted}\n`;
        message += String.fromCodePoint(0x1F550) + ` *Horário:* ${time}\n`;
        
        if (address) {
            message += String.fromCodePoint(0x1F4CD) + ` *Endereço:* ${address}\n`;
        }
        
        if (notes) {
            message += `\n` + String.fromCodePoint(0x1F4DD) + ` *Observações:*\n${notes}`;
        }
        
        // Número do WhatsApp (com código do país)
        const whatsappNumber = '5594984305772';
        
        // Codificar mensagem para URL
        const encodedMessage = encodeURIComponent(message);
        
        // Montar URL do WhatsApp
        const whatsappURL = `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${encodedMessage}`;
        
        // Abrir WhatsApp em nova aba
        window.open(whatsappURL, '_blank');
        
        // Limpar formulário
        schedulingForm.reset();
        
        // Mostrar mensagem de sucesso
        alert('Você será redirecionado para o WhatsApp para confirmar seu agendamento!');
        });
    }

    // Formulário de contato
    const contactForm = document.getElementById('contact-form');

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Coletar dados do formulário
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                message: document.getElementById('message').value
            };

            // Aqui você pode adicionar a lógica para enviar os dados para um servidor
            // Por enquanto, vamos apenas mostrar uma mensagem de sucesso
            alert('Mensagem enviada com sucesso! Em breve entraremos em contato.');
            contactForm.reset();
        });
    }

    // Máscara para o campo de telefone
    const phoneInput = document.getElementById('phone');

    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 11) value = value.slice(0, 11);
            
            if (value.length > 2) {
                value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
            }
            if (value.length > 9) {
                value = `${value.slice(0, 9)}-${value.slice(9)}`;
            }
            
            e.target.value = value;
        });
    }

    // Animação suave ao rolar
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const target = document.querySelector(targetId);
            
            if (target) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Animação de fade-in para elementos quando entram na viewport
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    document.querySelectorAll('.service-card, .about-content, .contact-form').forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
        observer.observe(element);
    });

    // Sistema de seleção de serviços
    const serviceCheckboxes = document.querySelectorAll('.service-checkbox');
    const servicesSummary = document.getElementById('servicesSummary');
    const summaryCount = document.querySelector('.summary-count');
    const summaryTotal = document.querySelector('.summary-total');
    let selectedServices = [];

    // Carregar dados do admin (se existirem)
    function loadAdminData() {
        const saved = localStorage.getItem('pcformatech_services');
        if (saved) {
            return JSON.parse(saved);
        }
        return null;
    }

    // Garantir que a barra comece oculta
    if (servicesSummary) {
        servicesSummary.classList.remove('active');
    }

    // Prevenir que o clique no botão "Ver Detalhes" selecione o checkbox
    document.querySelectorAll('.service-details-btn').forEach(btn => {
        // Verificar se é o botão do formulário (dentro de um link)
        const parentLink = btn.closest('a.service-card-link');
        if (parentLink) {
            // Este é o botão do formulário - não interceptar o clique
            return;
        }
        
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const modal = btn.closest('.service-card').getAttribute('data-modal');
            openServiceModal(modal);
        });
    });

    function updateServicesSummary() {
        const adminData = loadAdminData();
        
        selectedServices = Array.from(serviceCheckboxes)
            .filter(checkbox => checkbox.checked)
            .map(checkbox => {
                const serviceName = checkbox.getAttribute('data-service');
                let price = parseFloat(checkbox.getAttribute('data-price'));
                
                // Usar preço do admin se disponível
                if (adminData && adminData[serviceName]) {
                    price = adminData[serviceName].price;
                }
                
                return {
                    name: serviceName,
                    price: price
                };
            });

        // Contar apenas serviços com preço (excluir remoto que tem preço 0)
        const servicesWithPrice = selectedServices.filter(s => s.price > 0);
        const count = servicesWithPrice.length;
        let total = selectedServices.reduce((sum, service) => sum + service.price, 0);
        
        // Verificar se o atendimento remoto está selecionado
        const remoteSelected = Array.from(serviceCheckboxes).some(
            checkbox => checkbox.checked && checkbox.getAttribute('data-service') === 'remoto'
        );
        
        // Aplicar desconto (usar valor do admin se disponível)
        let discount = 0;
        let discountPercent = 20;
        if (adminData && adminData.remoto && adminData.remoto.discount) {
            discountPercent = adminData.remoto.discount;
        }
        const originalTotal = total;
        if (remoteSelected && total > 0) {
            discount = total * (discountPercent / 100);
            total = total - discount;
        }

        // Atualizar contador sempre
        summaryCount.textContent = `${count} serviço${count !== 1 ? 's' : ''} selecionado${count !== 1 ? 's' : ''}`;
        
        // Elemento de desconto
        const summaryDiscount = document.querySelector('.summary-discount');
        
        // Mostrar/ocultar botão X
        const clearBtn = document.querySelector('.clear-selection-btn');
        if (clearBtn) {
            if (count > 0) {
                clearBtn.style.display = 'flex';
            } else {
                clearBtn.style.display = 'none';
            }
        }

        if (count > 0) {
            if (remoteSelected && discount > 0) {
                // Mostrar desconto
                if (summaryDiscount) {
                    summaryDiscount.style.display = 'inline-flex';
                    summaryDiscount.innerHTML = `<i class="fas fa-tag" style="margin-right: 0.3rem;"></i>Atendimento Remoto: <strong style="color: #ffeb3b; margin-left: 0.3rem;">-${discountPercent}% OFF</strong>`;
                }
                // Mostrar preço original riscado e novo preço
                summaryTotal.innerHTML = `<span style="text-decoration: line-through; opacity: 0.7; font-size: 0.9em; margin-right: 0.5rem;">R$ ${originalTotal.toFixed(2).replace('.', ',')}</span><strong style="color: #90E0D8; font-size: 1.3em;">R$ ${total.toFixed(2).replace('.', ',')}</strong>`;
            } else {
                // Ocultar desconto
                if (summaryDiscount) {
                    summaryDiscount.style.display = 'none';
                }
                summaryTotal.innerHTML = `Total: <strong style="color: #90E0D8;">R$ ${total.toFixed(2).replace('.', ',')}</strong>`;
            }
            
            servicesSummary.classList.add('active');
            // Esconder widget do WhatsApp quando a barra aparecer
            const whatsappWidget = document.querySelector('.whatsapp-widget');
            if (whatsappWidget) {
                whatsappWidget.style.display = 'none';
            }
            // Esconder botão de voltar ao topo
            const scrollToTopBtn = document.getElementById('scrollToTop');
            if (scrollToTopBtn) {
                scrollToTopBtn.style.display = 'none';
            }
        } else {
            if (summaryDiscount) {
                summaryDiscount.style.display = 'none';
            }
            servicesSummary.classList.remove('active');
            // Mostrar widget do WhatsApp quando a barra desaparecer
            const whatsappWidget = document.querySelector('.whatsapp-widget');
            if (whatsappWidget) {
                whatsappWidget.style.display = 'block';
            }
            // Mostrar botão de voltar ao topo novamente
            const scrollToTopBtn = document.getElementById('scrollToTop');
            if (scrollToTopBtn) {
                scrollToTopBtn.style.display = 'flex';
            }
        }
    }

    serviceCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateServicesSummary);
    });

    // Função para solicitar orçamento
    window.requestQuote = function() {
        if (selectedServices.length === 0) {
            alert('Por favor, selecione pelo menos um serviço.');
            return;
        }

        const emojiMap = {
            'formatacao': '💻',
            'programas': '📥',
            'seguranca': '🛡️',
            'manutencao': '🔧',
            'drivers': '💿',
            'backup': '💾',
            'remoto': '🌐'
        };
        
        const serviceMap = {
            'formatacao': 'Formatação de Computadores - R$ 80,00',
            'programas': 'Instalação de Programas - R$ 50,00',
            'seguranca': 'Proteção e Segurança - R$ 60,00',
            'manutencao': 'Manutenção Preventiva - R$ 70,00',
            'drivers': 'Instalação de Drivers - R$ 40,00',
            'backup': 'Backup de Dados - R$ 45,00',
            'remoto': 'Atendimento Remoto (20% OFF)'
        };
        
        // Verificar se atendimento remoto está selecionado
        const remoteSelected = selectedServices.some(s => s.name === 'remoto');
        
        let message = '📋 *SOLICITAÇÃO DE ORÇAMENTO*\n\n';
        message += '💼 *Serviços Solicitados:*\n';
        
        selectedServices.forEach((s, index) => {
            const emoji = emojiMap[s.name] || '•';
            const serviceName = serviceMap[s.name] || s.name;
            message += `   ${index + 1}. ${emoji} ${serviceName}\n`;
        });
        
        const subtotal = selectedServices.reduce((sum, service) => sum + service.price, 0);
        
        if (remoteSelected && subtotal > 0) {
            const discount = subtotal * 0.20;
            const total = subtotal - discount;
            message += `\n💰 *Subtotal:* R$ ${subtotal.toFixed(2).replace('.', ',')}\n`;
            message += `🎉 *Desconto (20% Remoto):* -R$ ${discount.toFixed(2).replace('.', ',')}\n`;
            message += `💵 *VALOR TOTAL:* R$ ${total.toFixed(2).replace('.', ',')}*\n\n`;
        } else {
            message += `\n💵 *VALOR TOTAL:* R$ ${subtotal.toFixed(2).replace('.', ',')}*\n\n`;
        }
        
        message += `Poderia me passar mais informações?`;
        
        const whatsappNumber = '5594984305772';
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
        
        window.open(whatsappUrl, '_blank');
    };
    
    // Função para limpar todas as seleções de serviços
    window.clearAllServices = function() {
        serviceCheckboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        updateServicesSummary();
    };

    // Função para abrir modal de serviço
    function openServiceModal(modalId) {
        const modal = document.querySelector(`[data-modal-id="${modalId}"]`);
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    }

    // Atualizar datas dos depoimentos dinamicamente
    function updateTestimonialDates() {
        const testimonialTimes = document.querySelectorAll('.testimonial-time[data-days-ago]');
        const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 
                       'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
        
        testimonialTimes.forEach(timeElement => {
            const daysAgo = parseInt(timeElement.getAttribute('data-days-ago'));
            const time = timeElement.getAttribute('data-time');
            
            const date = new Date();
            date.setDate(date.getDate() - daysAgo);
            
            const day = date.getDate();
            const month = months[date.getMonth()];
            const year = date.getFullYear();
            
            timeElement.textContent = `${day} de ${month} de ${year} às ${time}`;
        });
    }
    
    // Executar ao carregar a página
    updateTestimonialDates();
    
    // Atualizar diariamente à meia-noite
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    const timeUntilMidnight = tomorrow - now;
    
    setTimeout(() => {
        updateTestimonialDates();
        // Depois da primeira atualização à meia-noite, atualizar a cada 24 horas
        setInterval(updateTestimonialDates, 24 * 60 * 60 * 1000);
    }, timeUntilMidnight);

// Galeria de Estatísticas
    const statSlides = document.querySelectorAll('.stat-slide');
    const statIndicators = document.querySelectorAll('.stat-indicator');
    const statPrev = document.querySelector('.stats-prev');
    const statNext = document.querySelector('.stats-next');
    let currentStat = 0;
    let statInterval;

    function showStat(index) {
        statSlides.forEach((slide, i) => {
            slide.classList.remove('active', 'prev');
            if (i === index) {
                slide.classList.add('active');
            } else if (i < index) {
                slide.classList.add('prev');
            }
        });

        statIndicators.forEach((indicator, i) => {
            indicator.classList.toggle('active', i === index);
        });
    }

    function nextStat() {
        currentStat = (currentStat + 1) % statSlides.length;
        showStat(currentStat);
    }

    function prevStat() {
        currentStat = (currentStat - 1 + statSlides.length) % statSlides.length;
        showStat(currentStat);
    }

    function startStatSlideshow() {
        statInterval = setInterval(nextStat, 3000);
    }

    function resetStatSlideshow() {
        clearInterval(statInterval);
        startStatSlideshow();
    }

    if (statNext && statPrev) {
        statNext.addEventListener('click', () => {
            nextStat();
            resetStatSlideshow();
        });

        statPrev.addEventListener('click', () => {
            prevStat();
            resetStatSlideshow();
        });

        statIndicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                currentStat = index;
                showStat(currentStat);
                resetStatSlideshow();
            });
        });

        startStatSlideshow();
    }
});