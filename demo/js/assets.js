// 资产页面管理类
class AssetsManager {
    constructor() {
        this.currentView = 'grid';
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.filteredAssets = [];
        this.bookmarkedAssets = JSON.parse(localStorage.getItem('bookmarkedAssets') || '[]');
        
        this.mockAssets = [
            {
                id: 1,
                name: "纽约曼哈顿商业区",
                location: "美国 · 纽约",
                price: 125000000,
                yield: 8.5,
                image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400",
                type: "商业地产",
                region: "北美",
                tags: ["热门", "高收益"],
                minInvestment: 1000,
                totalUnits: 10000,
                soldUnits: 7500,
                description: "位于纽约市中心的优质商业地产，包含多个办公楼和零售空间。"
            },
            {
                id: 2,
                name: "伦敦金融城办公区",
                location: "英国 · 伦敦",
                price: 98000000,
                yield: 7.2,
                image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400",
                type: "商业地产",
                region: "欧洲",
                tags: ["推荐", "稳定收益"],
                minInvestment: 1000,
                totalUnits: 8000,
                soldUnits: 6000,
                description: "伦敦金融城核心区域的现代化办公楼群，租客质量优异。"
            },
            {
                id: 3,
                name: "东京银座商业区",
                location: "日本 · 东京",
                price: 87000000,
                yield: 6.8,
                image: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400",
                type: "零售地产",
                region: "亚太",
                tags: ["新上线"],
                minInvestment: 1000,
                totalUnits: 7000,
                soldUnits: 2100,
                description: "东京银座高端零售商业区，汇集全球奢侈品牌。"
            },
            {
                id: 4,
                name: "新加坡CBD写字楼",
                location: "新加坡 · 滨海湾",
                price: 156000000,
                yield: 9.2,
                image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400",
                type: "商业地产",
                region: "亚太",
                tags: ["高收益", "新兴市场"],
                minInvestment: 1500,
                totalUnits: 12000,
                soldUnits: 9600,
                description: "新加坡金融中心的甲级写字楼，享有海景和城市景观。"
            },
            {
                id: 5,
                name: "洛杉矶豪华住宅区",
                location: "美国 · 洛杉矶",
                price: 234000000,
                yield: 5.8,
                image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400",
                type: "住宅地产",
                region: "北美",
                tags: ["豪华", "长期稳定"],
                minInvestment: 2000,
                totalUnits: 15000,
                soldUnits: 11250,
                description: "洛杉矶比佛利山庄附近的高端住宅社区。"
            },
            {
                id: 6,
                name: "迪拜商业中心",
                location: "阿联酋 · 迪拜",
                price: 178000000,
                yield: 10.5,
                image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400",
                type: "商业地产",
                region: "中东",
                tags: ["超高收益", "新兴"],
                minInvestment: 1000,
                totalUnits: 14000,
                soldUnits: 8400,
                description: "迪拜国际金融中心的现代化商业综合体。"
            },
            {
                id: 7,
                name: "巴黎香榭丽舍商业街",
                location: "法国 · 巴黎",
                price: 142000000,
                yield: 6.5,
                image: "https://images.unsplash.com/photo-1549144511-f099e773c147?w=400",
                type: "零售地产",
                region: "欧洲",
                tags: ["历史悠久", "稳定"],
                minInvestment: 1500,
                totalUnits: 9500,
                soldUnits: 7125,
                description: "巴黎香榭丽舍大街的经典商业物业，历史悠久。"
            },
            {
                id: 8,
                name: "悉尼海港城住宅",
                location: "澳大利亚 · 悉尼",
                price: 89000000,
                yield: 7.8,
                image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400",
                type: "住宅地产",
                region: "亚太",
                tags: ["海景", "优质"],
                minInvestment: 1200,
                totalUnits: 6800,
                soldUnits: 5100,
                description: "悉尼海港城的高端住宅公寓，享有海港美景。"
            },
            {
                id: 9,
                name: "德国法兰克福商务区",
                location: "德国 · 法兰克福",
                price: 167000000,
                yield: 6.2,
                image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
                type: "商业地产",
                region: "欧洲",
                tags: ["金融中心", "稳健"],
                minInvestment: 1000,
                totalUnits: 11000,
                soldUnits: 8250,
                description: "德国法兰克福金融区的现代化办公建筑群。"
            },
            {
                id: 10,
                name: "首尔江南区商业综合体",
                location: "韩国 · 首尔",
                price: 198000000,
                yield: 8.9,
                image: "https://images.unsplash.com/photo-1549144511-f099e773c147?w=400",
                type: "商业地产",
                region: "亚太",
                tags: ["科技中心", "高增长"],
                minInvestment: 1300,
                totalUnits: 13500,
                soldUnits: 10800,
                description: "首尔江南区的大型商业综合体，科技公司聚集地。"
            },
            {
                id: 11,
                name: "多伦多金融区写字楼",
                location: "加拿大 · 多伦多",
                price: 134000000,
                yield: 7.1,
                image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400",
                type: "商业地产",
                region: "北美",
                tags: ["稳定增长", "多元化"],
                minInvestment: 1100,
                totalUnits: 9200,
                soldUnits: 6900,
                description: "多伦多金融区的优质写字楼，租客结构稳定。"
            },
            {
                id: 12,
                name: "香港中环商业大厦",
                location: "中国 · 香港",
                price: 276000000,
                yield: 5.2,
                image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400",
                type: "商业地产",
                region: "亚太",
                tags: ["金融枢纽", "高端"],
                minInvestment: 2500,
                totalUnits: 18000,
                soldUnits: 16200,
                description: "香港中环核心商业区的超甲级写字楼。"
            }
        ];

        this.filteredAssets = [...this.mockAssets];
        this.init();
    }

