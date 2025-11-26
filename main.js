document.addEventListener('DOMContentLoaded', () => {
    // Carrossel Hero
    const slides = document.querySelectorAll('.hero-slide');
    const indicators = document.querySelectorAll('.indicator');
    let currentSlide = 0;
    let slideInterval;

    function showSlide(index) {
        // Remove active de todos
        slides.forEach(slide => slide.classList.remove('active'));
        indicators.forEach(indicator => indicator.classList.remove('active'));
        
        // Adiciona active ao slide atual
        slides[index].classList.add('active');
        indicators[index].classList.add('active');
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    }

    function startSlideshow() {
        slideInterval = setInterval(nextSlide, 10000); // 10 segundos
    }

    function resetSlideshow() {
        clearInterval(slideInterval);
        startSlideshow();
    }

    // Clique nos indicadores
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            currentSlide = index;
            showSlide(currentSlide);
            resetSlideshow();
        });
    });

    // Iniciar slideshow
    startSlideshow();

    // Ocultar header ao rolar para baixo
    let lastScrollTop = 0;
    const header = document.querySelector('.header');
    
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            // Rolando para baixo
            header.classList.add('hidden');
        } else {
            // Rolando para cima
            header.classList.remove('hidden');
        }
        
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    });

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
        
        if (detailsBtn && modalId) {
            detailsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const modal = document.getElementById(`modal-${modalId}`);
                if (modal) {
                    modal.style.display = 'block';
                    document.body.style.overflow = 'hidden';
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
            }
        });
    });

    // Fechar modal ao clicar fora
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
            document.body.style.overflow = '';
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
        if (dateInput) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.min = today;
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
        const service = document.getElementById('service-type').value;
        const date = document.getElementById('schedule-date').value;
        const time = document.getElementById('schedule-time').value;
        const address = document.getElementById('client-address').value;
        const notes = document.getElementById('additional-info').value;
        
        // Validação
        if (!name || !phone || !service || !date || !time) {
            alert('Por favor, preencha todos os campos obrigatórios (*)');
            return;
        }
        
        // Validar data (não pode ser no passado)
        const selectedDate = new Date(date);
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        
        if (selectedDate < todayDate) {
            alert('Por favor, selecione uma data futura para o agendamento.');
            return;
        }
        
        // Formatar data para português
        const dateFormatted = new Date(date + 'T00:00:00').toLocaleDateString('pt-BR');
        
        // Montar mensagem para WhatsApp
        let message = `🗓️ *NOVO AGENDAMENTO*\n\n`;
        message += `👤 *Nome:* ${name}\n`;
        message += `📱 *Telefone:* ${phone}\n`;
        message += `💻 *Serviço:* ${service}\n`;
        message += `📅 *Data:* ${dateFormatted}\n`;
        message += `🕐 *Horário:* ${time}\n`;
        
        if (address) {
            message += `📍 *Endereço:* ${address}\n`;
        }
        
        if (notes) {
            message += `\n📝 *Observações:*\n${notes}`;
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
});