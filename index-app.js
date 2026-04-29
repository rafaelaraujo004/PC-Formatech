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
                    slideDiv.innerHTML = `<img src="${slide.url}" alt="${slide.alt}" ${index === 0 ? 'fetchpriority="high" loading="eager"' : 'loading="lazy"'} decoding="async" onerror="this.src='https://via.placeholder.com/2400x400?text=Imagem+Indispon%C3%ADvel'">`;
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
                                loadSlides(doc.data().slides);
                                console.log('✅ Slides carregados do Firebase (sincronizados)!');
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
