// 主要功能模块
class RealEstateETF {
    constructor() {
        this.init();
        this.bindEvents();
        this.initAnimations();
    }

    init() {
        // 初始化钱包状态
        this.walletConnected = false;
        this.currentAccount = null;
        
        // 初始化模拟数据
        this.mockData = {
            totalValue: 2547890123,
            dailyVolume: 89456789,
            activeETFs: 156,
            userBalance: 0,
            assets: [
                {
                    id: 1,
                    name: "纽约曼哈顿商业区",
                    location: "美国 · 纽约",
                    price: 125000000,
                    yield: 8.5,
                    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400",
                    badge: "热门"
                },
                {
                    id: 2,
                    name: "伦敦金融城办公区",
                    location: "英国 · 伦敦",
                    price: 98000000,
                    yield: 7.2,
                    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400",
                    badge: "推荐"
                },
                {
                    id: 3,
                    name: "东京银座商业区",
                    location: "日本 · 东京",
                    price: 87000000,
                    yield: 6.8,
                    image: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400",
                    badge: "新上线"
                }
            ]
        };

        // 检查是否已连接钱包
        this.checkWalletConnection();
    }

    bindEvents() {
        // 钱包连接事件
        const connectBtn = document.getElementById('connectWallet');
        if (connectBtn) {
            connectBtn.addEventListener('click', () => this.connectWallet());
        }

        // 移动端菜单
        const hamburger = document.querySelector('.hamburger');
        const navMenu = document.querySelector('.nav-menu');
        if (hamburger && navMenu) {
            hamburger.addEventListener('click', () => {
                hamburger.classList.toggle('active');
                navMenu.classList.toggle('active');
            });
        }

        // 滚动事件
        window.addEventListener('scroll', () => this.handleScroll());

        // 资产卡片点击事件
        this.bindAssetCardEvents();

        // 模态框事件
        this.bindModalEvents();

        // 表单提交事件
        this.bindFormEvents();
    }

    initAnimations() {
        // 初始化滚动动画
        this.observeElements();
        
        // 数字动画
        this.animateNumbers();
        
        // 粒子效果
        this.initParticles();
    }

