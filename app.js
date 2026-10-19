// Chặn click chuột phải trên toàn trang
document.addEventListener('contextmenu', event => event.preventDefault());

// Chặn hành động kéo thả hình ảnh
document.addEventListener('dragstart', event => {
    if (event.target.tagName.toLowerCase() === 'img') {
        event.preventDefault();
    }
});

// Chặn phím tắt mở DevTools (F12, Ctrl+Shift+I, Ctrl+Shift+C)
document.addEventListener('keydown', event => {
    if (event.key === 'F12' || 
       (event.ctrlKey && event.shiftKey && (event.key === 'I' || event.key === 'C' || event.key === 'J'))) {
        event.preventDefault();
    }
});
document.addEventListener('DOMContentLoaded', () => {
    // === 1. AMBIENT FIREFLIES PARTICLES BACKGROUND ===
    const canvas = document.getElementById('fireflies-canvas');
    const ctx = canvas.getContext('2d');
    
    let particles = [];
    const particleCount = 55;
    
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    class Firefly {
        constructor() {
            this.reset();
            this.y = Math.random() * canvas.height; // Initially distribute vertically
        }
        
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = canvas.height + Math.random() * 50; // Spawn just below bottom
            this.radius = Math.random() * 1.8 + 0.6;
            this.speedY = -(Math.random() * 0.4 + 0.15); // Lift upwards
            this.speedX = Math.random() * 0.3 - 0.15; // Gentle sway
            this.baseOpacity = Math.random() * 0.45 + 0.25;
            this.opacity = 0;
            this.fadeSpeed = Math.random() * 0.01 + 0.005;
            this.angle = Math.random() * Math.PI * 2;
            this.angleSpeed = Math.random() * 0.02 - 0.01;
            this.sinAmplitude = Math.random() * 12 + 4; // Horizontal wave size
        }
        
        update() {
            // Float upwards and sway with sine wave
            this.y += this.speedY;
            this.angle += this.angleSpeed;
            
            const currentSway = Math.sin(this.angle) * (this.sinAmplitude / 45);
            this.x += this.speedX + currentSway;
            
            // Fade in/out gently
            if (this.opacity < this.baseOpacity) {
                this.opacity += this.fadeSpeed;
            }
            
            // Check boundaries
            if (this.y < -10 || this.x < -20 || this.x > canvas.width + 20) {
                this.reset();
            }
        }
        
        draw() {
            ctx.save();
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            
            // Radial gradient glow for each firefly
            const gradient = ctx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, this.radius * 3.5
            );
            gradient.addColorStop(0, `rgba(229, 193, 88, ${this.opacity})`);
            gradient.addColorStop(0.4, `rgba(229, 193, 88, ${this.opacity * 0.4})`);
            gradient.addColorStop(1, 'rgba(229, 193, 88, 0)');
            
            ctx.fillStyle = gradient;
            ctx.fill();
            ctx.restore();
        }
    }
    
    // Initialize fireflies
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Firefly());
    }
    
    function animateFireflies() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        
        requestAnimationFrame(animateFireflies);
    }
    animateFireflies();
    
    
    // === 2. 3D PHOTO CAROUSEL LOGIC ===
    const carousel = document.getElementById('carousel');
    const viewport = document.querySelector('.carousel-viewport');
    const cards = Array.from(document.querySelectorAll('.carousel-card'));
    const totalCards = cards.length;
    
    let cardWidth = cards[0].offsetWidth;
    let radius = 0;
    
    // Position cards in a circle facing outwards
    function positionCards() {
        cardWidth = cards[0].offsetWidth;
        // Trigonometry: Radius = CardWidth / (2 * tan(PI / N))
        // We add an extra gap spacer of +35px to make the arrangement feel open and majestic
        const angleStep = 360 / totalCards;
        const radStep = Math.PI / totalCards;
        radius = (cardWidth / (2 * Math.tan(radStep))) + 35;
        
        cards.forEach((card, i) => {
            const cardAngle = i * angleStep;
            card.style.transform = `rotateY(${cardAngle}deg) translateZ(${radius}px)`;
        });
    }
    
    // Run initially and on resize
    positionCards();
    window.addEventListener('resize', positionCards);
    
    // Animation/Rotation states
    let currentRotation = 0;
    let targetRotation = 0;
    let autoRotateSpeed = 0.12; // Nice and slow degrees per frame
    let isDragging = false;
    let startX = 0;
    let dragRotationStart = 0;
    let velocity = 0;
    let lastTime = 0;
    let lastX = 0;
    let isHovered = false;
    
    // Keep targetRotation continuously ticking for autoplay when not dragging/hovered
    function updateRotation() {
        if (!isDragging) {
            if (!isHovered) {
                // Apply inert decay to manual swipe velocity
                if (Math.abs(velocity) > 0.02) {
                    targetRotation += velocity;
                    velocity *= 0.95; // Frictional damping
                } else {
                    velocity = 0;
                    targetRotation += autoRotateSpeed; // Normal autoplay rotation
                }
            } else {
                // Decay manual velocity if hovered (slow deceleration)
                velocity *= 0.9;
                targetRotation += velocity;
            }
        }
        
        // Linear Interpolation (LERP) for buttery-smooth ease transition
        currentRotation += (targetRotation - currentRotation) * 0.08;
        
        // Apply rotation around Y-axis to the whole carousel container
        carousel.style.transform = `translateY(var(--carousel-y-offset)) rotateX(-6deg) rotateY(${-currentRotation}deg)`;
        
        requestAnimationFrame(updateRotation);
    }
    requestAnimationFrame(updateRotation);
    
    // Hover pause behavior & active state dim effects
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            isHovered = true;
            viewport.classList.add('any-hovered');
        });
        
        card.addEventListener('mouseleave', () => {
            isHovered = false;
            viewport.classList.remove('any-hovered');
        });
    });
    
    // === 3. DRAG / SWIPE INTERACTIVE CONTROLS ===
    
    function dragStart(clientX) {
        isDragging = true;
        startX = clientX;
        lastX = clientX;
        dragRotationStart = targetRotation;
        velocity = 0;
        lastTime = performance.now();
        carousel.style.transition = 'none'; // Instant response
    }
    
    function dragMove(clientX) {
        if (!isDragging) return;
        
        const dx = clientX - startX;
        // Map drag pixel delta to rotation angle
        // Scaled to match device physical width for highly natural response
        const dragScale = 160 / window.innerWidth;
        const angleDelta = dx * dragScale;
        
        targetRotation = dragRotationStart - angleDelta;
        
        // Calculate instantaneous velocity for inertia flick
        const now = performance.now();
        const dt = now - lastTime;
        if (dt > 10) {
            const currentDx = clientX - lastX;
            velocity = -(currentDx * dragScale);
            lastTime = now;
            lastX = clientX;
        }
    }
    
    function dragEnd() {
        if (!isDragging) return;
        isDragging = false;
    }
    
    // Mouse Event Listeners
    carousel.addEventListener('mousedown', (e) => {
        // Only trigger on primary left click
        if (e.button !== 0) return;
        dragStart(e.clientX);
        e.preventDefault();
    });
    
    window.addEventListener('mousemove', (e) => {
        dragMove(e.clientX);
    });
    
    window.addEventListener('mouseup', () => {
        dragEnd();
    });
    
    // Touch Event Listeners (Mobile & Tablet)
    carousel.addEventListener('touchstart', (e) => {
        if (e.touches.length > 0) {
            dragStart(e.touches[0].clientX);
        }
    }, { passive: true });
    
    window.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            dragMove(e.touches[0].clientX);
        }
    }, { passive: true });
    
    window.addEventListener('touchend', () => {
        dragEnd();
    }, { passive: true });
    
    
    // === 4. EXPANDED PHOTO LIGHTBOX MODAL ===
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const lightboxIndex = document.getElementById('lightbox-index');
    const lightboxClose = document.getElementById('lightbox-close');
    
    cards.forEach((card, idx) => {
        card.addEventListener('click', (e) => {
            // Prevent opening lightbox if user was dragging or flicking the carousel
            if (Math.abs(velocity) > 0.8) return;
            
            const img = card.querySelector('img');
            const caption = card.getAttribute('data-caption');
            
            lightboxImg.src = img.src;
            lightboxCaption.textContent = caption;
            lightboxIndex.textContent = `0${idx + 1}/0${totalCards}`;
            
            // Open modal
            lightbox.classList.add('open');
            lightbox.setAttribute('aria-hidden', 'false');
        });
    });
    
    function closeLightbox() {
        lightbox.classList.remove('open');
        lightbox.setAttribute('aria-hidden', 'true');
    }
    
    lightboxClose.addEventListener('click', closeLightbox);
    
    // Close on background click
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });
    
    // Close on Escape key press
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.classList.contains('open')) {
            closeLightbox();
        }
    });
    
    
    // === 5. GLASSMORPHIC MUSIC PLAYER SYSTEM ===
    const bgMusic = document.getElementById('bg-music');
    const musicToggle = document.getElementById('music-toggle');
    const visualizer = document.getElementById('visualizer');
    const muteIcon = document.getElementById('mute-icon');
    const musicText = document.getElementById('music-text');
    
    let isMusicPlaying = false;
    
    // Adjust volume to be pleasant and non-intrusive
    bgMusic.volume = 0.35;
    
    function toggleMusic() {
        if (isMusicPlaying) {
            bgMusic.pause();
            isMusicPlaying = false;
            
            // Update UI State
            visualizer.classList.remove('active');
            muteIcon.classList.remove('hidden');
            musicText.textContent = "Bật Nhạc";
        } else {
            bgMusic.play().then(() => {
                isMusicPlaying = true;
                
                // Update UI State
                visualizer.classList.add('active');
                muteIcon.classList.add('hidden');
                musicText.textContent = "Tắt Nhạc";
            }).catch(err => {
                console.warn("Autoplay block detected or stream load delayed. User interaction registered.", err);
            });
        }
    }
    
    musicToggle.addEventListener('click', toggleMusic);
    
    
    // === 6. INTERACTIVE 'EM CÓ YÊU ANH KHÔNG?' GAME & LETTER FORM ===
    const btnYes = document.getElementById('btn-yes');
    const btnNo = document.getElementById('btn-no');
    const gameContainer = document.querySelector('.game-container');
    const letterBox = document.getElementById('letter-box');
    const replyForm = document.getElementById('reply-form');
    const formSuccess = document.getElementById('form-success');
    
    let noScale = 1.0;
    
    // Evasion logic for 'No' button
    function moveNoButton() {
        // Decrease button scale by 10% each evasion to make it progressively smaller
        noScale *= 0.9;
        if (noScale < 0.3) noScale = 0.3; // Cap minimum scale so it doesn't disappear completely
        
        // Define viewport margin padding to prevent button flying off-screen or hiding behind other UI
        const padding = 70;
        const maxX = window.innerWidth - btnNo.offsetWidth - padding;
        const maxY = window.innerHeight - btnNo.offsetHeight - padding;
        
        // Compute randomized screen coordinate positions
        const randomX = Math.max(padding, Math.floor(Math.random() * maxX));
        const randomY = Math.max(padding, Math.floor(Math.random() * maxY));
        
        // Set fixed position and absolute coordinates on first action
        btnNo.style.position = 'fixed';
        btnNo.style.zIndex = '9999';
        btnNo.style.left = `${randomX}px`;
        btnNo.style.top = `${randomY}px`;
        btnNo.style.transform = `scale(${noScale})`;
        btnNo.style.transition = 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)';
    }
    
    // Attach to mouseover (PC hover) and touchstart (Mobile swipe/taps)
    btnNo.addEventListener('mouseover', moveNoButton);
    btnNo.addEventListener('touchstart', (e) => {
        e.preventDefault(); // Prevents touch-click delays and handles instantly
        moveNoButton();
    });
    
    // Action trigger when 'Yes' button is clicked
    btnYes.addEventListener('click', () => {
        // 1. Fade out the game container question box
        gameContainer.style.opacity = '0';
        gameContainer.style.transform = 'scale(0.92)';
        gameContainer.style.transition = 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
        
        // Bring 'No' button back to natural flow just in case it's floating somewhere
        btnNo.style.display = 'none';
        
        setTimeout(() => {
            gameContainer.style.display = 'none';
            
            // 2. Open and fade in the romantic letter box
            letterBox.style.style = 'block';
            letterBox.style.display = 'block';
            // Trigger browser reflow to correctly initialize opacity transition
            void letterBox.offsetWidth;
            
            letterBox.classList.remove('hidden');
            letterBox.style.opacity = '1';
            letterBox.style.transform = 'scale(1) translateY(0)';
            
            // Auto scroll slightly down to make the letter card perfectly centered on mobile
            letterBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 600);
    });
    
    // AJAX Submission handler for Formspree
    replyForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const actionUrl = replyForm.getAttribute('action');
        
        // Guard check to notify Khoa if action remains default placeholder
        if (actionUrl.includes('YOUR_FORM_ID_HERE')) {
            alert('Khoa ơi! Bạn cần lấy mã Form ID trên trang Formspree.io rồi dán vào thuộc tính action="..." của thẻ <form> trong file index.html thì thư phản hồi của bạn gái mới gửi về Gmail được nhé!');
            return;
        }
        
        const submitBtn = replyForm.querySelector('.btn-submit');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Đang gửi thư... ✉</span>';
        
        const formData = new FormData(replyForm);
        
        fetch(actionUrl, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        })
        .then(response => {
            if (response.ok) {
                // Smoothly fade out the input form
                replyForm.style.opacity = '0';
                
                setTimeout(() => {
                    replyForm.style.display = 'none';
                    
                    // Smoothly fade in the success toast card
                    formSuccess.style.display = 'block';
                    void formSuccess.offsetWidth;
                    formSuccess.classList.remove('hidden');
                    formSuccess.style.opacity = '1';
                }, 400);
            } else {
                alert('Có lỗi xảy ra khi gửi thư phản hồi. Em vui lòng thử lại nhé!');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<span>Gửi cho Khoa 🌹</span>';
            }
        })
        .catch(error => {
            console.error('AJAX Submit Error:', error);
            alert('Không thể kết nối mạng. Em vui lòng thử lại nhé!');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>Gửi cho Khoa 🌹</span>';
        });
    });


    // === 7. MOBILE DRAWER: MOVE SIDE WIDGETS IN/OUT OF THE GAMES OVERLAY ===
    // On wide screens the gift box / bubbles / puzzle sit fixed beside the carousel.
    // Below 980px there's no safe gap left, so we physically re-parent the same
    // DOM nodes into a bottom-sheet drawer opened from a floating button —
    // this keeps all game logic working untouched, only the layout changes.
    const sideStackLeft = document.getElementById('side-stack-left');
    const sideStackRight = document.getElementById('side-stack-right');
    const mobileSlot = document.getElementById('mobile-games-slot');
    const mobileFab = document.getElementById('mobile-games-fab');
    const mobileOverlay = document.getElementById('mobile-games-overlay');
    const mobileClose = document.getElementById('mobile-games-close');
    const appContainerEl = document.querySelector('.app-container');
    const mobileQuery = window.matchMedia('(max-width: 980px)');

    function placeSideWidgets(isMobile) {
        if (isMobile) {
            mobileSlot.appendChild(sideStackLeft);
            mobileSlot.appendChild(sideStackRight);
            sideStackLeft.classList.add('mobile-mode');
            sideStackRight.classList.add('mobile-mode');
        } else {
            document.body.insertBefore(sideStackLeft, appContainerEl);
            document.body.insertBefore(sideStackRight, appContainerEl);
            sideStackLeft.classList.remove('mobile-mode');
            sideStackRight.classList.remove('mobile-mode');
        }
    }

    placeSideWidgets(mobileQuery.matches);
    mobileQuery.addEventListener('change', (e) => placeSideWidgets(e.matches));

    function openMobileGames() {
        mobileOverlay.classList.add('open');
        mobileOverlay.setAttribute('aria-hidden', 'false');
    }

    function closeMobileGames() {
        mobileOverlay.classList.remove('open');
        mobileOverlay.setAttribute('aria-hidden', 'true');
    }

    mobileFab.addEventListener('click', openMobileGames);
    mobileClose.addEventListener('click', closeMobileGames);
    mobileOverlay.addEventListener('click', (e) => {
        if (e.target === mobileOverlay) closeMobileGames();
    });


    // === 8. LEFT SIDE: LUCKY GIFT BOX DRAW ===
    const giftBox = document.getElementById('gift-box');
    const giftStage = document.getElementById('gift-box-stage');
    const giftReveal = document.getElementById('gift-reveal');
    const giftRevealText = document.getElementById('gift-reveal-text');
    const giftRemainingLabel = document.getElementById('gift-remaining-label');
    const giftHint = document.getElementById('gift-hint');

    const GIFT_MAX_DRAWS = 3;
    const GIFT_COOLDOWN_MS = 30 * 1000; // 1 phút chờ giữa các lượt bốc
    const giftPrizes = [
        'Ting ting 100k 💸 (ngay lập tức)',
        'Một ly trà sữa full topping 🧋',
        '*Chăm* em bé hihi',
        'Cuối tuần i chơii',
        'Anh dắt i nhà hàng',
        'Ting ting 50k 💸 (ngay lập tức)',
    ];

    let giftDrawsRemaining = GIFT_MAX_DRAWS;
    let giftCooldownUntil = 0;
    let giftIsAnimating = false;
    let giftOpenedOrder = 0;

    function updateGiftUI() {
        const now = Date.now();

        if (giftDrawsRemaining <= 0) {
            giftBox.classList.add('disabled');
            giftHint.textContent = 'Em đã dùng hết lượt bốc thăm rùii 🥹';
            giftRemainingLabel.textContent = 'Còn 0 lượt';
            return;
        }

        if (now < giftCooldownUntil) {
            giftBox.classList.add('disabled');
            const secondsLeft = Math.ceil((giftCooldownUntil - now) / 1000);
            giftHint.textContent = `Chờ ${secondsLeft}s để bốc lượt tiếp theo nhé ⏳`;
            giftRemainingLabel.textContent = `Còn ${giftDrawsRemaining} lượt`;
            return;
        }

        giftBox.classList.remove('disabled');
        giftRemainingLabel.textContent = `Còn ${giftDrawsRemaining} lượt hôm nay`;
        giftHint.textContent = 'Chạm vào hộp quà để bốc thăm nè ✨';
    }

    // Keep the countdown text fresh while the person waits out the cooldown
    setInterval(updateGiftUI, 1000);
    updateGiftUI();

    function drawGift() {
        if (giftIsAnimating) return;
        const now = Date.now();
        if (giftDrawsRemaining <= 0 || now < giftCooldownUntil) return;

        giftIsAnimating = true;
        giftReveal.classList.remove('show');
        giftBox.classList.add('shaking');

        setTimeout(() => {
            giftBox.classList.remove('shaking');
            giftBox.classList.add('opened');

            const prize = giftPrizes[Math.floor(Math.random() * giftPrizes.length)];
            giftRevealText.textContent = prize;
            giftReveal.classList.remove('hidden');
            void giftReveal.offsetWidth; 
            giftReveal.classList.add('show');

            giftDrawsRemaining -= 1;
            giftCooldownUntil = Date.now() + GIFT_COOLDOWN_MS;
            updateGiftUI();

            giftOpenedOrder++; 
            const formUrl = "https://formspree.io/f/moeqalnd"; 
            
            const formData = new FormData();
            formData.append("Lần bốc quà thứ", giftOpenedOrder);
            formData.append("Phần thưởng trúng", prize);
            formData.append("Thời gian", new Date().toLocaleTimeString('vi-VN'));

            fetch(formUrl, {
                method: 'POST',
                body: formData,
                headers: { 'Accept': 'application/json' }
            }).catch(err => console.log("Lỗi gửi thông báo:", err));
            // ==========================================

            setTimeout(() => {
                giftBox.classList.remove('opened');
                giftIsAnimating = false;
            }, 2200);
        }, 500);
    }

    giftBox.addEventListener('click', drawGift);

    // Called by the sliding puzzle once solved: rewards one extra draw right away
    function grantBonusGiftDraw() {
        giftDrawsRemaining += 1;
        giftCooldownUntil = 0; // No need to wait for the bonus round
        updateGiftUI();
        giftStage.classList.add('gift-bonus-pulse');
        setTimeout(() => giftStage.classList.remove('gift-bonus-pulse'), 1600);
    }


    // === 9. FULL-PAGE AMBIENT HEART BUBBLES ===
    // Bubbles now float across the entire viewport (like extra glowing dots
    // alongside the fireflies) instead of being boxed into a side widget.
    const ambientBubbles = document.getElementById('ambient-bubbles');
    const bubbleBonusPopup = document.getElementById('bubble-bonus-popup');
    const BUBBLE_BONUS_CHANCE = 0.1; // ~10% cơ hội nổ trúng thưởng
    const BUBBLE_COUNT = window.innerWidth <= 640 ? 6 : window.innerWidth <= 1100 ? 9 : 13;

    let bubbleBonusTimer = null;
    let bubbleBonusCount = 0;

    function showBubbleBonusPopup() {
        clearTimeout(bubbleBonusTimer);
        bubbleBonusPopup.classList.add('show');
        bubbleBonusPopup.setAttribute('aria-hidden', 'false');
        bubbleBonusTimer = setTimeout(hideBubbleBonusPopup, 2600);
    }

    function hideBubbleBonusPopup() {
        bubbleBonusPopup.classList.remove('show');
        bubbleBonusPopup.setAttribute('aria-hidden', 'true');
    }

    bubbleBonusPopup.addEventListener('click', hideBubbleBonusPopup);

    // Small burst of sparks right where the bubble was popped
    function createBubbleBurst(x, y) {
        const burst = document.createElement('div');
        burst.className = 'bubble-burst';
        burst.style.left = `${x}px`;
        burst.style.top = `${y}px`;

        const particleCount = 6;
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('span');
            particle.className = 'bubble-burst-particle';
            const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.4;
            const distance = Math.random() * 26 + 18;
            particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`);
            particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`);
            burst.appendChild(particle);
        }

        ambientBubbles.appendChild(burst);
        setTimeout(() => burst.remove(), 700);
    }

    function popBubble(bubble) {
        if (bubble.classList.contains('popped')) return;

        const rect = bubble.getBoundingClientRect();
        createBubbleBurst(rect.left + rect.width / 2, rect.top + rect.height / 2);
        bubble.classList.add('popped');

        // ~30% may mắn: tặng thêm 1 lượt bốc thăm và hiện popup chúc mừng
        if (Math.random() < BUBBLE_BONUS_CHANCE && bubbleBonusCount < 2) {
            bubbleBonusCount++;
            grantBonusGiftDraw();
            showBubbleBonusPopup();
        }

        setTimeout(() => {
            bubble.remove();
            const respawnDelay = Math.random() * 2000 + 3000; // 3–5s trước khi bong bóng khác xuất hiện
            setTimeout(spawnBubble, respawnDelay);
        }, 350);
    }

    function spawnBubble() {
        const bubble = document.createElement('div');
        bubble.className = 'bubble';

        const size = Math.random() * 22 + 26; // 26–48px
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        bubble.style.left = `${Math.random() * 90 + 2}vw`;

        // Full page height means a longer, slower rise than the old boxed field
        const duration = Math.random() * 6 + 10; // 10–16s
        const delay = Math.random() * 3;
        bubble.style.animationDuration = `${duration}s`;
        bubble.style.animationDelay = `${delay}s`;

        function handlePop(e) {
            e.preventDefault();
            popBubble(bubble);
        }
        bubble.addEventListener('click', handlePop);
        bubble.addEventListener('touchstart', handlePop, { passive: false });

        // Give it a fresh horizontal drift each time it loops back to the bottom
        bubble.addEventListener('animationiteration', () => {
            bubble.style.left = `${Math.random() * 90 + 2}vw`;
        });

        ambientBubbles.appendChild(bubble);
    }

    for (let i = 0; i < BUBBLE_COUNT; i++) {
        setTimeout(spawnBubble, i * 400);
    }

    const PUZZLE_IMAGE_URL = 'anh10.jpg';
    const PUZZLE_SIZE = 3;
    const TOTAL_TILES = PUZZLE_SIZE * PUZZLE_SIZE;

    const puzzleBoard = document.getElementById('puzzle-board');
    const puzzleShuffleBtn = document.getElementById('puzzle-shuffle-btn');
    const puzzleMovesLabel = document.getElementById('puzzle-moves-label');
    const puzzleStatus = document.getElementById('puzzle-status');

    let puzzleState = [];
    let puzzleMoves = 0;
    let puzzleSolvedAlready = false;

    function buildSolvedState() {
        // Values 0..14 are picture tiles in reading order; the last value is the blank slot
        return Array.from({ length: TOTAL_TILES }, (_, i) => i);
    }

    function renderPuzzle() {
        puzzleBoard.innerHTML = '';
        puzzleBoard.classList.remove('solved');

        puzzleState.forEach((value, position) => {
            const tile = document.createElement('div');
            tile.className = 'puzzle-tile';

            if (value === TOTAL_TILES - 1) {
                tile.classList.add('blank');
            } else {
                const row = Math.floor(value / PUZZLE_SIZE);
                const col = value % PUZZLE_SIZE;
                tile.style.backgroundImage = `url('${PUZZLE_IMAGE_URL}')`;
                tile.style.backgroundSize = `${PUZZLE_SIZE * 100}% ${PUZZLE_SIZE * 100}%`;
                tile.style.backgroundPosition = `${(col * 100) / (PUZZLE_SIZE - 1)}% ${(row * 100) / (PUZZLE_SIZE - 1)}%`;
                tile.addEventListener('click', () => attemptMove(position));
            }

            puzzleBoard.appendChild(tile);
        });
    }

    function attemptMove(position) {
        const blankPos = puzzleState.indexOf(TOTAL_TILES - 1);
        const posRow = Math.floor(position / PUZZLE_SIZE);
        const posCol = position % PUZZLE_SIZE;
        const blankRow = Math.floor(blankPos / PUZZLE_SIZE);
        const blankCol = blankPos % PUZZLE_SIZE;

        const isAdjacent = (Math.abs(posRow - blankRow) === 1 && posCol === blankCol) ||
                            (Math.abs(posCol - blankCol) === 1 && posRow === blankRow);
        if (!isAdjacent) return;

        [puzzleState[position], puzzleState[blankPos]] = [puzzleState[blankPos], puzzleState[position]];
        puzzleMoves += 1;
        puzzleMovesLabel.textContent = `${puzzleMoves} bước`;

        renderPuzzle();
        checkPuzzleSolved();
    }

    function checkPuzzleSolved() {
        const solved = puzzleState.every((value, idx) => value === idx);
        if (solved && !puzzleSolvedAlready) {
            puzzleSolvedAlready = true;
            puzzleBoard.classList.add('solved');
            puzzleStatus.textContent = 'Hoàn thành rồi! 🎉';
            grantBonusGiftDraw();

            const blankTile = puzzleBoard.querySelector('.blank');
            if (blankTile) {

                blankTile.classList.remove('blank');
                
                const row = Math.floor((TOTAL_TILES - 1) / PUZZLE_SIZE);
                const col = (TOTAL_TILES - 1) % PUZZLE_SIZE;
                
                blankTile.style.backgroundImage = `url('${PUZZLE_IMAGE_URL}')`;
                blankTile.style.backgroundSize = `${PUZZLE_SIZE * 100}% ${PUZZLE_SIZE * 100}%`;
                blankTile.style.backgroundPosition = `${(col * 100) / (PUZZLE_SIZE - 1)}% ${(row * 100) / (PUZZLE_SIZE - 1)}%`;
                
                blankTile.style.opacity = '0';
                setTimeout(() => {
                    blankTile.style.transition = 'opacity 0.8s ease';
                    blankTile.style.opacity = '1';
                }, 50);
            }
        }
    }

    function shufflePuzzle() {
        puzzleState = buildSolvedState();
        puzzleMoves = 0;
        puzzleSolvedAlready = false;
        puzzleStatus.textContent = '';
        puzzleMovesLabel.textContent = '0 bước';

        // Shuffle by performing many random *valid* slides from the solved state —
        // this guarantees the resulting layout is always solvable.
        let blankPos = TOTAL_TILES - 1;
        let lastMove = -1;
        const shuffleSteps = 120;

        for (let i = 0; i < shuffleSteps; i++) {
            const blankRow = Math.floor(blankPos / PUZZLE_SIZE);
            const blankCol = blankPos % PUZZLE_SIZE;
            const neighbors = [];

            if (blankRow > 0) neighbors.push(blankPos - PUZZLE_SIZE);
            if (blankRow < PUZZLE_SIZE - 1) neighbors.push(blankPos + PUZZLE_SIZE);
            if (blankCol > 0) neighbors.push(blankPos - 1);
            if (blankCol < PUZZLE_SIZE - 1) neighbors.push(blankPos + 1);

            const candidates = neighbors.filter(n => n !== lastMove);
            const nextPos = candidates[Math.floor(Math.random() * candidates.length)];

            [puzzleState[nextPos], puzzleState[blankPos]] = [puzzleState[blankPos], puzzleState[nextPos]];
            lastMove = blankPos;
            blankPos = nextPos;
        }

        renderPuzzle();
    }

    // === TÍNH NĂNG GỢI Ý TỰ ĐỘNG (GREEDY SEARCH) ===
    const puzzleHintBtn = document.getElementById('puzzle-hint-btn');
    const hintPopup = document.getElementById('hint-condition-popup');
    const btnAgreeHint = document.getElementById('btn-agree-hint');
    const btnDeclineHint = document.getElementById('btn-decline-hint');
    const hintDynamicText = document.getElementById('hint-dynamic-text');

    let isAutoPlaying = false; // Chặn spam click
    let currentChallenge = "";

    const hintChallenges = [
        "hứa <strong>thơm má chồng 1 cái</strong> thật kêu",
        "hứa <strong>ôm anh từ phía sau</strong>",
        "hứa <strong>mời ck 1 ly trà sữa full topping</strong>",
        "hứa <strong>không quạo khi anh mải leo rank Liên Quân bằng Thane</strong>",
        "hứa <strong>gọi anh là 'chồng yêu' 3 lần</strong> bằng giọng nũng nịu",
        "hứa <strong>cuối tuần này đãi anh một chầu lẩu</strong>"
    ];

    if(puzzleHintBtn && hintPopup) {
        puzzleHintBtn.addEventListener('click', () => {
            if (isAutoPlaying || puzzleState.every((val, idx) => val === idx)) return;

            const randomChallenge = hintChallenges[Math.floor(Math.random() * hintChallenges.length)];
            hintDynamicText.innerHTML = `Để hệ thống tự xếp 10 bước, em phải ${randomChallenge}. Chịu không nè?`;

            hintPopup.classList.add('show');
            hintPopup.setAttribute('aria-hidden', 'false');
        });

        btnDeclineHint.addEventListener('click', () => {
            hintPopup.classList.remove('show');
            hintPopup.setAttribute('aria-hidden', 'true');
        });

        btnAgreeHint.addEventListener('click', () => {
            hintPopup.classList.remove('show');
            hintPopup.setAttribute('aria-hidden', 'true');
            const formUrl = "https://formspree.io/f/moeqalnd"; 
            const formData = new FormData();
            formData.append("Hành động", "Đã dùng gợi ý xếp hình 🧩");
            // Loại bỏ các thẻ <strong> HTML để nội dung mail gửi về dễ nhìn hơn
            const cleanChallengeText = currentChallenge.replace(/<\/?strong>/g, '');
            formData.append("Lời hứa đã chốt", cleanChallengeText);
            formData.append("Thời gian", new Date().toLocaleTimeString('vi-VN'));

            fetch(formUrl, {
                method: 'POST',
                body: formData,
                headers: { 'Accept': 'application/json' }
            }).catch(err => console.log("Lỗi gửi thông báo:", err));

            isAutoPlaying = true;
            autoPlayPuzzle(10, -1); // Bắt đầu tự chạy 10 bước
        });
    }

    // Tính khoảng cách Manhattan để đoán nước đi tốt nhất
    function getManhattanDist(state) {
        let dist = 0;
        for(let i = 0; i < TOTAL_TILES; i++) {
            if(state[i] === TOTAL_TILES - 1) continue; // Bỏ qua ô trống
            let cRow = Math.floor(i / PUZZLE_SIZE), cCol = i % PUZZLE_SIZE;
            let tRow = Math.floor(state[i] / PUZZLE_SIZE), tCol = state[i] % PUZZLE_SIZE;
            dist += Math.abs(cRow - tRow) + Math.abs(cCol - tCol);
        }
        return dist;
    }

    // Hàm đệ quy tự động xếp
    function autoPlayPuzzle(stepsLeft, lastBlankPos) {
        const solved = puzzleState.every((val, idx) => val === idx);
        if (stepsLeft <= 0 || solved) {
            isAutoPlaying = false;
            if (solved) checkPuzzleSolved();
            return;
        }

        const blankPos = puzzleState.indexOf(TOTAL_TILES - 1);
        const blankRow = Math.floor(blankPos / PUZZLE_SIZE);
        const blankCol = blankPos % PUZZLE_SIZE;
        let neighbors = [];

        if (blankRow > 0) neighbors.push(blankPos - PUZZLE_SIZE);
        if (blankRow < PUZZLE_SIZE - 1) neighbors.push(blankPos + PUZZLE_SIZE);
        if (blankCol > 0) neighbors.push(blankPos - 1);
        if (blankCol < PUZZLE_SIZE - 1) neighbors.push(blankPos + 1);
        
        let bestMove = -1;
        let minScore = Infinity;

        // Mô phỏng từng nước đi để tìm nước có điểm số tốt nhất
        neighbors.forEach(n => {
            if (n === lastBlankPos) return; // Chống lùi lại bước vừa đi
            
            // Đổi thử
            [puzzleState[blankPos], puzzleState[n]] = [puzzleState[n], puzzleState[blankPos]];
            let score = getManhattanDist(puzzleState) + (Math.random() * 0.1); // Cộng nhiễu ngẫu nhiên nhỏ để phá thế bế tắc
            
            if (score < minScore) {
                minScore = score;
                bestMove = n;
            }
            // Trả lại vị trí
            [puzzleState[blankPos], puzzleState[n]] = [puzzleState[n], puzzleState[blankPos]];
        });

        // Nếu kẹt (chỉ có 1 đường lùi), bắt buộc phải đi lùi
        if (bestMove === -1 && neighbors.length > 0) {
            bestMove = neighbors[Math.floor(Math.random() * neighbors.length)];
        }

        if (bestMove !== -1) {
            [puzzleState[blankPos], puzzleState[bestMove]] = [puzzleState[bestMove], puzzleState[blankPos]];
            puzzleMoves++;
            puzzleMovesLabel.textContent = `${puzzleMoves} bước`;
            renderPuzzle();

            // Nghỉ 400ms rồi chạy bước tiếp theo tạo hiệu ứng nhìn thấy nó đang xếp
            setTimeout(() => {
                autoPlayPuzzle(stepsLeft - 1, blankPos);
            }, 400); 
        }
    }

    puzzleShuffleBtn.addEventListener('click', shufflePuzzle);
    shufflePuzzle();
});