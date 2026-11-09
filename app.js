/**
 * Akvaryum - Ana Uygulama Orkestrasyonu (App.js)
 * Kick Kimlik Doğrulama, FishVille Sanat Tasarımı, Bölgesel Yosunlaşma,
 * Kişisel Akvaryum, Topluluk Akvaryumları, Ortak Okyanus ve Kozmetik Dükkanı.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Modül Başlatıcılar
    const drawEngine = new FishDrawingCanvas('drawCanvas', 'previewCanvas');
    const aquariumSim = new PersonalAquarium('aquariumCanvas', 'glassCanvas');
    const oceanSim = new SharedOcean('oceanCanvas');
    const networkMgr = new OceanNetworkManager();

    // 2. UI Referansları
    const tabs = {
        draw: document.getElementById('view-draw'),
        pet: document.getElementById('view-pet'),
        community: document.getElementById('view-community'),
        ocean: document.getElementById('view-ocean')
    };

    const tabBtns = {
        draw: document.getElementById('tabBtnDraw'),
        pet: document.getElementById('tabBtnPet'),
        community: document.getElementById('tabBtnCommunity'),
        ocean: document.getElementById('tabBtnOcean')
    };

    // HUD Referansları
    const hudFishAvatar = document.getElementById('hudFishAvatar');
    const hudFishName = document.getElementById('hudFishName');
    const hudFishLevel = document.getElementById('hudFishLevel');
    const hudOxygenVal = document.getElementById('hudOxygenVal');
    const barOxygen = document.getElementById('barOxygen');
    const hudAlgaeVal = document.getElementById('hudAlgaeVal');
    const barAlgae = document.getElementById('barAlgae');
    const hudGrowthVal = document.getElementById('hudGrowthVal');
    const barGrowth = document.getElementById('barGrowth');
    const hudAfkTimerText = document.getElementById('hudAfkTimerText');
    const hudGoldDisplay = document.getElementById('hudGoldDisplay');
    const userGoldCount = document.getElementById('userGoldCount');
    const shopUserGold = document.getElementById('shopUserGold');

    const feedBtn = document.getElementById('btnFeedFish');
    const feedBtnText = document.getElementById('feedBtnText');
    const feedTimerText = document.getElementById('feedTimerText');
    const btnReleaseToOcean = document.getElementById('btnReleaseToOcean');
    const btnPumpAir = document.getElementById('btnPumpAir');
    const modalCelebration = document.getElementById('modalCelebration');
    const celebrationDesc = document.getElementById('celebrationDesc');
    const statOceanFishCount = document.getElementById('statOceanFishCount');
    const statTotalReleased = document.getElementById('statTotalReleased');

    // Misafir Modu Referansları
    const guestBanner = document.getElementById('guestBanner');
    const guestOwnerName = document.getElementById('guestOwnerName');
    const btnGuestPetFish = document.getElementById('btnGuestPetFish');
    const btnReturnMyTank = document.getElementById('btnReturnMyTank');

    // Dükkan Referansları
    const modalShop = document.getElementById('modalShop');
    const btnOpenShop = document.getElementById('btnOpenShop');
    const btnCloseShop = document.getElementById('btnCloseShop');
    const shopItemsContainer = document.getElementById('shopItemsContainer');

    // Kick Kimlik Doğrulama Referansları
    const btnKickLogin = document.getElementById('btnKickLogin');
    const modalKickLogin = document.getElementById('modalKickLogin');
    const btnCloseKickModal = document.getElementById('btnCloseKickModal');
    const btnKickOAuthLogin = document.getElementById('btnKickOAuthLogin');
    const inputKickModalUsername = document.getElementById('inputKickModalUsername');
    const btnConfirmKickLogin = document.getElementById('btnConfirmKickLogin');
    const userKickProfile = document.getElementById('userKickProfile');
    const userKickAvatarChar = document.getElementById('userKickAvatarChar');
    const userKickNameDisplay = document.getElementById('userKickNameDisplay');
    const inputCreatorName = document.getElementById('inputCreatorName');

    let activeTab = 'draw';
    let currentActiveFish = null;
    let activeShopCategory = 'trails';

    // 3. Kick Giriş Sistemi (Resmi OAuth 2.0 & Hızlı Bağlantı)
    function updateKickUI(user) {
        if (user && user.username) {
            btnKickLogin.style.display = 'none';
            userKickProfile.style.display = 'flex';
            
            if (user.avatar) {
                userKickAvatarChar.innerHTML = `<img src="${user.avatar}" alt="${user.username}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
            } else {
                userKickAvatarChar.textContent = user.username.charAt(0).toUpperCase();
            }

            userKickNameDisplay.textContent = `@${user.username}`;
            if (inputCreatorName) inputCreatorName.value = user.username;
        } else {
            btnKickLogin.style.display = 'flex';
            userKickProfile.style.display = 'none';
        }
    }

    // Modal Aç / Kapat
    btnKickLogin.addEventListener('click', () => {
        modalKickLogin.classList.add('active');
        if (inputKickModalUsername) inputKickModalUsername.focus();
    });

    if (btnCloseKickModal) {
        btnCloseKickModal.addEventListener('click', () => {
            modalKickLogin.classList.remove('active');
        });
    }

    // Resmi Kick OAuth 2.0 Yönlendirmesi
    if (btnKickOAuthLogin) {
        btnKickOAuthLogin.addEventListener('click', () => {
            if (window.kickAuth) {
                window.kickAuth.startKickLogin();
            }
        });
    }

    // Kullanıcı Adı ile Hızlı Giriş
    btnConfirmKickLogin.addEventListener('click', () => {
        const val = (inputKickModalUsername.value || '').trim();
        if (!val) {
            alert('Lütfen geçerli bir Kick kullanıcı adı girin!');
            return;
        }
        if (window.kickAuth) {
            window.kickAuth.manualLogin(val);
        }
        modalKickLogin.classList.remove('active');
        window.soundEngine && window.soundEngine.playBuy();
    });

    // Profil Çıkış
    userKickProfile.addEventListener('click', () => {
        const user = window.kickAuth ? window.kickAuth.getUser() : null;
        const name = user ? user.username : 'kullanıcı';
        if (confirm(`@${name} Kick hesabından çıkış yapmak istiyor musunuz?`)) {
            if (window.kickAuth) {
                window.kickAuth.logout();
            }
        }
    });

    // Kick Auth Dinleyicisi
    if (window.kickAuth) {
        window.kickAuth.onAuthChangeCallback = (user) => {
            updateKickUI(user);
        };
        updateKickUI(window.kickAuth.getUser());
    }

    // 4. Kozmetik Kataloğu
    const COSMETIC_CATALOG = {
        trails: [
            { id: 'default', name: 'Doğal Kabarcık', price: 0, icon: '🫧', desc: 'Sade su kabarcığı izi.' },
            { id: 'kick_neon', name: 'Kick Neon Parıltısı', price: 100, icon: '🟢', desc: 'Balığın ardında parlayan Kick yeşili neon iz.' },
            { id: 'stars', name: 'Sihirli Yıldız Tozu', price: 200, icon: '✨', desc: 'Yüzerken arkasında ışıltılı yıldızlar saçar.' },
            { id: 'gold_dust', name: 'Altın Hazine Tozu', price: 350, icon: '🪙', desc: 'Zengin altın sikkeler ve pırıltılar saçar.' },
            { id: 'rainbow', name: 'Gökkuşağı Akışı', price: 500, icon: '🌈', desc: 'Sürekli renk değiştiren spektrum dalgası.' }
        ],
        decors: [
            { id: 'none', name: 'Sade Kum', price: 0, icon: '🪨', desc: 'Ekstra dekorasyon yok.' },
            { id: 'coral', name: 'Neon Mercan', price: 150, icon: '🪸', desc: 'Akvaryumun dibinde parıldayan biyo-mercan.' },
            { id: 'chest', name: 'Batık Hazine Sandığı', price: 300, icon: '👑', desc: 'Korsanların unuttuğu altın sandığı.' },
            { id: 'crystal', name: 'Derin Su Kristalleri', price: 400, icon: '💎', desc: 'Mavi ve yeşil ışıltılı kristal sütunlar.' }
        ],
        themes: [
            { id: 'fishville', name: 'FishVille Klasik', price: 0, icon: '🏖️', desc: 'Berrak turkuaz su, mağara kemeri ve sıcak kum.' },
            { id: 'lagoon', name: 'Zümrüt Lagün', price: 200, icon: '🏝️', desc: 'Turkuaz lagün suyu atmosferi.' },
            { id: 'cyberpunk', name: 'Siberpunk Kick Neon', price: 350, icon: '⚡', desc: 'Mor ve neon yeşili fütüristik atmosfer.' }
        ]
    };

    let userInventory = loadUserInventory();

    function loadUserInventory() {
        try {
            const raw = localStorage.getItem('akvaryum_cosmetics_inventory');
            return raw ? JSON.parse(raw) : {
                trails: ['default'],
                decors: ['none'],
                themes: ['fishville']
            };
        } catch (e) {
            return { trails: ['default'], decors: ['none'], themes: ['fishville'] };
        }
    }

    function saveUserInventory() {
        try {
            localStorage.setItem('akvaryum_cosmetics_inventory', JSON.stringify(userInventory));
        } catch (e) {}
    }

    // 5. Sekme Değiştirme
    function switchTab(tabName) {
        activeTab = tabName;
        Object.keys(tabs).forEach(key => {
            if (tabs[key]) {
                tabs[key].classList.toggle('active', key === tabName);
            }
            if (tabBtns[key]) {
                tabBtns[key].classList.toggle('active', key === tabName);
            }
        });

        if (tabName === 'pet') {
            aquariumSim.resize();
        } else if (tabName === 'community') {
            renderCommunityAquariums();
        } else if (tabName === 'ocean') {
            oceanSim.resize();
            updateOceanStats();
        }
    }

    Object.keys(tabBtns).forEach(key => {
        if (tabBtns[key]) {
            tabBtns[key].addEventListener('click', () => {
                window.soundEngine && window.soundEngine.ensureContext();
                switchTab(key);
            });
        }
    });

    // 6. Çizim Atölyesi Olay Dinleyicileri
    const toolBtns = document.querySelectorAll('.tool-btn[data-tool]');
    toolBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            toolBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            drawEngine.setTool(btn.dataset.tool);
        });
    });

    const swatches = document.querySelectorAll('.color-swatch');
    swatches.forEach(swatch => {
        swatch.addEventListener('click', () => {
            swatches.forEach(s => s.classList.remove('active'));
            swatch.classList.add('active');
            drawEngine.setColor(swatch.dataset.color);
        });
    });

    const customPicker = document.getElementById('customColorPicker');
    if (customPicker) {
        customPicker.addEventListener('input', (e) => {
            swatches.forEach(s => s.classList.remove('active'));
            drawEngine.setColor(e.target.value);
        });
    }

    const brushSlider = document.getElementById('brushSize');
    const brushSizeVal = document.getElementById('brushSizeVal');
    if (brushSlider) {
        brushSlider.addEventListener('input', (e) => {
            brushSizeVal.textContent = e.target.value + 'px';
            drawEngine.setSize(e.target.value);
        });
    }

    document.getElementById('btnUndo').addEventListener('click', () => drawEngine.undo());
    document.getElementById('btnClearCanvas').addEventListener('click', () => drawEngine.clear());
    document.getElementById('btnLoadSampleFish').addEventListener('click', () => {
        const types = ['fish', 'goldfish'];
        const chosen = types[Math.floor(Math.random() * types.length)];
        drawEngine.loadTemplate(chosen);
    });

    drawEngine.loadTemplate('fish');

    // 7. Balığı Canlandır ve Akvaryuma Bırak
    document.getElementById('btnBringToLife').addEventListener('click', () => {
        window.soundEngine && window.soundEngine.ensureContext();

        const fishName = document.getElementById('inputFishName').value || 'Palamut';
        const user = window.kickAuth ? window.kickAuth.getUser() : null;
        const creatorName = (user && user.username) || document.getElementById('inputCreatorName').value || 'pristagna';

        const fishData = drawEngine.exportFishData(fishName, creatorName);
        if (!fishData) {
            alert('Lütfen önce tuval üzerine bir balık çizin!');
            return;
        }

        currentActiveFish = fishData;
        aquariumSim.loadFish(fishData);

        networkMgr.broadcastMyAquarium({
            id: fishData.id,
            name: fishData.name,
            creator: fishData.creator,
            level: 1,
            oxygen: 85,
            algaeDirty: 0,
            dataUrl: fishData.dataUrl,
            width: fishData.width,
            height: fishData.height,
            equippedCosmetics: aquariumSim.equippedCosmetics
        });

        hudFishAvatar.src = fishData.dataUrl;
        hudFishName.textContent = fishData.name;
        hudFishLevel.textContent = `Seviye 1/10 (Yavru) • @${fishData.creator}`;

        window.soundEngine && window.soundEngine.playLevelUp();
        switchTab('pet');
    });

    // 8. Kişisel Akvaryum Etkileşimleri
    btnPumpAir.addEventListener('click', () => {
        aquariumSim.pumpAir();
    });

    feedBtn.addEventListener('click', () => {
        if (feedBtn.classList.contains('ready')) {
            aquariumSim.feedFish();
        }
    });

    aquariumSim.onGoldEarnedCallback = (totalGold) => {
        updateGoldUI(totalGold);
        if (hudGoldDisplay) {
            hudGoldDisplay.classList.remove('bounce');
            void hudGoldDisplay.offsetWidth;
            hudGoldDisplay.classList.add('bounce');
        }
    };

    function updateGoldUI(amount) {
        if (userGoldCount) userGoldCount.textContent = amount;
        if (shopUserGold) shopUserGold.textContent = amount;
    }

    // Akvaryum Durum Değişikliği (Bölgesel Yosun & Yaşam Durumu)
    aquariumSim.onStatusChangeCallback = (status) => {
        updateGoldUI(status.gold);

        if (status.isGuestMode) {
            guestBanner.style.display = 'block';
            guestOwnerName.textContent = status.guestOwner || 'İzleyici';
            feedBtn.style.display = 'none';
            btnReleaseToOcean.style.display = 'none';
        } else {
            guestBanner.style.display = 'none';
            feedBtn.style.display = 'flex';
        }

        hudOxygenVal.textContent = `${status.oxygen}%`;
        barOxygen.style.width = `${status.oxygen}%`;
        barOxygen.style.background = status.oxygen < 25 ? '#ff4d6d' : 'linear-gradient(90deg, #ff4d6d, #ffd166, #06d6a0, #48cae4)';

        // Bölgesel Yosun Lekesi Sayısı & Kirlilik
        const patchCount = status.algaePatchCount !== undefined ? status.algaePatchCount : 0;
        hudAlgaeVal.textContent = patchCount === 0 ? 'Tertemiz (%0)' : `${patchCount} Leke (%${status.algaeDirty})`;
        barAlgae.style.width = `${status.algaeDirty}%`;

        hudGrowthVal.textContent = `${status.level} / ${status.maxLevel} Yem`;
        barGrowth.style.width = `${(status.level / status.maxLevel) * 100}%`;
        hudFishLevel.textContent = `Seviye ${status.level}/${status.maxLevel} ${status.isFullGrown ? '(Yetişkin!)' : ''} • @${status.creator}`;

        if (hudAfkTimerText) {
            if (status.isSick) {
                hudAfkTimerText.innerHTML = `<span style="color:#ff4d6d;">DURDU</span>`;
            } else {
                hudAfkTimerText.textContent = `${status.afkSecondsRemaining}sn kaldı`;
            }
        }

        if (status.isSick) {
            hudFishLevel.innerHTML = `<span style="color:#ff4d6d;">🩹 HASTA! Camdaki yosun lekelerini silin ve oksijen basın!</span>`;
        }

        if (!status.isGuestMode) {
            if (status.feedCooldown <= 0) {
                feedBtn.disabled = false;
                feedBtn.classList.add('ready');
                feedBtnText.textContent = '🍣 Yem Ver!';
                feedTimerText.textContent = 'Hazır!';
            } else {
                feedBtn.disabled = true;
                feedBtn.classList.remove('ready');
                const mins = Math.floor(status.feedCooldown / 60);
                const secs = status.feedCooldown % 60;
                feedBtnText.textContent = 'Yem Hazırlanıyor';
                feedTimerText.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} Kalan`;
            }

            if (status.isFullGrown) {
                btnReleaseToOcean.classList.add('show');
            } else {
                btnReleaseToOcean.classList.remove('show');
            }
        }

        if (currentActiveFish && !status.isGuestMode) {
            networkMgr.saveActivePetProgress(currentActiveFish, status);
        }
    };

    btnGuestPetFish.addEventListener('click', () => {
        aquariumSim.petFish();
    });

    btnReturnMyTank.addEventListener('click', () => {
        aquariumSim.returnToMyAquarium();
    });

    // 9. Okyanusa Salma Ritüeli
    btnReleaseToOcean.addEventListener('click', () => {
        btnReleaseToOcean.disabled = true;
        btnReleaseToOcean.classList.remove('show');

        const releasedData = aquariumSim.releaseToOcean();
        if (releasedData) {
            networkMgr.broadcastFishRelease(releasedData);
            networkMgr.clearActivePet();

            setTimeout(() => {
                celebrationDesc.textContent = `"${releasedData.name}" isimli balığın 100 dakikalık sevgi ve emeğin sonucunda Ortak Okyanus'a katıldı! Canlı yayında diğer tüm izleyicilerin balıklarıyla birlikte yüzüyor!`;
                modalCelebration.classList.add('active');
            }, 2400);
        }
    });

    document.getElementById('btnViewInOcean').addEventListener('click', () => {
        modalCelebration.classList.remove('active');
        aquariumSim.resetAquarium();
        currentActiveFish = null;
        switchTab('ocean');
    });

    document.getElementById('btnCreateNewFish').addEventListener('click', () => {
        modalCelebration.classList.remove('active');
        aquariumSim.resetAquarium();
        currentActiveFish = null;
        drawEngine.clear();
        switchTab('draw');
    });

    // 10. Topluluk Akvaryumları (Ziyaret Ekranı)
    function renderCommunityAquariums() {
        const grid = document.getElementById('communityGrid');
        if (!grid) return;

        const list = networkMgr.getCommunityAquariums();
        grid.innerHTML = '';

        if (list.length === 0) {
            grid.innerHTML = `<p style="color:var(--text-secondary); grid-column:1/-1; text-align:center;">Henüz aktif bir akvaryum bulunmuyor. Kendi balığını çizerek ilk akvaryumu açabilirsin!</p>`;
            return;
        }

        list.forEach(item => {
            const card = document.createElement('div');
            card.className = 'aquarium-card';

            const trailName = COSMETIC_CATALOG.trails.find(t => t.id === (item.equippedCosmetics && item.equippedCosmetics.trail))?.name || 'Doğal İzi';

            card.innerHTML = `
                <div class="card-fish-preview">
                    <img src="${item.dataUrl}" alt="${item.name}">
                </div>
                <div class="card-owner-info">
                    <h4>${item.name}</h4>
                    <p>@${item.creator}</p>
                </div>
                <div class="card-badges">
                    <span class="mini-badge">Lv. ${item.level || 1}</span>
                    <span class="mini-badge">O2: %${item.oxygen || 85}</span>
                    <span class="mini-badge">✨ ${trailName}</span>
                </div>
                <button class="primary-btn card-visit-btn" data-id="${item.id}">
                    🚀 Akvaryumu Ziyaret Et
                </button>
            `;

            const visitBtn = card.querySelector('.card-visit-btn');
            visitBtn.addEventListener('click', () => {
                aquariumSim.loadGuestAquarium(item);
                switchTab('pet');
            });

            grid.appendChild(card);
        });
    }

    document.getElementById('btnRefreshCommunity').addEventListener('click', () => {
        renderCommunityAquariums();
    });

    // 11. Kozmetik Dükkanı Mantığı (Shop Modal)
    btnOpenShop.addEventListener('click', () => {
        renderShopItems();
        modalShop.classList.add('active');
    });

    btnCloseShop.addEventListener('click', () => {
        modalShop.classList.remove('active');
    });

    const shopTabs = [
        { id: 'trails', btn: document.getElementById('shopTabTrails') },
        { id: 'decors', btn: document.getElementById('shopTabDecors') },
        { id: 'themes', btn: document.getElementById('shopTabThemes') }
    ];

    shopTabs.forEach(st => {
        if (st.btn) {
            st.btn.addEventListener('click', () => {
                shopTabs.forEach(s => s.btn.classList.remove('active'));
                st.btn.classList.add('active');
                activeShopCategory = st.id;
                renderShopItems();
            });
        }
    });

    function renderShopItems() {
        if (!shopItemsContainer) return;
        shopItemsContainer.innerHTML = '';

        const items = COSMETIC_CATALOG[activeShopCategory] || [];
        const owned = userInventory[activeShopCategory] || [];
        const currentEquipped = aquariumSim.equippedCosmetics[
            activeShopCategory === 'trails' ? 'trail' : (activeShopCategory === 'decors' ? 'decor' : 'theme')
        ];

        items.forEach(item => {
            const isOwned = owned.includes(item.id);
            const isEquipped = currentEquipped === item.id;

            const card = document.createElement('div');
            card.className = `shop-item-card ${isEquipped ? 'equipped' : ''}`;

            let actionBtnHtml = '';
            if (isEquipped) {
                actionBtnHtml = `<button class="btn-buy-equip btn-equipped" disabled>Kullanımda</button>`;
            } else if (isOwned) {
                actionBtnHtml = `<button class="btn-buy-equip btn-equip" data-action="equip" data-id="${item.id}">Kullan</button>`;
            } else {
                actionBtnHtml = `<button class="btn-buy-equip btn-buy" data-action="buy" data-id="${item.id}">Satın Al</button>`;
            }

            card.innerHTML = `
                <div class="item-icon-box">${item.icon}</div>
                <div class="item-name">${item.name}</div>
                <div class="item-desc">${item.desc}</div>
                <div class="item-footer">
                    <span class="item-price">${item.price === 0 ? 'Ücretsiz' : `${item.price} 🪙`}</span>
                    ${actionBtnHtml}
                </div>
            `;

            const btn = card.querySelector('.btn-buy-equip');
            if (btn && !btn.disabled) {
                btn.addEventListener('click', () => {
                    const action = btn.dataset.action;
                    if (action === 'buy') {
                        if (aquariumSim.gold >= item.price) {
                            aquariumSim.gold -= item.price;
                            userInventory[activeShopCategory].push(item.id);
                            saveUserInventory();

                            const type = activeShopCategory === 'trails' ? 'trail' : (activeShopCategory === 'decors' ? 'decor' : 'theme');
                            aquariumSim.equipCosmetic(type, item.id);
                            updateGoldUI(aquariumSim.gold);
                            renderShopItems();
                        } else {
                            alert(`Yeterli altının yok! Bu kozmetik için ${item.price} Gold gerekiyor. Yayında AFK kalarak veya balığına iyi bakarak altın toplayabilirsin!`);
                        }
                    } else if (action === 'equip') {
                        const type = activeShopCategory === 'trails' ? 'trail' : (activeShopCategory === 'decors' ? 'decor' : 'theme');
                        aquariumSim.equipCosmetic(type, item.id);
                        renderShopItems();
                    }
                });
            }

            shopItemsContainer.appendChild(card);
        });
    }

    // 12. Ortak Okyanus MMO Entegrasyonu
    oceanSim.loadStarterCommunityFish();

    const storedFishes = networkMgr.getStoredFishes();
    storedFishes.forEach(f => oceanSim.addFish(f, false));

    networkMgr.onFishReceivedCallback = (fishData, isNewArrival) => {
        oceanSim.addFish(fishData, isNewArrival);
        updateOceanStats();
    };

    function updateOceanStats() {
        if (statOceanFishCount) statOceanFishCount.textContent = oceanSim.fishes.length;
        if (statTotalReleased) statTotalReleased.textContent = Math.max(oceanSim.fishes.length, networkMgr.getStoredFishes().length);
    }

    document.getElementById('btnDropOceanFood').addEventListener('click', () => {
        const w = window.innerWidth;
        for (let i = 0; i < 5; i++) {
            oceanSim.dropFood(Math.random() * w, 50 + Math.random() * 100);
        }
        window.soundEngine && window.soundEngine.playBubble(1.4);
    });

    document.getElementById('btnToggleObsMode').addEventListener('click', () => {
        document.body.classList.toggle('obs-mode');
        oceanSim.resize();
    });

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.body.classList.remove('obs-mode');
            oceanSim.resize();
        }
    });

    // 13. Hızlı Test & Ses Kontrolleri
    const btnToggleFastMode = document.getElementById('btnToggleFastMode');
    btnToggleFastMode.addEventListener('click', () => {
        const isFast = aquariumSim.toggleFastTestMode();
        btnToggleFastMode.style.color = isFast ? '#53FC18' : 'inherit';
        btnToggleFastMode.style.borderColor = isFast ? '#53FC18' : 'rgba(255, 255, 255, 0.18)';
    });

    const btnToggleSound = document.getElementById('btnToggleSound');
    btnToggleSound.addEventListener('click', () => {
        const muted = window.soundEngine.toggleMute();
        btnToggleSound.textContent = muted ? '🔇' : '🔊';
    });

    window.addEventListener('click', () => {
        window.soundEngine && window.soundEngine.ensureContext();
    }, { once: true });

    // 14. URL Parametreleri Desteği & Geri Yükleme
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('obs') === '1') {
        document.body.classList.add('obs-mode');
        switchTab('ocean');
    } else if (urlParams.get('view') === 'ocean') {
        switchTab('ocean');
    } else if (urlParams.get('view') === 'community') {
        switchTab('community');
    }

    const savedPet = networkMgr.loadActivePetProgress();
    if (savedPet && savedPet.fishData && !urlParams.get('view')) {
        currentActiveFish = savedPet.fishData;
        aquariumSim.loadFish(savedPet.fishData, savedPet);
        hudFishAvatar.src = savedPet.fishData.dataUrl;
        hudFishName.textContent = savedPet.fishData.name;
        hudFishLevel.textContent = `Seviye ${savedPet.level || 1}/10 • @${savedPet.fishData.creator}`;
        switchTab('pet');
    }

    updateOceanStats();
    updateGoldUI(aquariumSim.gold);
});
