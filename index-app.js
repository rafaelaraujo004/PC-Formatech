function toggleWhatsApp() {
            const chat = document.getElementById('whatsappChat');
            chat.classList.toggle('active');
        }
        
        // Fechar ao clicar fora
        document.addEventListener('click', function(event) {
            const widget = document.querySelector('.whatsapp-widget');
            const chat = document.getElementById('whatsappChat');
            if (!widget.contains(event.target) && chat.classList.contains('active')) {
                chat.classList.remove('active');
            }
        });

function loadSlides(slides) {
            const heroSlider = document.querySelector('.hero-slider');
            const heroIndicators = document.querySelector('.hero-indicators');
            
            if (heroSlider && slides && slides.length > 0) {
                // Limpar slides existentes
                heroSlider.innerHTML = '';
                heroIndicators.innerHTML = '';
                
                // Adicionar novos slides
                slides.forEach((slide, index) => {
                    // Criar slide
                    const slideDiv = document.createElement('div');
                    slideDiv.className = 'hero-slide' + (index === 0 ? ' active' : '');
                    slideDiv.innerHTML = `<img src="${slide.url}" alt="${slide.alt}" ${index === 0 ? 'fetchpriority="high" loading="eager"' : 'loading="lazy"'} decoding="async" onerror="this.onerror=null;this.src='data:image/svg+xml,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width%3D%222400%22 height%3D%22400%22%3E%3Crect width%3D%22100%25%22 height%3D%22100%25%22 fill%3D%22%23222%22%2F%3E%3Ctext x%3D%2250%25%22 y%3D%2250%25%22 dominant-baseline%3D%22middle%22 text-anchor%3D%22middle%22 fill%3D%22%23aaa%22 font-size%3D%2224%22 font-family%3D%22sans-serif%22%3EImagem+Indispon%C3%ADvel%3C%2Ftext%3E%3C%2Fsvg%3E'">`;
                    heroSlider.appendChild(slideDiv);
                    
                    // Criar indicador
                    const indicator = document.createElement('span');
                    indicator.className = 'indicator' + (index === 0 ? ' active' : '');
                    indicator.setAttribute('data-slide', index);
                    heroIndicators.appendChild(indicator);
                });

                if (typeof window.refreshHeroSlider === 'function') {
                    window.refreshHeroSlider({ resetIndex: true });
                }
                
                console.log('✅ Slides carregados!');
            }
        }

        // Presenca centralizada em theme-system.js
        (function() {
            if (window.PCFTPresenceTracker && typeof window.PCFTPresenceTracker.start === 'function') {
                window.PCFTPresenceTracker.start();
            }
        })();

        document.addEventListener('DOMContentLoaded', () => {
            // Tentar carregar do Firebase primeiro
            if (typeof db !== 'undefined' && db) {
                try {
                    db.collection('slider')
                        .doc('images')
                        .onSnapshot((doc) => {
                            if (doc.exists && doc.data().slides) {
                                const firebaseSlides = doc.data().slides;
                                const htmlSlides = document.querySelectorAll('.hero-slide');
                                // Só usa Firebase se tiver pelo menos tantos slides quanto o HTML
                                if (firebaseSlides.length >= htmlSlides.length) {
                                    loadSlides(firebaseSlides);
                                    console.log('✅ Slides carregados do Firebase (sincronizados)!');
                                } else {
                                    console.log('ℹ️ Firebase tem menos slides que o HTML, mantendo slides do HTML.');
                                }
                            } else {
                                // Se não houver dados no Firebase, carregar do localStorage
                                const savedSlides = localStorage.getItem('pcformatech_hero_slides');
                                if (savedSlides) {
                                    loadSlides(JSON.parse(savedSlides));
                                    console.log('✅ Slides carregados do localStorage');
                                }
                            }
                        });
                } catch (error) {
                    console.warn('Firebase não disponível, usando localStorage:', error);
                    const savedSlides = localStorage.getItem('pcformatech_hero_slides');
                    if (savedSlides) {
                        loadSlides(JSON.parse(savedSlides));
                    }
                }
            } else {
                // Fallback para localStorage
                const savedSlides = localStorage.getItem('pcformatech_hero_slides');
                if (savedSlides) {
                    loadSlides(JSON.parse(savedSlides));
                }
            }
        });
