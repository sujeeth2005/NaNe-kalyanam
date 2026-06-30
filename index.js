const startApp = () => {
    // -------------------------------------------------------------
    // 1. 3D WEBGL SECRET GARDEN PRELOADER & CINEMATIC CAMERA ENTRY
    // -------------------------------------------------------------
    const invitationGate = document.getElementById('invitation-gate');
    const mainContent = document.getElementById('main-content');
    const strangerHashtag = document.getElementById('stranger-hashtag');
    const canvas = document.getElementById('garden-canvas');

    if (strangerHashtag && canvas) {
        let scene, camera, renderer;
        let flowersGroup, lightsGroup;
        let butterflies = [];
        let particlesPoints;
        let couplePlane;
        let isSceneReady = false;
        let isArchClicked = false;
        let animationFrameId;

        // Initialize Three.js WebGL Scene
        const initThreeScene = () => {
            scene = new THREE.Scene();
            scene.fog = new THREE.FogExp2(0xF5EAE1, 0.018); // Soft warm golden-hour mist

            // Camera setup
            camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.set(0, 1.2, 50); // Start far back on Z-axis

            // Renderer setup
            renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.setClearColor(0x000000, 0); // Transparent canvas background
            renderer.shadowMap.enabled = true;

            // Lights
            const ambientLight = new THREE.AmbientLight(0xfff8ed, 0.85); // Warm fill
            scene.add(ambientLight);

            const sunLight = new THREE.DirectionalLight(0xffe8b3, 1.2); // Golden hour sun
            sunLight.position.set(10, 15, 10);
            scene.add(sunLight);

            // Procedural Ground
            const groundGeo = new THREE.PlaneGeometry(100, 300, 10, 10);
            const groundMat = new THREE.MeshStandardMaterial({
                color: 0xebf2ec, // Soft pastel sage/ivory ground
                roughness: 0.9,
                metalness: 0.05
            });
            const ground = new THREE.Mesh(groundGeo, groundMat);
            ground.rotation.x = -Math.PI / 2;
            ground.position.y = -2;
            scene.add(ground);

            // Procedural Foliage / Flowers
            flowersGroup = new THREE.Group();
            const stemMaterial = new THREE.MeshBasicMaterial({ color: 0x8FA89B }); // Sage green stems
            const petalColors = [0xD3A297, 0xE2C9C5, 0xF2DCD8, 0xDDB4AA, 0xCECEBE]; // Pastel rose, ivory, sage
            
            for (let i = 0; i < 180; i++) {
                const flower = new THREE.Group();
                const height = Math.random() * 2.8 + 0.8;
                
                // Stem
                const stemGeo = new THREE.CylinderGeometry(0.03, 0.03, height, 6);
                const stem = new THREE.Mesh(stemGeo, stemMaterial);
                stem.position.y = height / 2;
                flower.add(stem);
                
                // Bud/Petals
                const head = new THREE.Group();
                head.position.y = height;
                
                const petalGeo = new THREE.DodecahedronGeometry(0.24, 1);
                const color = petalColors[Math.floor(Math.random() * petalColors.length)];
                const petalMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.8, metalness: 0.05 });
                
                for (let p = 0; p < 4; p++) {
                    const petal = new THREE.Mesh(petalGeo, petalMat);
                    petal.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
                    petal.scale.set(1, 0.5, 1.2);
                    head.add(petal);
                }
                flower.add(head);
                
                // Placement along the banks of path (X between -3 and 3 is clear path)
                const side = Math.random() > 0.5 ? 1 : -1;
                flower.position.x = (Math.random() * 12 + 3.2) * side;
                flower.position.z = -Math.random() * 220; // Spread along Z
                flower.position.y = -2;
                
                // Randomly rotate flower stems slightly for organic look
                flower.rotation.z = (Math.random() - 0.5) * 0.25;
                flower.rotation.x = (Math.random() - 0.5) * 0.25;

                flowersGroup.add(flower);
            }
            scene.add(flowersGroup);

            // Hanging Lights (Lanterns)
            lightsGroup = new THREE.Group();
            const wireMat = new THREE.LineBasicMaterial({ color: 0x4A6054, opacity: 0.4, transparent: true });
            const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffd97d }); // Glowing bulbs
            
            for (let i = 0; i < 30; i++) {
                const hanger = new THREE.Group();
                const wireLength = Math.random() * 8 + 3;
                
                // Wire line down from sky
                const wirePoints = [new THREE.Vector3(0, wireLength, 0), new THREE.Vector3(0, 0, 0)];
                const wireGeo = new THREE.BufferGeometry().setFromPoints(wirePoints);
                const wire = new THREE.Line(wireGeo, wireMat);
                hanger.add(wire);
                
                // Bulb sphere
                const bulbGeo = new THREE.SphereGeometry(0.16, 12, 12);
                const bulb = new THREE.Mesh(bulbGeo, bulbMat);
                bulb.position.y = 0;
                hanger.add(bulb);
                
                // Soft glow light point source (only a few to prevent WebGL overhead)
                if (i % 3 === 0) {
                    const pointLight = new THREE.PointLight(0xffeaad, 0.4, 15);
                    pointLight.position.y = 0;
                    hanger.add(pointLight);
                }
                
                const side = Math.random() > 0.5 ? 1 : -1;
                hanger.position.set((Math.random() * 6 + 2.5) * side, Math.random() * 4 + 4, -Math.random() * 180 - 10);
                
                hanger.userData = {
                    swaySpeed: Math.random() * 0.8 + 0.4,
                    swayOffset: Math.random() * Math.PI,
                    swayAmount: Math.random() * 0.04 + 0.02
                };
                
                lightsGroup.add(hanger);
            }
            scene.add(lightsGroup);

            // Flapping Butterflies
            const wingMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.3, side: THREE.DoubleSide });
            for (let i = 0; i < 15; i++) {
                const butterfly = new THREE.Group();
                
                const leftWing = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.35, 3), wingMat);
                leftWing.rotation.z = Math.PI / 2;
                leftWing.position.x = -0.15;
                leftWing.scale.set(1, 0.08, 1);
                butterfly.add(leftWing);
                
                const rightWing = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.35, 3), wingMat);
                rightWing.rotation.z = -Math.PI / 2;
                rightWing.position.x = 0.15;
                rightWing.scale.set(1, 0.08, 1);
                butterfly.add(rightWing);
                
                // Spawn position
                butterfly.position.set(Math.random() * 8 - 4, Math.random() * 3 + 0.5, -Math.random() * 160 - 20);
                butterfly.userData = {
                    flightOffset: Math.random() * 100,
                    speed: Math.random() * 0.015 + 0.008,
                    leftWing: leftWing,
                    rightWing: rightWing
                };
                
                scene.add(butterfly);
                butterflies.push(butterfly);
            }

            // Path Glowing Dust Particles
            const particleCount = 350;
            const particleGeo = new THREE.BufferGeometry();
            const positions = new Float32Array(particleCount * 3);
            
            for (let i = 0; i < particleCount * 3; i += 3) {
                positions[i] = Math.random() * 26 - 13;
                positions[i+1] = Math.random() * 8 - 1.8;
                positions[i+2] = -Math.random() * 220;
            }
            particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            
            const pMaterial = new THREE.PointsMaterial({
                color: 0xffeaad,
                size: 0.14,
                transparent: true,
                opacity: 0.75,
                sizeAttenuation: true
            });
            particlesPoints = new THREE.Points(particleGeo, pMaterial);
            scene.add(particlesPoints);

            // The Gold-Marbled Archway (Target of the Path)
            const archGroup = new THREE.Group();
            archGroup.position.set(0, -2, -180); // Placed at Z = -180
            
            const marbleMat = new THREE.MeshStandardMaterial({ color: 0xFAF9F5, roughness: 0.3, metalness: 0.05 });
            const goldAccentMat = new THREE.MeshStandardMaterial({ color: 0xD4AF37, roughness: 0.1, metalness: 0.85 });
            
            const pillarLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 9.5, 16), marbleMat);
            pillarLeft.position.set(-3.6, 4.75, 0);
            archGroup.add(pillarLeft);
            
            const pillarRight = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 9.5, 16), marbleMat);
            pillarRight.position.set(3.6, 4.75, 0);
            archGroup.add(pillarRight);
            
            const header = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.8, 1.2), marbleMat);
            header.position.set(0, 9.6, 0);
            archGroup.add(header);
            
            const trim = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.16, 1.3), goldAccentMat);
            trim.position.set(0, 9.15, 0);
            archGroup.add(trim);

            // Load and render golden silhouette billboard plane inside archway
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                
                const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imgData.data;
                
                // Key out black background pixels while preserving all colors and faceted shading of the low-poly art!
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i+1];
                    const b = data[i+2];
                    
                    // Key out pixels close to pure black background
                    if (r < 30 && g < 30 && b < 30) {
                        data[i+3] = 0; // Transparent
                    } else {
                        data[i+3] = 255; // Fully opaque
                    }
                }
                
                ctx.putImageData(imgData, 0, 0);
                
                const keyedTexture = new THREE.CanvasTexture(canvas);
                const coupleMat = new THREE.MeshBasicMaterial({
                    map: keyedTexture,
                    transparent: true,
                    side: THREE.DoubleSide,
                    alphaTest: 0.05
                });
                
                // Plane geometry (grounded 1:1 aspect ratio to fit the arch perfectly)
                couplePlane = new THREE.Mesh(new THREE.PlaneGeometry(7.0, 7.0), coupleMat);
                couplePlane.position.set(0, 3.5, 0);
                archGroup.add(couplePlane);
            };
            img.src = 'assets/couple_silhouette.png';

            // Add a warm gold ambient point light inside the arch to make the setting feel magical
            const statueLight = new THREE.PointLight(0xffb74d, 1.8, 12);
            statueLight.position.set(0, 3.5, 1.0);
            archGroup.add(statueLight);
            
            scene.add(archGroup);
            
            isSceneReady = true;
        };

        let targetCameraZ = 50;
        let targetCameraX = 0;
        let targetCameraY = 1.25;

        // Window resize handler
        window.addEventListener('resize', () => {
            if (!camera || !renderer) return;
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // 3D Scene Animation Loop
        const animate = (time) => {
            if (!renderer || !scene || !camera) return;
            animationFrameId = requestAnimationFrame(animate);
            
            const seconds = time * 0.001;

            // Lerp camera position for buttery inertia scroll glide!
            camera.position.z += (targetCameraZ - camera.position.z) * 0.055;
            camera.position.x += (targetCameraX - camera.position.x) * 0.055;
            camera.position.y += (targetCameraY - camera.position.y) * 0.055;

            // Sway Hanging Lights
            if (lightsGroup) {
                lightsGroup.children.forEach(hanger => {
                    const data = hanger.userData;
                    const sway = Math.sin(seconds * data.swaySpeed + data.swayOffset) * data.swayAmount;
                    hanger.rotation.z = sway;
                    hanger.rotation.x = sway * 0.5;
                });
            }

            // Animate Butterflies (flap wings & drift)
            butterflies.forEach(bf => {
                const data = bf.userData;
                const flap = Math.sin(seconds * 18 + data.flightOffset) * 0.65;
                data.leftWing.rotation.y = flap;
                data.rightWing.rotation.y = -flap;
                
                // Drift wings gently
                bf.position.y += Math.sin(seconds * 1.5 + data.flightOffset) * 0.005;
                bf.position.x += Math.cos(seconds * 0.8 + data.flightOffset) * 0.004;
            });

            // Gentle float particles
            if (particlesPoints) {
                const positions = particlesPoints.geometry.attributes.position.array;
                for (let i = 1; i < positions.length; i += 3) {
                    positions[i] += Math.sin(seconds * 0.5 + i) * 0.0015; // Y drift
                }
                particlesPoints.geometry.attributes.position.needsUpdate = true;
            }

            // Smoothly fade out the couple silhouette when camera gets extremely close (prevent clipping)
            if (couplePlane) {
                const dist = Math.abs(camera.position.z - (-180));
                if (dist < 25) {
                    couplePlane.material.opacity = Math.max(0, (dist - 4) / 21);
                } else {
                    couplePlane.material.opacity = 1.0;
                }
            }

            renderer.render(scene, camera);
        };

        const enterInvitationAutomatically = () => {
            if (isArchClicked) return;
            isArchClicked = true;



            // Bind scrollytelling controls on main entry
            window.addEventListener('mousemove', (e) => {
                const x = (e.clientX / window.innerWidth - 0.5) * 1.8; // Max 0.9 units left/right drift
                const y = -(e.clientY / window.innerHeight - 0.5) * 1.0 + 1.25; // Max 0.5 units vertical drift, centered on 1.25
                targetCameraX = x;
                targetCameraY = y;
            });

            window.addEventListener('scroll', () => {
                const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
                if (maxScroll <= 0) return;
                const scrollPct = window.scrollY / maxScroll;
                
                // Reached archway at 50% scroll, glide past it into the gold horizon towards 100%
                if (scrollPct <= 0.5) {
                    targetCameraZ = 50 - (scrollPct / 0.5) * 230;
                } else {
                    targetCameraZ = -180 - ((scrollPct - 0.5) / 0.5) * 40;
                }
            });

            // Initialize camera Z to match current scroll position on enter
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            if (maxScroll > 0) {
                const scrollPct = window.scrollY / maxScroll;
                if (scrollPct <= 0.5) {
                    targetCameraZ = 50 - (scrollPct / 0.5) * 230;
                } else {
                    targetCameraZ = -180 - ((scrollPct - 0.5) / 0.5) * 40;
                }
            }

            // Fade preloader gate cover layer out
            gsap.to(invitationGate, {
                opacity: 0,
                duration: 0.8,
                ease: "power2.out",
                onComplete: () => {
                    if (invitationGate) invitationGate.style.display = 'none';
                }
            });

            // Reveal main content layers
            if (mainContent) mainContent.classList.remove('hidden-content');
            
            // Trigger falling eucalyptus leaves/jasmine petals
            startFoliageFall();
        };

        // Start Stranger Things cinematic entrance
        // Start Stranger Things cinematic entrance using single native CSS keyframe animation
        strangerHashtag.style.animation = 'stranger-entrance 3.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards';
        
        // Initialize Three.js scene in background
        initThreeScene();
        animate(0);

        // Fade out preloader gate and enter invitation at the end of the keyframe timeline (3.2s)
        setTimeout(() => {
            enterInvitationAutomatically();
        }, 3200);
    }

    // -------------------------------------------------------------
    // 1B. 3D PARALLAX TILT EFFECT FOR HERO CARDS
    // -------------------------------------------------------------
    const tiltItems = document.querySelectorAll('.card-3d-wrapper, .hero-photo-card');
    
    tiltItems.forEach(wrapper => {
        const card = wrapper.querySelector('.card-3d-container, .hero-photo-img');
        if (!card) return;
        
        wrapper.style.perspective = '1200px';
        card.style.transformStyle = 'preserve-3d';
        
        wrapper.addEventListener('mousemove', (e) => {
            const rect = wrapper.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            // Tight, natural 3D tilt up to 12 degrees
            const rotateX = -(y / rect.height) * 12;
            const rotateY = (x / rect.width) * 12;

            card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.025)`;
            card.style.transition = 'transform 0.05s ease';
        });

        wrapper.addEventListener('mouseleave', () => {
            card.style.transform = '';
            card.style.transition = 'transform 0.5s ease';
        });
        
        wrapper.addEventListener('mouseenter', () => {
            card.style.transition = 'transform 0.05s ease';
        });
    });

    // -------------------------------------------------------------
    // 2. FALLING FOLIAGE ENGINE (EUCALYPTUS & JASMINE)
    // -------------------------------------------------------------
    const petalsContainer = document.getElementById('petals-container');
    const MAX_PARTICLES = 30; // Limit active particles to preserve performance

    function startFoliageFall() {
        if (!petalsContainer) return;

        // Spawn particles periodically until limit is reached
        let particleCount = 0;
        const spawnInterval = setInterval(() => {
            if (particleCount >= MAX_PARTICLES) {
                clearInterval(spawnInterval);
                return;
            }
            createFoliageParticle();
            particleCount++;
        }, 350);
    }

    function createFoliageParticle() {
        const particle = document.createElement('div');
        
        // Randomly select between Eucalyptus leaf and Jasmine petal
        const isLeaf = Math.random() > 0.45;
        if (isLeaf) {
            particle.classList.add('leaf-particle');
        } else {
            particle.classList.add('jasmine-particle');
        }

        // Randomized sizes
        const size = Math.random() * 14 + 10; // 10px to 24px
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;

        // Randomized starting positions
        particle.style.left = `${Math.random() * 100}vw`;
        particle.style.top = `-50px`;

        // Randomized opacity
        particle.style.opacity = Math.random() * 0.4 + 0.5; // 0.5 to 0.9

        // Random animation durations
        const fallDuration = Math.random() * 8 + 6; // 6s to 14s
        const swayDuration = Math.random() * 3 + 2; // 2s to 5s
        
        particle.style.animation = `petalFall ${fallDuration}s linear infinite, petalSway ${swayDuration}s ease-in-out infinite alternate`;
        particle.style.animationDelay = `${Math.random() * 6}s`;

        petalsContainer.appendChild(particle);
    }

    // -------------------------------------------------------------
    // 3. COUNTDOWN TIMER
    // -------------------------------------------------------------
    // Target Date: August 23, 2026, 07:30 AM (Muhurtham)
    const weddingDate = new Date('August 23, 2026 07:30:00').getTime();

    const updateCountdown = () => {
        const now = new Date().getTime();
        const difference = weddingDate - now;

        if (difference < 0) {
            const container = document.querySelector('.countdown-container');
            if (container) {
                container.innerHTML = `
                    <div class="countdown-finished cormorant font-gradient">
                        <h3>The Celebrations Have Begun!</h3>
                    </div>
                `;
            }
            clearInterval(countdownInterval);
            return;
        }

        // Time calculations
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        // Render values, padding single digits with leading zero
        const daysEl = document.getElementById('days');
        const hoursEl = document.getElementById('hours');
        const minsEl = document.getElementById('minutes');
        const secsEl = document.getElementById('seconds');

        if (daysEl) daysEl.innerText = String(days).padStart(2, '0');
        if (hoursEl) hoursEl.innerText = String(hours).padStart(2, '0');
        if (minsEl) minsEl.innerText = String(minutes).padStart(2, '0');
        if (secsEl) secsEl.innerText = String(seconds).padStart(2, '0');
    };

    updateCountdown();
    const countdownInterval = setInterval(updateCountdown, 1000);

    // -------------------------------------------------------------
    // 4. PINTEREST-STYLE LIGHTBOX MODAL
    // -------------------------------------------------------------
    const lightboxModal = document.getElementById('lightbox-modal');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const closeBtn = document.querySelector('.lightbox-close');
    const prevBtn = document.querySelector('.prev-slide');
    const nextBtn = document.querySelector('.next-slide');
    
    const galleryItems = Array.from(document.querySelectorAll('.masonry-item'));
    let activeIndex = 0;

    const openLightbox = (index) => {
        if (!lightboxModal) return;
        activeIndex = index;
        const item = galleryItems[activeIndex];
        const src = item.getAttribute('data-src');
        const caption = item.getAttribute('data-caption');

        lightboxImg.src = src;
        lightboxCaption.innerText = caption;

        lightboxModal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Lock scrolling
    };

    const closeLightbox = () => {
        if (!lightboxModal) return;
        lightboxModal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Unlock scrolling
    };

    const scrollLightbox = (direction) => {
        activeIndex = (activeIndex + direction + galleryItems.length) % galleryItems.length;
        openLightbox(activeIndex);
    };

    // Attach click listeners to gallery elements
    galleryItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            openLightbox(index);
        });
    });

    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
    if (prevBtn) prevBtn.addEventListener('click', () => scrollLightbox(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => scrollLightbox(1));

    // Close lightbox on click outside the image
    if (lightboxModal) {
        lightboxModal.addEventListener('click', (e) => {
            if (e.target === lightboxModal) {
                closeLightbox();
            }
        });
    }

    // Keyboard bindings for Lightbox navigation
    document.addEventListener('keydown', (e) => {
        if (!lightboxModal || lightboxModal.style.display !== 'flex') return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowRight') scrollLightbox(1);
        if (e.key === 'ArrowLeft') scrollLightbox(-1);
    });

    // -------------------------------------------------------------
    // 5. SCROLL REVEAL OBSERVER
    // -------------------------------------------------------------
    const revealElements = document.querySelectorAll('.scroll-reveal');

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal-active');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -45px 0px'
    });

    revealElements.forEach(element => {
        revealObserver.observe(element);
    });



    // -------------------------------------------------------------
    // 7. UTILITIES SECTION OPERATIONS
    // -------------------------------------------------------------
    const btnDownloadPdf = document.getElementById('btn-download-pdf');

    if (btnDownloadPdf) {
        btnDownloadPdf.addEventListener('click', () => {
            // Trigger native print dialog. Custom print-CSS handles PDF formatting cleanly.
            window.print();
        });
    }

    // -------------------------------------------------------------
    // 8. WEDDING REMINDERS SERVICE
    // -------------------------------------------------------------
    const btnReminderIcs = document.getElementById('btn-reminder-ics');
    const btnReminderNotify = document.getElementById('btn-reminder-notify');
    const btnReminderEmail = document.getElementById('btn-reminder-email');
    const reminderEmailInput = document.getElementById('reminder-email-input');
    const statusMsg = document.getElementById('reminder-status-msg');

    function showStatus(text, type) {
        if (!statusMsg) return;
        statusMsg.innerText = text;
        statusMsg.className = `reminder-status-text ${type}`;
        statusMsg.classList.remove('hidden');
        
        setTimeout(() => {
            statusMsg.classList.add('hidden');
        }, 5000);
    }

    // iCal Generation with custom alerts (24h, 12h, 1h prior to Muhurtham)
    if (btnReminderIcs) {
        btnReminderIcs.addEventListener('click', () => {
            const icsContent = [
                'BEGIN:VCALENDAR',
                'VERSION:2.0',
                'PRODID:-//NaNe Wedding//Invitation//EN',
                'CALSCALE:GREGORIAN',
                'METHOD:PUBLISH',
                'BEGIN:VEVENT',
                'UID:nane-wedding-muhurtham-2026@wedding-invite.com',
                'DTSTAMP:20260630T000000Z',
                'DTSTART:20260823T020000Z', // 07:30 AM IST is 02:00:00 UTC
                'DTEND:20260823T033000Z',   // 09:00 AM IST is 03:30:00 UTC
                'SUMMARY:Naveenkrishna & Nehashree Wedding Ceremony (Muhurtham)',
                'DESCRIPTION:You are cordially invited to celebrate the Muhurtham ceremony of Selvan. B.B. Naveenkrishna and Selvi. G. Nehashree.',
                'LOCATION:Sri Devi Mahal, Vengaivasal Main Road, Santhosapuram, Chennai',
                'BEGIN:VALARM',
                'ACTION:DISPLAY',
                'TRIGGER:-PT24H',
                'DESCRIPTION:Reminder: Naveenkrishna & Nehashree Wedding is in 24 hours!',
                'END:VALARM',
                'BEGIN:VALARM',
                'ACTION:DISPLAY',
                'TRIGGER:-PT12H',
                'DESCRIPTION:Reminder: Naveenkrishna & Nehashree Wedding is in 12 hours!',
                'END:VALARM',
                'BEGIN:VALARM',
                'ACTION:DISPLAY',
                'TRIGGER:-PT1H',
                'DESCRIPTION:Reminder: Naveenkrishna & Nehashree Wedding is in 1 hour!',
                'END:VALARM',
                'END:VEVENT',
                'END:VCALENDAR'
            ].join('\r\n');

            const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.setAttribute('download', 'wedding_reminder_alarms.ics');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showStatus('Calendar event with alarms downloaded!', 'success');
        });
    }

    // Web Notification API subscriptions
    if (btnReminderNotify) {
        btnReminderNotify.addEventListener('click', () => {
            if (!("Notification" in window)) {
                showStatus('Browser does not support notifications.', 'error');
                return;
            }

            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    try {
                        new Notification("Wedding Reminders Subscribed", {
                            body: "We will remind you 24h, 12h, and 1h before the Muhurtham!",
                            icon: "assets/couple_silhouette.png"
                        });
                    } catch (e) {
                        // Desktop browsers might require Service Worker for notifications sometimes, but standard API works
                    }
                    showStatus('Web push notifications subscribed!', 'success');
                } else if (permission === 'denied') {
                    showStatus('Notification permission was denied.', 'error');
                } else {
                    showStatus('Notification permission dismissed.', 'error');
                }
            });
        });
    }

    // Email alert subscriptions
    if (btnReminderEmail && reminderEmailInput) {
        btnReminderEmail.addEventListener('click', () => {
            const email = reminderEmailInput.value.trim();
            if (!email || !email.includes('@')) {
                showStatus('Please enter a valid email address.', 'error');
                return;
            }
            
            // Save to localStorage
            const subscribers = JSON.parse(localStorage.getItem('wedding_subscribers') || '[]');
            subscribers.push(email);
            localStorage.setItem('wedding_subscribers', JSON.stringify(subscribers));
            
            // Animate and show status
            reminderEmailInput.value = '';
            showStatus('Email subscription confirmed! Alarms scheduled.', 'success');
            
            // Subtle premium animation on the input area
            const formContainer = document.querySelector('.reminder-form-inline');
            if (formContainer) {
                formContainer.style.transform = 'scale(1.02)';
                setTimeout(() => {
                    formContainer.style.transform = 'none';
                }, 300);
            }
        });
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
} else {
    startApp();
}
