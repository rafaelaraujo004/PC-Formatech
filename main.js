document.addEventListener('DOMContentLoaded', () => {}
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

// Controle do anúncio Alelo e navegação responsiva
document.addEventListener('DOMContentLoaded', () => {
    // Anúncio Alelo
    const announcement = document.querySelector('.alelo-announcement');
    
    // Remover o anúncio após a animação de saída
    setTimeout(() => {
        announcement.addEventListener('animationend', (e) => {
            if (e.animationName === 'slideOut') {
                announcement.remove();
            }
        });
    }, 3000);
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });

    // Fechar menu ao clicar em um link
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
        });
    });
});

// Funcionalidade dos modais de serviço
const serviceCards = document.querySelectorAll('.service-card');
const modals = document.querySelectorAll('.modal');
const closeButtons = document.querySelectorAll('.close-modal');
const whatsappButtons = document.querySelectorAll('.whatsapp-btn');

serviceCards.forEach(card => {
    const detailsBtn = card.querySelector('.service-details-btn');
    const modalId = card.getAttribute('data-modal');
    
    detailsBtn.addEventListener('click', () => {
        const modal = document.getElementById(`modal-${modalId}`);
        modal.style.display = 'block';
    });
});

closeButtons.forEach(button => {
    button.addEventListener('click', () => {
        const modal = button.closest('.modal');
        modal.style.display = 'none';
    });
});

window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});

// WhatsApp Integration
whatsappButtons.forEach(button => {
    button.addEventListener('click', () => {
        const service = button.getAttribute('data-service');
        const message = `Olá! Gostaria de mais informações sobre o serviço de ${service}.`;
        const whatsappNumber = '5511999999999'; // Substitua pelo número correto
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    });
});

// Sistema de Agendamento
const scheduleForm = document.getElementById('schedule-form');

scheduleForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const formData = {
        service: document.getElementById('service-type').value,
        date: document.getElementById('schedule-date').value,
        time: document.getElementById('schedule-time').value,
        computerType: document.getElementById('computer-type').value
    };
    
    // Validação de data (não permitir datas passadas)
    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
        alert('Por favor, selecione uma data futura para o agendamento.');
        return;
    }
    
    // Aqui você pode adicionar a lógica para enviar os dados para um servidor
    // Por enquanto, vamos apenas mostrar uma confirmação
    const message = `Agendamento realizado com sucesso!\n\n` +
                   `Serviço: ${formData.service}\n` +
                   `Data: ${formData.date}\n` +
                   `Horário: ${formData.time}\n` +
                   `Tipo de Computador: ${formData.computerType}\n\n` +
                   `Em breve entraremos em contato para confirmar seu agendamento.`;
    
    alert(message);
    scheduleForm.reset();
});

// Limitação de datas no calendário
const dateInput = document.getElementById('schedule-date');
const today = new Date().toISOString().split('T')[0];
dateInput.min = today;

// Formulário de contato
const contactForm = document.getElementById('contact-form');

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

// Máscara para o campo de telefone
const phoneInput = document.getElementById('phone');

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