    init() {
        this.renderAssets();
        this.bindEvents();
        this.updateInfo();
    }

    bindEvents() {
        // 视图切换
        const viewButtons = document.querySelectorAll('.view-btn');
        viewButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchView(e.target.closest('.view-btn').dataset.view);
            });
        });

        // 筛选功能
        const filterBtn = document.querySelector('.filters-section .btn-primary');
        if (filterBtn) {
            filterBtn.addEventListener('click', () => this.applyFilters());
        }

        // 搜索功能
        const searchInput = document.querySelector('.search-box input');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(() => this.applyFilters(), 300));
        }

        // 排序功能
        const sortSelect = document.querySelector('.sort-controls select');
        if (sortSelect) {
            sortSelect.addEventListener('change', () => this.applySorting());
        }

        // 分页功能
        this.bindPaginationEvents();
    }

    switchView(view) {
        this.currentView = view;
        
        // 更新按钮状态
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });

        // 更新网格类
        const grid = document.getElementById('assetsGrid');
        if (view === 'list') {
            grid.classList.add('list-view');
        } else {
            grid.classList.remove('list-view');
        }

        this.renderAssets();
    }

    renderAssets() {
        const grid = document.getElementById('assetsGrid');
        if (!grid) return;

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const assetsToShow = this.filteredAssets.slice(startIndex, endIndex);

        if (this.currentView === 'grid') {
            grid.className = 'assets-grid';
            grid.innerHTML = assetsToShow.map(asset => this.createAssetCard(asset)).join('');
        } else {
            grid.className = 'assets-list';
            grid.innerHTML = assetsToShow.map(asset => this.createAssetListItem(asset)).join('');
        }

        // 绑定卡片事件
        this.bindAssetEvents();
    }

    createAssetCard(asset) {
        const isBookmarked = this.bookmarkedAssets.includes(asset.id);
        const progress = (asset.soldUnits / asset.totalUnits) * 100;

        return `
            <div class="asset-card-extended" data-asset-id="${asset.id}">
                <div class="asset-image-extended">
                    <img src="${asset.image}" alt="${asset.name}" loading="lazy">
                    <div class="asset-tags">
                        ${asset.tags.map(tag => `<span class="asset-tag">${tag}</span>`).join('')}
                    </div>
                    <button class="asset-bookmark ${isBookmarked ? 'bookmarked' : ''}" data-asset-id="${asset.id}">
                        <i class="fas fa-bookmark"></i>
                    </button>
                </div>
                <div class="asset-info-extended">
                    <div class="asset-header">
                        <div class="asset-price">$${this.formatNumber(asset.price)}</div>
                        <div class="asset-yield">+${asset.yield}%</div>
                    </div>
                    <h3>${asset.name}</h3>
                    <p class="asset-location">
                        <i class="fas fa-map-marker-alt"></i>
                        ${asset.location}
                    </p>
                    <div class="asset-details">
                        <div class="detail-item">
                            <span class="detail-label">最小投资</span>
                            <span class="detail-value">$${asset.minInvestment}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">资产类型</span>
                            <span class="detail-value">${asset.type}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">发行进度</span>
                            <span class="detail-value">${progress.toFixed(1)}%</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">剩余份额</span>
                            <span class="detail-value">${asset.totalUnits - asset.soldUnits}</span>
                        </div>
                    </div>
                    <div class="progress">
                        <div class="progress-bar" style="width: ${progress}%"></div>
                    </div>
                    <div class="asset-actions">
                        <button class="btn-invest" data-asset-id="${asset.id}">
                            <i class="fas fa-coins"></i>
                            立即投资
                        </button>
                        <button class="btn-details" data-asset-id="${asset.id}">
                            查看详情
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    createAssetListItem(asset) {
        const isBookmarked = this.bookmarkedAssets.includes(asset.id);
        const progress = (asset.soldUnits / asset.totalUnits) * 100;

        return `
            <div class="asset-list-item" data-asset-id="${asset.id}">
                <div class="asset-list-image">
                    <img src="${asset.image}" alt="${asset.name}" loading="lazy">
                </div>
                <div class="asset-list-content">
                    <div class="asset-list-header">
                        <h3>${asset.name}</h3>
                        <div class="asset-price">$${this.formatNumber(asset.price)}</div>
                    </div>
                    <p class="asset-location">
                        <i class="fas fa-map-marker-alt"></i>
                        ${asset.location}
                    </p>
                    <div class="asset-list-details">
                        <span class="detail-item">
                            <i class="fas fa-chart-line"></i>
                            年化收益: <strong>+${asset.yield}%</strong>
                        </span>
                        <span class="detail-item">
                            <i class="fas fa-building"></i>
                            类型: <strong>${asset.type}</strong>
                        </span>
                        <span class="detail-item">
                            <i class="fas fa-coins"></i>
                            最小投资: <strong>$${asset.minInvestment}</strong>
                        </span>
                    </div>
                    <div class="asset-tags">
                        ${asset.tags.map(tag => `<span class="asset-tag">${tag}</span>`).join('')}
                    </div>
                </div>
                <div class="asset-list-actions">
                    <button class="asset-bookmark ${isBookmarked ? 'bookmarked' : ''}" data-asset-id="${asset.id}">
                        <i class="fas fa-bookmark"></i>
                    </button>
                    <button class="btn-invest" data-asset-id="${asset.id}">
                        <i class="fas fa-coins"></i>
                        投资
                    </button>
                    <button class="btn-details" data-asset-id="${asset.id}">
                        详情
                    </button>
                </div>
            </div>
        `;
    }

    bindAssetEvents() {
        // 收藏功能
        const bookmarkBtns = document.querySelectorAll('.asset-bookmark');
        bookmarkBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleBookmark(parseInt(btn.dataset.assetId));
            });
        });

        // 投资按钮
        const investBtns = document.querySelectorAll('.btn-invest');
        investBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showInvestModal(parseInt(btn.dataset.assetId));
            });
        });

        // 详情按钮
        const detailBtns = document.querySelectorAll('.btn-details');
        detailBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showAssetDetails(parseInt(btn.dataset.assetId));
            });
        });
    }

    toggleBookmark(assetId) {
        const index = this.bookmarkedAssets.indexOf(assetId);
        if (index > -1) {
            this.bookmarkedAssets.splice(index, 1);
        } else {
            this.bookmarkedAssets.push(assetId);
        }
        
        localStorage.setItem('bookmarkedAssets', JSON.stringify(this.bookmarkedAssets));
        
        // 更新UI
        const bookmarkBtn = document.querySelector(`[data-asset-id="${assetId}"].asset-bookmark`);
        if (bookmarkBtn) {
            bookmarkBtn.classList.toggle('bookmarked');
        }

        // 显示通知
        const message = index > -1 ? '已取消收藏' : '已添加到收藏';
        window.realEstateETF?.showNotification(message, 'success');
    }

    showInvestModal(assetId) {
        const asset = this.mockAssets.find(a => a.id === assetId);
        if (!asset) return;

        const modal = window.realEstateETF?.createModal('投资确认', `
            <div class="invest-modal">
                <div class="asset-summary">
                    <img src="${asset.image}" alt="${asset.name}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px; margin-bottom: 1rem;">
                    <h4>${asset.name}</h4>
                    <p><i class="fas fa-map-marker-alt"></i> ${asset.location}</p>
                    <div class="summary-stats">
                        <div class="stat">
                            <span class="label">年化收益</span>
                            <span class="value positive">+${asset.yield}%</span>
                        </div>
                        <div class="stat">
                            <span class="label">最小投资</span>
                            <span class="value">$${asset.minInvestment}</span>
                        </div>
                    </div>
                </div>
                <div class="investment-form">
                    <div class="form-group">
                        <label class="form-label">投资金额 (USD)</label>
                        <input type="number" id="investAmount" class="form-input" 
                               placeholder="输入投资金额" min="${asset.minInvestment}" value="${asset.minInvestment}">
                        <small class="form-error" id="amountError"></small>
                    </div>
                    <div class="form-group">
                        <label class="form-label">预期收益</label>
                        <input type="text" id="expectedReturn" class="form-input" readonly>
                    </div>
                    <div class="investment-summary">
                        <div class="summary-row">
                            <span>投资金额</span>
                            <span id="summaryAmount">$${asset.minInvestment}</span>
                        </div>
                        <div class="summary-row">
                            <span>平台费用 (2%)</span>
                            <span id="summaryFee">$${(asset.minInvestment * 0.02).toFixed(2)}</span>
                        </div>
                        <div class="summary-row total">
                            <span>总计</span>
                            <span id="summaryTotal">$${(asset.minInvestment * 1.02).toFixed(2)}</span>
                        </div>
                    </div>
                    <button class="btn btn-primary" style="width: 100%; margin-top: 1rem;" 
                            onclick="window.assetsManager.processInvestment(${assetId})">
                        <i class="fas fa-coins"></i>
                        确认投资
                    </button>
                </div>
            </div>
        `);

        // 绑定投资金额变化事件
        const amountInput = document.getElementById('investAmount');
        const expectedReturnInput = document.getElementById('expectedReturn');
        
        const updateCalculations = () => {
            const amount = parseFloat(amountInput.value) || 0;
            const expectedReturn = (amount * asset.yield / 100).toFixed(2);
            const fee = (amount * 0.02).toFixed(2);
            const total = (amount * 1.02).toFixed(2);
            
            expectedReturnInput.value = `$${expectedReturn} / 年`;
            document.getElementById('summaryAmount').textContent = `$${amount}`;
            document.getElementById('summaryFee').textContent = `$${fee}`;
            document.getElementById('summaryTotal').textContent = `$${total}`;
        };

        amountInput.addEventListener('input', updateCalculations);
        updateCalculations();
    }

    processInvestment(assetId) {
        const amount = parseFloat(document.getElementById('investAmount').value);
        const asset = this.mockAssets.find(a => a.id === assetId);
        
        if (!amount || amount < asset.minInvestment) {
            document.getElementById('amountError').textContent = `最小投资金额为 $${asset.minInvestment}`;
            return;
        }

        if (!window.realEstateETF?.walletConnected) {
            window.realEstateETF?.showNotification('请先连接钱包', 'warning');
            return;
        }

        // 模拟投资流程
        window.realEstateETF?.showNotification('正在处理投资交易...', 'info');
        
        setTimeout(() => {
            window.realEstateETF?.showNotification(
                `成功投资 $${this.formatNumber(amount)} 到 ${asset.name}！`, 
                'success'
            );
            window.realEstateETF?.closeModal();
            
            // 更新资产的已售份额
            const unitsToAdd = Math.floor(amount / (asset.price / asset.totalUnits));
            asset.soldUnits = Math.min(asset.soldUnits + unitsToAdd, asset.totalUnits);
            this.renderAssets();
        }, 2000);
    }

    showAssetDetails(assetId) {
        const asset = this.mockAssets.find(a => a.id === assetId);
        if (!asset) return;

        const progress = (asset.soldUnits / asset.totalUnits) * 100;
        
        const modal = window.realEstateETF?.createModal('资产详情', `
            <div class="asset-detail-modal">
                <div class="detail-header">
                    <img src="${asset.image}" alt="${asset.name}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px;">
                    <div class="detail-title">
                        <h3>${asset.name}</h3>
                        <p><i class="fas fa-map-marker-alt"></i> ${asset.location}</p>
                        <div class="detail-tags">
                            ${asset.tags.map(tag => `<span class="badge badge-primary">${tag}</span>`).join('')}
                        </div>
                    </div>
                </div>
                
                <div class="detail-stats-grid">
                    <div class="stat-card">
                        <i class="fas fa-dollar-sign"></i>
                        <div class="stat-info">
                            <span class="stat-label">总市值</span>
                            <span class="stat-value">$${this.formatNumber(asset.price)}</span>
                        </div>
                    </div>
                    <div class="stat-card">
                        <i class="fas fa-chart-line"></i>
                        <div class="stat-info">
                            <span class="stat-label">年化收益</span>
                            <span class="stat-value positive">+${asset.yield}%</span>
                        </div>
                    </div>
                    <div class="stat-card">
                        <i class="fas fa-coins"></i>
                        <div class="stat-info">
                            <span class="stat-label">最小投资</span>
                            <span class="stat-value">$${asset.minInvestment}</span>
                        </div>
                    </div>
                    <div class="stat-card">
                        <i class="fas fa-building"></i>
                        <div class="stat-info">
                            <span class="stat-label">资产类型</span>
                            <span class="stat-value">${asset.type}</span>
                        </div>
                    </div>
                </div>

                <div class="progress-section">
                    <div class="progress-text">
                        <span>发行进度</span>
                        <span>${progress.toFixed(1)}%</span>
                    </div>
                    <div class="progress">
                        <div class="progress-bar" style="width: ${progress}%"></div>
                    </div>
                    <div class="progress-details">
                        <span>已售: ${asset.soldUnits.toLocaleString()} 份</span>
                        <span>剩余: ${(asset.totalUnits - asset.soldUnits).toLocaleString()} 份</span>
                    </div>
                </div>

                <div class="asset-description">
                    <h4>项目描述</h4>
                    <p>${asset.description}</p>
                </div>

                <div class="detail-actions">
                    <button class="btn btn-primary" onclick="window.assetsManager.showInvestModal(${assetId})">
                        <i class="fas fa-coins"></i>
                        立即投资
                    </button>
                    <button class="btn btn-outline" onclick="window.assetsManager.toggleBookmark(${assetId})">
                        <i class="fas fa-bookmark"></i>
                        ${this.bookmarkedAssets.includes(assetId) ? '取消收藏' : '添加收藏'}
                    </button>
                </div>
            </div>
        `);
    }

    applyFilters() {
        const searchTerm = document.querySelector('.search-box input').value.toLowerCase();
        const regionFilter = document.querySelector('.filter-group:nth-child(1) .dropdown-toggle span').textContent;
        const typeFilter = document.querySelector('.filter-group:nth-child(2) .dropdown-toggle span').textContent;
        const yieldFilter = document.querySelector('.filter-group:nth-child(3) .dropdown-toggle span').textContent;

        this.filteredAssets = this.mockAssets.filter(asset => {
            const matchesSearch = !searchTerm || 
                asset.name.toLowerCase().includes(searchTerm) ||
                asset.location.toLowerCase().includes(searchTerm);
            
            const matchesRegion = regionFilter === '所有地区' || asset.region === regionFilter;
            const matchesType = typeFilter === '所有类型' || asset.type === typeFilter;
            
            let matchesYield = true;
            if (yieldFilter === '0-5%') {
                matchesYield = asset.yield >= 0 && asset.yield <= 5;
            } else if (yieldFilter === '5-10%') {
                matchesYield = asset.yield > 5 && asset.yield <= 10;
            } else if (yieldFilter === '10%+') {
                matchesYield = asset.yield > 10;
            }

            return matchesSearch && matchesRegion && matchesType && matchesYield;
        });

        this.currentPage = 1;
        this.updateInfo();
        this.renderAssets();
        this.updatePagination();
    }

    applySorting() {
        const sortBy = document.querySelector('.sort-controls select').value;
        
        this.filteredAssets.sort((a, b) => {
            switch (sortBy) {
                case '收益率由高到低':
                    return b.yield - a.yield;
                case '收益率由低到高':
                    return a.yield - b.yield;
                case '市值由大到小':
                    return b.price - a.price;
                case '市值由小到大':
                    return a.price - b.price;
                default: // 最新上线
                    return b.id - a.id;
            }
        });

        this.renderAssets();
    }

    updateInfo() {
        const sortInfo = document.querySelector('.sort-info span');
        if (sortInfo) {
            const start = (this.currentPage - 1) * this.itemsPerPage + 1;
            const end = Math.min(start + this.itemsPerPage - 1, this.filteredAssets.length);
            sortInfo.textContent = `显示 ${start}-${end} of ${this.filteredAssets.length} 项资产`;
        }
    }

    bindPaginationEvents() {
        const paginationItems = document.querySelectorAll('.pagination-item');
        paginationItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = parseInt(item.textContent);
                if (!isNaN(page)) {
                    this.currentPage = page;
                    this.renderAssets();
                    this.updateInfo();
                    this.updatePagination();
                }
            });
        });
    }

    updatePagination() {
        const totalPages = Math.ceil(this.filteredAssets.length / this.itemsPerPage);
        const pagination = document.querySelector('.pagination');
        
        if (!pagination) return;

        let paginationHTML = '';
        
        // 上一页
        paginationHTML += `
            <a href="#" class="pagination-item ${this.currentPage === 1 ? 'disabled' : ''}" data-page="${this.currentPage - 1}">
                <i class="fas fa-chevron-left"></i>
            </a>
        `;

        // 页码
        for (let i = 1; i <= Math.min(totalPages, 5); i++) {
            paginationHTML += `
                <a href="#" class="pagination-item ${i === this.currentPage ? 'active' : ''}" data-page="${i}">
                    ${i}
                </a>
            `;
        }

        if (totalPages > 5) {
            paginationHTML += '<span class="pagination-item">...</span>';
            paginationHTML += `
                <a href="#" class="pagination-item" data-page="${totalPages}">
                    ${totalPages}
                </a>
            `;
        }

        // 下一页
        paginationHTML += `
            <a href="#" class="pagination-item ${this.currentPage === totalPages ? 'disabled' : ''}" data-page="${this.currentPage + 1}">
                <i class="fas fa-chevron-right"></i>
            </a>
        `;

        pagination.innerHTML = paginationHTML;
        
        // 重新绑定事件
        this.bindPaginationEvents();
    }

    formatNumber(num) {
        if (num >= 1000000000) {
            return (num / 1000000000).toFixed(1) + 'B';
        } else if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    window.assetsManager = new AssetsManager();
    console.log('📊 资产展示页面已加载完成');
});

// 添加列表视图样式
const listViewStyles = document.createElement('style');
listViewStyles.textContent = `
    .assets-list {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .asset-list-item {
        display: flex;
        background: var(--bg-card);
        border-radius: var(--border-radius-lg);
        overflow: hidden;
        box-shadow: var(--shadow-sm);
        border: 1px solid var(--border-color);
        transition: var(--transition);
    }

    .asset-list-item:hover {
        box-shadow: var(--shadow-md);
        border-color: var(--border-hover);
    }

    .asset-list-image {
        width: 200px;
        height: 150px;
        flex-shrink: 0;
    }

    .asset-list-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .asset-list-content {
        flex: 1;
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .asset-list-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
    }

    .asset-list-header h3 {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
    }

    .asset-list-details {
        display: flex;
        gap: 2rem;
        flex-wrap: wrap;
    }

    .asset-list-details .detail-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: var(--text-secondary);
        font-size: 0.875rem;
    }

    .asset-list-details .detail-item i {
        color: var(--primary-color);
    }

    .asset-list-actions {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 1.5rem;
        gap: 1rem;
        border-left: 1px solid var(--border-color);
        min-width: 150px;
    }

    .asset-list-actions .btn-invest,
    .asset-list-actions .btn-details {
        width: 100%;
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
    }

    .detail-stats-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
        margin: 1.5rem 0;
    }

    .stat-card {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        background: var(--bg-secondary);
        border-radius: var(--border-radius);
    }

    .stat-card i {
        font-size: 1.5rem;
        color: var(--primary-color);
    }

    .stat-info {
        display: flex;
        flex-direction: column;
    }

    .stat-label {
        font-size: 0.75rem;
        color: var(--text-light);
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .stat-value {
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-primary);
    }

    .investment-summary {
        background: var(--bg-secondary);
        padding: 1rem;
        border-radius: var(--border-radius);
        margin-top: 1rem;
    }

    .summary-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5rem;
    }

    .summary-row.total {
        border-top: 1px solid var(--border-color);
        padding-top: 0.5rem;
        font-weight: 600;
        color: var(--primary-color);
    }

    .progress-section {
        margin: 1.5rem 0;
    }

    .progress-details {
        display: flex;
        justify-content: space-between;
        margin-top: 0.5rem;
        font-size: 0.875rem;
        color: var(--text-secondary);
    }

    .detail-actions {
        display: flex;
        gap: 1rem;
        margin-top: 1.5rem;
    }

    .detail-actions .btn {
        flex: 1;
    }

    @media (max-width: 768px) {
        .asset-list-item {
            flex-direction: column;
        }

        .asset-list-image {
            width: 100%;
            height: 200px;
        }

        .asset-list-actions {
            flex-direction: row;
            border-left: none;
            border-top: 1px solid var(--border-color);
            min-width: auto;
        }

        .asset-list-details {
            flex-direction: column;
            gap: 0.5rem;
        }

        .detail-stats-grid {
            grid-template-columns: 1fr;
        }

        .detail-actions {
            flex-direction: column;
        }
    }
`;

document.head.appendChild(listViewStyles); 