    // 钱包连接功能
    async connectWallet() {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const accounts = await window.ethereum.request({
                    method: 'eth_requestAccounts'
                });
                
                this.currentAccount = accounts[0];
                this.walletConnected = true;
                this.updateWalletUI();
                this.showNotification('钱包连接成功！', 'success');
            } catch (error) {
                console.error('钱包连接失败:', error);
                this.showNotification('钱包连接失败，请重试', 'error');
            }
        } else {
            this.showNotification('请安装MetaMask钱包', 'warning');
            window.open('https://metamask.io/', '_blank');
        }
    }

    async checkWalletConnection() {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const accounts = await window.ethereum.request({
                    method: 'eth_accounts'
                });
                
                if (accounts.length > 0) {
                    this.currentAccount = accounts[0];
                    this.walletConnected = true;
                    this.updateWalletUI();
                }
            } catch (error) {
                console.error('检查钱包连接失败:', error);
            }
        }
    }

    updateWalletUI() {
        const connectBtn = document.getElementById('connectWallet');
        if (connectBtn && this.walletConnected) {
            const shortAddress = this.currentAccount.slice(0, 6) + '...' + this.currentAccount.slice(-4);
            connectBtn.innerHTML = `
                <i class="fas fa-check-circle"></i>
                ${shortAddress}
            `;
            connectBtn.style.background = '#10b981';
        }
    }

    // 滚动处理
    handleScroll() {
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            if (window.scrollY > 100) {
                navbar.style.background = 'rgba(255, 255, 255, 0.98)';
                navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
            } else {
                navbar.style.background = 'rgba(255, 255, 255, 0.95)';
                navbar.style.boxShadow = 'none';
            }
        }
    }

    // 观察元素并添加动画
    observeElements() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in-up');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        // 观察需要动画的元素
        const animateElements = document.querySelectorAll('.feature-card, .asset-card, .section-header');
        animateElements.forEach(el => observer.observe(el));
    }

    // 数字动画
    animateNumbers() {
        const numberElements = document.querySelectorAll('.stat-number');
        numberElements.forEach(el => {
            const target = parseInt(el.textContent.replace(/[^\d]/g, ''));
            this.animateValue(el, 0, target, 2000);
        });
    }

    animateValue(element, start, end, duration) {
        const startTime = performance.now();
        const originalText = element.textContent;
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const current = Math.floor(progress * (end - start) + start);
            
            if (originalText.includes('$')) {
                element.textContent = '$' + this.formatNumber(current) + (originalText.includes('+') ? '+' : '');
            } else if (originalText.includes('K')) {
                element.textContent = this.formatNumber(current) + 'K+';
            } else {
                element.textContent = this.formatNumber(current) + '+';
            }
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
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

    // 粒子效果
    initParticles() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const heroParticles = document.querySelector('.hero-particles');
        
        if (!heroParticles) return;
        
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        
        heroParticles.appendChild(canvas);
        
        const resizeCanvas = () => {
            canvas.width = heroParticles.offsetWidth;
            canvas.height = heroParticles.offsetHeight;
        };
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        const particles = [];
        const particleCount = 50;
        
        // 创建粒子
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                radius: Math.random() * 2 + 1,
                opacity: Math.random() * 0.5 + 0.2
            });
        }
        
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            particles.forEach(particle => {
                particle.x += particle.vx;
                particle.y += particle.vy;
                
                if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
                if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;
                
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
                ctx.fill();
            });
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }

    // 资产卡片事件
    bindAssetCardEvents() {
        const assetCards = document.querySelectorAll('.asset-card');
        assetCards.forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.classList.contains('btn')) return;
                this.showAssetDetails(card.dataset.assetId);
            });
        });
    }

    showAssetDetails(assetId) {
        const asset = this.mockData.assets.find(a => a.id == assetId);
        if (!asset) return;

        const modal = this.createModal('资产详情', `
            <div class="asset-detail">
                <img src="${asset.image}" alt="${asset.name}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 1rem;">
                <h3>${asset.name}</h3>
                <p><i class="fas fa-map-marker-alt"></i> ${asset.location}</p>
                <div class="detail-stats">
                    <div class="stat-row">
                        <span>市值</span>
                        <span>$${this.formatNumber(asset.price)}</span>
                    </div>
                    <div class="stat-row">
                        <span>年化收益</span>
                        <span class="positive">+${asset.yield}%</span>
                    </div>
                    <div class="stat-row">
                        <span>最小投资</span>
                        <span>$1,000</span>
                    </div>
                </div>
                <div class="investment-form">
                    <label>投资金额 (USD)</label>
                    <input type="number" id="investAmount" placeholder="输入投资金额" min="1000">
                    <button class="btn btn-primary" onclick="window.realEstateETF.invest()">
                        <i class="fas fa-coins"></i>
                        立即投资
                    </button>
                </div>
            </div>
        `);
    }

    invest() {
        const amount = document.getElementById('investAmount').value;
        if (!amount || amount < 1000) {
            this.showNotification('最小投资金额为 $1,000', 'warning');
            return;
        }

        if (!this.walletConnected) {
            this.showNotification('请先连接钱包', 'warning');
            return;
        }

        // 模拟投资流程
        this.showNotification('正在处理投资...', 'info');
        
        setTimeout(() => {
            this.showNotification(`成功投资 $${this.formatNumber(amount)}！`, 'success');
            this.closeModal();
        }, 2000);
    }

    // 模态框功能
    createModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // 绑定关闭事件
        modal.querySelector('.modal-close').addEventListener('click', () => this.closeModal());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal();
        });

        // 显示模态框
        setTimeout(() => modal.classList.add('active'), 10);
        
        return modal;
    }

    closeModal() {
        const modal = document.querySelector('.modal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        }
    }

    bindModalEvents() {
        // ESC键关闭模态框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    // 表单事件
    bindFormEvents() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFormSubmit(form);
            });
        });
    }

    handleFormSubmit(form) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        // 模拟表单提交
        this.showNotification('表单提交成功！', 'success');
        form.reset();
    }

    // 通知系统
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type}`;
        notification.innerHTML = `
            ${message}
            <button class="alert-close">&times;</button>
        `;

        // 样式
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.zIndex = '10001';
        notification.style.minWidth = '300px';
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        notification.style.transition = 'all 0.3s ease';

        document.body.appendChild(notification);

        // 绑定关闭事件
        notification.querySelector('.alert-close').addEventListener('click', () => {
            this.removeNotification(notification);
        });

        // 显示动画
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);

        // 自动关闭
        setTimeout(() => {
            this.removeNotification(notification);
        }, 5000);
    }

    removeNotification(notification) {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    // 实用工具函数
    static formatCurrency(amount) {
        return new Intl.NumberFormat('zh-CN', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    static debounce(func, wait) {
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

    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

// 通用组件类
class ComponentManager {
    constructor() {
        this.initComponents();
    }

    initComponents() {
        this.initTabs();
        this.initAccordions();
        this.initDropdowns();
        this.initTooltips();
    }

    initTabs() {
        const tabContainers = document.querySelectorAll('.tabs');
        tabContainers.forEach(container => {
            const tabs = container.querySelectorAll('.tab');
            const contents = document.querySelectorAll('.tab-content');

            tabs.forEach((tab, index) => {
                tab.addEventListener('click', () => {
                    // 移除所有活动状态
                    tabs.forEach(t => t.classList.remove('active'));
                    contents.forEach(c => c.classList.remove('active'));

                    // 添加活动状态
                    tab.classList.add('active');
                    if (contents[index]) {
                        contents[index].classList.add('active');
                    }
                });
            });
        });
    }

    initAccordions() {
        const accordionItems = document.querySelectorAll('.accordion-item');
        accordionItems.forEach(item => {
            const header = item.querySelector('.accordion-header');
            header.addEventListener('click', () => {
                const isActive = item.classList.contains('active');
                
                // 关闭其他手风琴项
                accordionItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('active');
                    }
                });

                // 切换当前项
                item.classList.toggle('active', !isActive);
            });
        });
    }

    initDropdowns() {
        const dropdowns = document.querySelectorAll('.dropdown');
        dropdowns.forEach(dropdown => {
            const toggle = dropdown.querySelector('.dropdown-toggle');
            
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // 关闭其他下拉菜单
                dropdowns.forEach(otherDropdown => {
                    if (otherDropdown !== dropdown) {
                        otherDropdown.classList.remove('active');
                    }
                });

                dropdown.classList.toggle('active');
            });
        });

        // 点击外部关闭下拉菜单
        document.addEventListener('click', () => {
            dropdowns.forEach(dropdown => {
                dropdown.classList.remove('active');
            });
        });
    }

    initTooltips() {
        const tooltips = document.querySelectorAll('.tooltip');
        tooltips.forEach(tooltip => {
            let timeout;

            tooltip.addEventListener('mouseenter', () => {
                clearTimeout(timeout);
                const tooltipText = tooltip.querySelector('.tooltip-text');
                if (tooltipText) {
                    tooltipText.style.opacity = '1';
                    tooltipText.style.visibility = 'visible';
                }
            });

            tooltip.addEventListener('mouseleave', () => {
                const tooltipText = tooltip.querySelector('.tooltip-text');
                if (tooltipText) {
                    timeout = setTimeout(() => {
                        tooltipText.style.opacity = '0';
                        tooltipText.style.visibility = 'hidden';
                    }, 100);
                }
            });
        });
    }
}

// 图表组件
class ChartManager {
    constructor() {
        this.charts = {};
    }

    createLineChart(containerId, data, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // 简单的SVG图表实现
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '300');
        svg.style.background = '#f9fafb';
        svg.style.borderRadius = '8px';

        // 这里可以实现完整的图表绘制逻辑
        // 为了简化，我们创建一个模拟图表
        const mockPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        mockPath.setAttribute('d', 'M 0 150 Q 100 100 200 120 T 400 110');
        mockPath.setAttribute('stroke', '#6366f1');
        mockPath.setAttribute('stroke-width', '3');
        mockPath.setAttribute('fill', 'none');

        svg.appendChild(mockPath);
        container.appendChild(svg);

        return svg;
    }

    createDoughnutChart(containerId, data, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // 创建简单的环形图
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '200');
        svg.setAttribute('height', '200');

        const centerX = 100;
        const centerY = 100;
        const radius = 80;
        const innerRadius = 50;

        // 模拟数据段
        const segments = [
            { value: 40, color: '#6366f1' },
            { value: 30, color: '#10b981' },
            { value: 20, color: '#f59e0b' },
            { value: 10, color: '#ef4444' }
        ];

        let currentAngle = 0;
        segments.forEach(segment => {
            const angle = (segment.value / 100) * 2 * Math.PI;
            
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const largeArcFlag = angle > Math.PI ? 1 : 0;
            
            const x1 = centerX + radius * Math.cos(currentAngle);
            const y1 = centerY + radius * Math.sin(currentAngle);
            const x2 = centerX + radius * Math.cos(currentAngle + angle);
            const y2 = centerY + radius * Math.sin(currentAngle + angle);
            
            const x3 = centerX + innerRadius * Math.cos(currentAngle + angle);
            const y3 = centerY + innerRadius * Math.sin(currentAngle + angle);
            const x4 = centerX + innerRadius * Math.cos(currentAngle);
            const y4 = centerY + innerRadius * Math.sin(currentAngle);
            
            const d = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4} Z`;
            
            path.setAttribute('d', d);
            path.setAttribute('fill', segment.color);
            
            svg.appendChild(path);
            currentAngle += angle;
        });

        container.appendChild(svg);
        return svg;
    }
}

// 性能监控
class PerformanceMonitor {
    constructor() {
        this.metrics = {};
        this.init();
    }

    init() {
        // 监控页面加载性能
        window.addEventListener('load', () => {
            this.measureLoadTime();
        });

        // 监控用户交互
        this.trackUserInteractions();
    }

    measureLoadTime() {
        const navigation = performance.getEntriesByType('navigation')[0];
        this.metrics.loadTime = navigation.loadEventEnd - navigation.loadEventStart;
        this.metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
        
        console.log('页面性能指标:', this.metrics);
    }

    trackUserInteractions() {
        let interactionCount = 0;
        
        ['click', 'scroll', 'keydown'].forEach(eventType => {
            document.addEventListener(eventType, () => {
                interactionCount++;
            }, { passive: true });
        });

        // 每分钟记录一次交互数据
        setInterval(() => {
            if (interactionCount > 0) {
                console.log(`用户交互次数: ${interactionCount}`);
                interactionCount = 0;
            }
        }, 60000);
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    // 全局实例
    window.realEstateETF = new RealEstateETF();
    window.componentManager = new ComponentManager();
    window.chartManager = new ChartManager();
    window.performanceMonitor = new PerformanceMonitor();

    // 页面加载完成提示
    console.log('🏢 房地产ETF平台已加载完成');
    console.log('💡 支持的功能: 钱包连接、资产浏览、投资组合管理');
});

// 错误处理
window.addEventListener('error', (e) => {
    console.error('页面错误:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('未处理的Promise拒绝:', e.reason);
});

// 导出给其他脚本使用
window.RealEstateETF = RealEstateETF;
window.ComponentManager = ComponentManager;
window.ChartManager = ChartManager; 